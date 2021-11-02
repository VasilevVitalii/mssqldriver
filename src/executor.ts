import { ConnectionConfig, Connection, Request } from 'tedious'
import * as vv from 'vv-common'
import * as ec from './executor.common'
import { performance } from 'perf_hooks'

export type TBatchOptionsLock = {
    key: string,
    wait: number,
    database: string
}

export type TBatchOptions = {
    /** use this database before start query, default - undefined (use database from connection)*/
    database?: string,
    /**where return tables - 'none' - never, number - chunked return each this msec value, 'cumulative' - in end result object; default - 'cumulative'*/
    receiveTables?: ('none' | number | 'cumulative'),
    /**where return messages - 'none' - never, 'directly' - each message return immediately, 'cumulative' - in end result object; default - 'cumulative'*/
    receiveMessage?: ('none' | 'directly' | 'cumulative'),
    /** mode format cells from rows from tables, 'native'- by datatypes, example for column 'datetime', if 'native' - type 'Date', if 'string' - type string with 126 format; default = 'native'*/
    formatCells?: ('native' | 'string'),
    /**get spid, for (example) kill process, default - false */
    hasSpid?: boolean,
    /**protect competitive exec query, based on sp_getapplock*/
    lock?: TBatchOptionsLock,
}

export type TColumn = {
    name: string,
    type: string,
    precision: number,
    scale: number,
    len: number,
    isNullable: boolean,
    isIdentity: boolean,
    isReadOnly: boolean,
}

export type TMessage = {
    queryIdx: number,
    isError: boolean,
    message: string,
    lineNumber: number,
    procName?: string
}

export type TTable = {
    queryIdx: number,
    columns: TColumn[],
    rows: any[]
}

export type TQuery = {
    kind: ('spid' | 'lock.on' | 'lock.off' | 'query'),
    script: string,
    queryIdx: number,
    isExecuted?: boolean,
    error?: Error,
    tables?: TTable[],
    messages?: TMessage[]
}

type TRequest =
    { kind: 'before.exec', query: TQuery } |
    { kind: 'after.exec', query: TQuery } |
    { kind: 'spid', spid: number } |
    { kind: 'columns', columns: TColumn[] } |
    { kind: 'row', row: any } |
    { kind: 'stop' }

export type TExecResult =
    { kind: 'spid', spid: number } |
    { kind: 'message', message: TMessage } |
    { kind: 'columns', columns: TColumn[], queryIdx: number } |
    { kind: 'rows', rows: any[] } |
    { kind: 'finish', finish: {error?: Error, tables: TTable[], messages: TMessage[] } }

