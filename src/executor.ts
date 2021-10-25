import { ConnectionConfig, Connection, Request } from 'tedious'
import * as vv from 'vv-common'
import mssqlcoop from 'mssqlcoop'
// eslint-disable-next-line @typescript-eslint/no-var-requires
//const tds = require('tedious')

export type TBatchOptionsLock = {
    key: string,
    wait: number,
    database: string
}

export type TBatchOptions = {
    /** use this database before start query, default - undefined (use database from connection)*/
    database?: string,
    /**catch and return tables from queries, default - true*/
    allowTables?: boolean,
    /**catch and return messages from queries, default - true*/
    allowMessages?: boolean,
    /**get spid, for (example) kill process, default - false */
    hasSpid?: boolean,
    /**protect competitive exec query, based on sp_getapplock*/
    lock?: TBatchOptionsLock,
    /**for exec many queries in one batch - if in step error exists, next steps not run, default - true */
    isStopOnError?: boolean
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
    { kind: 'columns', columns: TColumnInternal[] } |
    { kind: 'stop' }

type TColumnInternal = {
    name: string,
    isNullable: boolean,
    isIdentity: boolean,
    isReadOnly: boolean,
}

export function Exec(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions, query: string | string[]) {
    const conn = connection(optionsTds, optionsBatch)
    // const q = queries(conn.optionsBatch, query)

    // const request = new Request("select 42, 'hello world'", error => {
    //     if (error) {
    //         console.log(error)
    //     }
    //     conn.close()
    //     conn = undefined
    // })

    // request.on('row', function(row) {
    //     console.log(row)
    // })
    // request.on('columnMetadata', function(columns) {
    //     console.log(columns)
    // })

    let currentQuery = undefined as TQuery

    if (conn.optionsBatch.allowMessages) {
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
            console.log(error)
            return
        }
        request(conn.connection, conn.optionsBatch, queries(conn.optionsBatch, query), 0, requestStep => {
            if (requestStep.kind === 'before.exec') {
                currentQuery = requestStep.query
            } else if (requestStep.kind === 'columns') {

                //noname_i
                //xxxx_copy_i

                console.log(requestStep.columns)
            } else if (requestStep.kind === 'stop') {
                conn.connection.close()
                conn.connection = undefined
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
            if (optionsBatch.isStopOnError) {
                callback({kind: 'stop'})
                return
            }
        }
        callback({kind: 'after.exec', query: query})
        idx++
        request(connection, optionsBatch, queries, idx, callback)
    })
    if (optionsBatch.allowTables) {
        req.on('columnMetadata', function(columns) {
            callback({kind: 'columns', columns: columns.map(m => {
                const flags = m['flags']
                return {
                    name: m.colName,
                    isNullable: !!(flags & 0x01),
                    isIdentity: !!(flags & 0x10),
                    isReadOnly: !!(flags & 0x0C),
                }
            })})
            console.log(columns)
        })
        req.on('row', function(row) {
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
            allowTables: optionsBatch && optionsBatch.allowTables === false ? false : true,
            allowMessages: optionsBatch && optionsBatch.allowMessages === false ? false : true,
            hasSpid: optionsBatch && optionsBatch.hasSpid === true ? true : false,
            lock: lock,
            isStopOnError: optionsBatch && optionsBatch.isStopOnError === false ? false : true,
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