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
    /**get spid, for (example) kill process, default - false */
    hasSpid?: boolean,
    /**protect competitive exec query, based on sp_getapplock*/
    lock?: TBatchOptionsLock,
    /**for exec many queries in one batch - if in step error exists, next steps not run, default - true */
    isStopOnError?: boolean
    /** convert null in cell to undefined, default - true */
    isNullToUndefined?: boolean
}

export type TQuery = {
    kind: ('spid' | 'lock.on' | 'lock.off' | 'query'),
    script: string,
    isExecuted?: boolean,
    error?: Error
}

export function Run(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions, query: string | string[]) {
    const conn = connection(optionsTds, optionsBatch)
    const q = queries(optionsBatch, conn.database, query)

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

    conn.connection.on('infoMessage', message => {
        if (currentQuery?.kind !== 'query') return
        console.log(message)
    })
    conn.connection.on('errorMessage', message => {
        if (currentQuery?.kind !== 'query') return
        console.log(message)
    })

    conn.connection.connect(error => {
        if (error) {
            console.log(error)
            return
        }
        requestRun(conn.connection, optionsBatch?.isStopOnError === false ? false : true, q, 0, (type, query) => {
            if (type === 'pre') {
                currentQuery = query
            } else if (type === 'stop') {
                conn.connection.close()
                conn.connection = undefined
            }
        })
    })
}

function requestRun(connection: Connection, isStopOnError: boolean, queries: TQuery[], idx: number, callback: (type: ('stop' | 'pre'), query: TQuery) => void) {
    if (idx >= queries.length) {
        callback('stop', undefined)
        return
    }
    const query = queries[idx]
    callback('pre', query)
    const request = new Request(query.script, error => {
        query.isExecuted = true
        if (error) {
            query.error = error
            if (isStopOnError) {
                callback('stop', undefined)
            }
        }
        idx++
        requestRun(connection, isStopOnError, queries, idx, callback)
    })
    connection.execSqlBatch(request)
}

function connection(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions) : {database: string, connection: Connection} {
    const database = optionsBatch?.database || optionsTds.options.database
    return {
        database: database,
        connection: new Connection({...optionsTds, options: {...optionsTds.options, database: database}})
    }
}

function queries(optionsBatch: TBatchOptions, defaultDatabase: string, query: string | string[]): TQuery[] {
    const top = [] as TQuery[]
    const mid = [] as TQuery[]
    const bot = [] as TQuery[]

    if (optionsBatch?.hasSpid === true) {
        top.push({kind: 'spid', script: 'SELECT @@SPID spid'})
    }
    if (optionsBatch?.lock) {
        const key = optionsBatch.lock.key || 'UNKNOWN_LOCK'
        const database = optionsBatch.lock.database || defaultDatabase
        top.push({kind: 'lock.on', script: mssqlcoop.HelperLockSessionOn(key, database, optionsBatch.lock.wait || 0)})
        bot.unshift({kind: 'lock.off', script: mssqlcoop.HelperLockSessionOff(key, database)})
    }
    const sripts = !Array.isArray(query) ? [query] : query
    sripts.filter(f => !vv.isEmpty(f)).forEach(q => {
        mid.push({kind: 'query', script: q})
    })
    return [...top, ...mid, ...bot]
}