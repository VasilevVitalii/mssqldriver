import { TType } from 'mssqlcoop'
import { ConnectionConfig, Connection, Request, ColumnMetaData } from 'tedious'
import * as vv from 'vv-common'
import * as ec from './executor.common'

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

export type TQuery = {
    kind: ('spid' | 'lock.on' | 'lock.off' | 'query'),
    script: string,
    isExecuted?: boolean,
    error?: Error,
    tables?: {columns: TColumn[], rows: any[]}[]
}

type TRequest =
    { kind: 'before.exec', query: TQuery } |
    { kind: 'after.exec', query: TQuery } |
    { kind: 'spid', spid: number } |
    { kind: 'columns', columns: TColumn[] } |
    { kind: 'row', row: any } |
    { kind: 'stop' }

type TColumn = {
    name: string,
    type: string,
    precision: number,
    scale: number,
    len: number,
    isNullable: boolean,
    isIdentity: boolean,
    isReadOnly: boolean,
}

export type TExecResult =
    { kind: 'spid', spid: number } |
    { kind: 'finish', finish: {error?: Error, tables: {columns: TColumn[], rows: any[]}[] } }

export function Exec(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions, query: string | string[], callback: (result: TExecResult) => void) {
    const conn = ec.BuildConnection(optionsTds, optionsBatch)
    const q = ec.BuildQueries(conn.optionsBatch, query)

    let currentQuery = undefined as TQuery
    let currentRows = undefined as any[]

    if (conn.optionsBatch.receiveMessage !== 'none') {
        conn.connection.on('infoMessage', message => {
            if (currentQuery?.kind !== 'query') return
            console.log(message)
        })
        conn.connection.on('errorMessage', message => {
            if (currentQuery?.kind !== 'query') return
            console.log(message)
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
                    tables: []
                }
            })
            return
        }
        request(conn.connection, conn.optionsBatch, q, 0, requestStep => {
            if (requestStep.kind === 'spid') {
                callback({kind: 'spid', spid: requestStep.spid})
            } else if (requestStep.kind === 'before.exec') {
                currentQuery = requestStep.query
            } else if (requestStep.kind === 'columns') {
                if (!currentQuery.tables) currentQuery.tables = []
                currentRows = []
                currentQuery.tables.push({columns: requestStep.columns, rows: currentRows})
            } else if (requestStep.kind === 'row') {
                currentRows.push(requestStep.row)
            } else if (requestStep.kind === 'stop') {
                conn.connection.close()
                conn.connection = undefined
                callback({
                    kind: 'finish',
                    finish: {
                        error: currentQuery?.error,
                        tables: [].concat(...q.filter(f => f.tables).map(m => { return m.tables }))
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
            error['point'] = query.kind
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
            const columns = columnsBuild(columnsRaw)
            columnsNormalize(columns)

            const getRowFunctionBody = [] as string[]
            if (optionsBatch.formatCells === 'native') {
                columns.forEach((c, i) => {
                    if (c.typeColumn.name === 'bigint') {
                        getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : parseInt(row[${i}].value)`)
                    } else {
                        getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value`)
                    }
                })
            } else if (optionsBatch.formatCells === 'string') {
                columns.forEach((c, i) => {
                    if (c.typeColumn.name === 'bit') {
                        getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : (row[${i}].value === true ? 'true' : 'false')`)
                    } else if (['decimal', 'int', 'money', 'numeric', 'smallint', 'smallmoney', 'tinyint', 'bigint', 'float', 'real'].includes(c.typeColumn.name)) {
                        getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value.toString()`)
                    } else if (['binary', 'image', 'varbinary'].includes(c.typeColumn.name)) {
                        getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value.toString('hex')`)
                    } else {
                        getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value`)
                    }
                })
            }
            generaforRow = Function('row',`return { ${getRowFunctionBody.join(',')} }`)
            callback({kind: 'columns', columns: columns.map(m => { return m.column })})
        })
        req.on('row', function(row) {
            callback({kind: 'row', row: generaforRow(row)})
        })
    }
    connection.execSqlBatch(req)
}

function columnsBuild(columnsRaw: ColumnMetaData[]) : {typeColumn: TType, column: TColumn}[] {
    const columns = columnsRaw.map(m => {
        const flags = m['flags']
        const typeColumn = ec.ColumnMetadatTypeToKnownType(m)
        let dataLength = m.dataLength
        if (dataLength && typeColumn.bytesOnChar) {
            dataLength = Math.floor(dataLength / typeColumn.bytesOnChar)
        }
        return {
            typeColumn: typeColumn,
            column : {
                name: m.colName,
                type: typeColumn.name,
                precision: m.precision,
                scale: m.scale,
                len: dataLength,
                isNullable: !!(flags & 0x01),
                isIdentity: !!(flags & 0x10),
                isReadOnly: !!(flags & 0x0C),
            } as TColumn
        }
    })

    return columns
}

function columnsNormalize(columns: {typeColumn: TType, column: TColumn}[]) {
    columns.filter(f => vv.isEmpty(f.column.name)).forEach(c => { c.column.name = 'noname' })
    let idxCopy = 1
    for (let i = 0; i < columns.length; i++) {
        for (let j = i + 1; j < columns.length; j++) {
            if (columns[i].column.name.toLowerCase() !== columns[j].column.name.toLowerCase()) continue
            let maybeName = `${columns[i].column.name}_copy_${idxCopy}`
            while (columns.some(f => vv.equal(f.column.name, maybeName))) {
                idxCopy++
                maybeName = `${columns[i].column.name}_copy_${idxCopy}`
            }
            columns[j].column.name = maybeName
        }
    }
}