export function Exec(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions, query: string | string[], callback: (result: TExecResult) => void) {
    const conn = ec.BuildConnection(optionsTds, optionsBatch)
    const q = ec.BuildQueries(conn.optionsBatch, query)

    let currentQuery = undefined as TQuery
    let currentRows = undefined as any[]

    if (conn.optionsBatch.receiveMessage !== 'none') {
        conn.connection.on('infoMessage', messageRaw => {
            if (currentQuery?.kind !== 'query') return
            const message = {
                queryIdx: currentQuery.queryIdx,
                isError: false,
                message: messageRaw.message,
                lineNumber: messageRaw.lineNumber,
                procName: messageRaw.procName === undefined || messageRaw.procName === '' ? undefined : messageRaw.procName
            } as TMessage

            if (conn.optionsBatch.receiveMessage === 'cumulative') {
                if (!currentQuery.messages) currentQuery.messages = []
                currentQuery.messages.push(message)
            } else if (conn.optionsBatch.receiveMessage === 'directly') {
                callback({kind: 'message', message: message})
            }
        })
    }

    conn.connection.connect(error => {
        if (error) {
            conn.connection = undefined
            error['point'] = 'CONNECT'
            callback({
                kind: 'finish',
                finish: {
                    error: error,
                    tables: [],
                    messages: []
                }
            })
            return
        }
        request(conn.connection, conn.optionsBatch, q, 0, requestStep => {
            let performanceReceiveTables = conn.receiveTablesMsec ? performance.now() : -1

            if (requestStep.kind === 'spid') {
                callback({kind: 'spid', spid: requestStep.spid})
            } else if (requestStep.kind === 'before.exec') {
                currentQuery = requestStep.query
            } else if (requestStep.kind === 'columns') {
                if (performanceReceiveTables >= 0) {
                    if (currentRows && currentRows.length > 0) {
                        callback({kind: 'rows', rows: currentRows})
                    }
                    currentRows = []
                    callback({kind: 'columns', columns: requestStep.columns, queryIdx: currentQuery.queryIdx})
                } else {
                    if (!currentQuery.tables) currentQuery.tables = []
                    currentRows = []
                    currentQuery.tables.push({queryIdx: currentQuery.queryIdx, columns: requestStep.columns, rows: currentRows})
                }
            } else if (requestStep.kind === 'row') {
                currentRows.push(requestStep.row)
                if (performanceReceiveTables >= 0) {
                    const performanceReceiveTablesNew = performance.now()
                    if (performanceReceiveTables + conn.receiveTablesMsec > performanceReceiveTablesNew) {
                        callback({kind: 'rows', rows: currentRows})
                        currentRows = []
                        performanceReceiveTables = performanceReceiveTablesNew
                    }
                }
            } else if (requestStep.kind === 'stop') {
                conn.connection.close()
                conn.connection = undefined
                let error = undefined as Error
                if (currentQuery) {
                    if (currentQuery.error) {
                        error = {
                            message: currentQuery.error.message,
                            name: currentQuery.error.name
                        }
                        error['point'] = currentQuery.kind.toUpperCase()
                        error['lineNumber'] = currentQuery.error['lineNumber']
                        error['procName'] = currentQuery.error['procName'] === undefined || currentQuery.error['procName'] === '' ? undefined : currentQuery.error['procName']
                    }
                }

                if (error && conn.optionsBatch.receiveMessage !== 'none') {
                    const message = {
                        queryIdx: currentQuery.queryIdx,
                        isError: true,
                        message: error.message,
                        lineNumber: error['lineNumber'],
                        procName: error['procName']
                    } as TMessage
                    if (conn.optionsBatch.receiveMessage === 'cumulative') {
                        if (!currentQuery.messages) currentQuery.messages = []
                        currentQuery.messages.push(message)
                    } else if (conn.optionsBatch.receiveMessage === 'directly') {
                        callback({kind: 'message', message: message})
                    }
                }
                callback({
                    kind: 'finish',
                    finish: {
                        error: error,
                        tables: [].concat(...q.filter(f => f.tables).map(m => { return m.tables })),
                        messages: [].concat(...q.filter(f => f.messages).map(m => { return m.messages })),
                    }
                })
            }
        })
    })
}

function request(connection: Connection, optionsBatch: TBatchOptions, queries: TQuery[], idx: number, callback: (requestStep: TRequest) => void) {
    if (idx >= queries.length) {
        callback({kind: 'stop'})
        return
    }
    const query = queries[idx]
    callback({kind: 'before.exec', query: query})
    const req = new Request(query.script, error => {
        query.isExecuted = true
        if (error) {
            query.error = error
            callback({kind: 'stop'})
            return
        }
        callback({kind: 'after.exec', query: query})
        idx++
        request(connection, optionsBatch, queries, idx, callback)
    })

    let generaforRow = Function(`return undefined`)

    if (query.kind === 'spid') {
        req.on('row', function(row) {
            if (row && row.length > 0 && row[0].value) {
                const spid = vv.toInt(row[0].value)
                callback({kind: 'spid', spid: spid})
            }
        })
    } else if (optionsBatch.receiveTables !== 'none') {
        req.on('columnMetadata', function(columnsRaw) {
            const columns = ec.ColumnsBuild(columnsRaw)
            ec.ColumnsNameNormalize(columns)

            generaforRow = ec.GenerateFunctionConvertRow(optionsBatch.formatCells, columns)
            callback({kind: 'columns', columns: columns.map(m => { return m.column })})
        })
        if (optionsBatch.formatCells === 'native') {
            req.on('row', function(row) {
                callback({kind: 'row', row: generaforRow(row)})
            })
        } else if (optionsBatch.formatCells === 'string') {
            req.on('row', function(row) {
                callback({kind: 'row', row: generaforRow(row, formatDate)})
            })
        }
    }
    connection.execSqlBatch(req)
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
})

function formatDate(d: Date): string {
    const s = dateFormatter.format(d)
    return `${s.substring(0, 10)}T${s.substring(12,24)}`
}