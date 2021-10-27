import { ConnectionConfig, Connection, Request } from 'tedious'
import * as vv from 'vv-common'
import * as mssqlcoop from 'mssqlcoop'
// eslint-disable-next-line @typescript-eslint/no-var-requires
//const tds = require('tedious')

export type TBatchOptionsLock = {
    key: string,
    wait: number,
    database: string
}

// none | directly | cumulative
// none | 500 | cumulative

export type TBatchOptions = {
    /** use this database before start query, default - undefined (use database from connection)*/
    database?: string,
    /**where return tables - 'none' - never, number - chunked return each this msec value, 'cumulative' - in end result object; default - 'cumulative'*/
    receiveTables?: ('none' | number | 'cumulative'),
    /**where return messages - 'none' - never, 'directly' - each message return immediately, 'cumulative' - in end result object; default - 'cumulative'*/
    receiveMessage?: ('none' | 'directly' | 'cumulative'),
    /**get spid, for (example) kill process, default - false */
    hasSpid?: boolean,
    /**protect competitive exec query, based on sp_getapplock*/
    lock?: TBatchOptionsLock,
    /** for allowTables = true: convert null in cell to undefined, default - true */
    isNullToUndefined?: boolean
}

type TQuery = {
    kind: ('spid' | 'lock.on' | 'lock.off' | 'query'),
    script: string,
    isExecuted?: boolean,
    error?: Error
}

type TRequest =
    { kind: 'before.exec', query: TQuery } |
    { kind: 'after.exec', query: TQuery } |
    { kind: 'spid', spid: number } |
    { kind: 'columns', columns: TColumn[] } |
    { kind: 'stop' }

type TColumn = {
    name: string,
    type: string,
    typeJs: string,
    precision: number,
    scale: number,
    len: number,
    isNullable: boolean,
    isIdentity: boolean,
    isReadOnly: boolean,
}

export type TExecResult =
    { kind: 'spid', spid: number } |
    { kind: 'finish', finish: {error: Error } }

export function Exec(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions, query: string | string[], callback: (result: TExecResult) => void) {
    const conn = connection(optionsTds, optionsBatch)

    let currentQuery = undefined as TQuery

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
                    error: error
                }
            })
            return
        }
        request(conn.connection, conn.optionsBatch, queries(conn.optionsBatch, query), 0, requestStep => {
            if (requestStep.kind === 'spid') {
                callback({kind: 'spid', spid: requestStep.spid})
            } else if (requestStep.kind === 'before.exec') {
                currentQuery = requestStep.query
            } else if (requestStep.kind === 'columns') {
                console.log(requestStep.columns)
            } else if (requestStep.kind === 'stop') {
                conn.connection.close()
                conn.connection = undefined
                callback({
                    kind: 'finish',
                    finish: {
                        error: currentQuery?.error
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

    let getRow = Function(`row`, `return {}`)

    if (query.kind === 'spid') {
        req.on('row', function(row) {
            if (row && row.length > 0 && row[0].value) {
                const spid = vv.toInt(row[0].value)
                callback({kind: 'spid', spid: spid})
            }
        })
    } else if (optionsBatch.receiveTables !== 'none') {
        req.on('columnMetadata', function(columnsRaw) {
            const columns = columnsRaw.map(m => {
                const flags = m['flags']
                const type = columnMetadatTypeToSqlType((m.type?.name || '').toLowerCase())
                const typeOptions = mssqlcoop.Types.find(f => f.name === type)
                let dataLength = m.dataLength
                if (dataLength && typeOptions && typeOptions.bytesOnChar) {
                    dataLength = Math.floor(dataLength / typeOptions.bytesOnChar)
                }
                return {
                    name: m.colName,
                    type: type,
                    typeJs: typeOptions?.mappingJs,
                    precision: m.precision,
                    scale: m.scale,
                    len: dataLength,
                    isNullable: !!(flags & 0x01),
                    isIdentity: !!(flags & 0x10),
                    isReadOnly: !!(flags & 0x0C),
                } as TColumn
            })
            columns.filter(f => vv.isEmpty(f.name)).forEach(c => { c.name = 'noname' })
            let idxCopy = 1
            for (let i = 0; i < columns.length; i++) {
                for (let j = i + 1; j < columns.length; j++) {
                    if (columns[i].name.toLowerCase() !== columns[j].name.toLowerCase()) continue
                    let maybeName = `${columns[i].name}_copy_${idxCopy}`
                    while (columns.some(f => vv.equal(f.name, maybeName))) {
                        idxCopy++
                        maybeName = `${columns[i].name}_copy_${idxCopy}`
                    }
                    columns[j].name = maybeName
                }
            }
            const getRowFunctionBody = columns.map((m, i) => `${m.name}:row[${i}].value`.concat(m.typeJs ? ` as ${m.typeJs}` : '')).join(',')
            getRow = Function(`row`, ` return { ${getRowFunctionBody} }`)
            callback({kind: 'columns', columns: columns})
        })
        req.on('row', function(row) {
            row.forEach(r => {
                console.log(r.value, typeof r.value)
            })
            const aaa = getRow(row)
            console.log(typeof aaa.__i)
            console.log(typeof aaa.f)

            console.log(row)
        })
    }
    connection.execSqlBatch(req)
}

function connection(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions) : {connection: Connection, optionsBatch: TBatchOptions} {
    const database = optionsBatch?.database || optionsTds.options.database
    const lock = optionsBatch && optionsBatch.lock ? {...optionsBatch.lock} : undefined
    if (lock) {
        lock.key = lock.key || 'UNKNOWN_LOCK'
        lock.database = lock.database || database
        lock.wait = lock.wait || 0
        if (lock.wait < 0) lock.wait = 0
    }

    return {
        connection: new Connection({...optionsTds, options: {...optionsTds.options, database: database}}),
        optionsBatch: {
            database: database,
            receiveTables: optionsBatch?.receiveTables || 'cumulative',
            receiveMessage: optionsBatch?.receiveMessage || 'cumulative',
            hasSpid: optionsBatch && optionsBatch.hasSpid === true ? true : false,
            lock: lock,
            isNullToUndefined: optionsBatch && optionsBatch.isNullToUndefined === false ? false : true,
        }
    }
}

function queries(optionsBatch: TBatchOptions, query: string | string[]): TQuery[] {
    const top = [] as TQuery[]
    const mid = [] as TQuery[]
    const bot = [] as TQuery[]

    if (optionsBatch?.hasSpid === true) {
        top.push({kind: 'spid', script: 'SELECT @@SPID spid'})
    }
    if (optionsBatch?.lock) {
        top.push({kind: 'lock.on', script: mssqlcoop.HelperLockSessionOn(optionsBatch.lock.key, optionsBatch.lock.database, optionsBatch.lock.wait)})
        bot.unshift({kind: 'lock.off', script: mssqlcoop.HelperLockSessionOff(optionsBatch.lock.key, optionsBatch.lock.database)})
    }
    const sripts = !Array.isArray(query) ? [query] : query
    sripts.filter(f => !vv.isEmpty(f)).forEach(q => {
        mid.push({kind: 'query', script: q})
    })
    return [...top, ...mid, ...bot]
}

function columnMetadatTypeToSqlType(type: string): string {
    if (type === 'intn') return 'bigint'
    return type
}