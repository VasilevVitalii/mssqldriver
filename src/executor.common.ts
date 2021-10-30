import { ConnectionConfig, Connection, ColumnMetaData } from 'tedious'
import * as vv from 'vv-common'
import * as mssqlcoop from 'mssqlcoop'
import { TBatchOptions, TQuery } from './executor'

export function BuildConnection(optionsTds: ConnectionConfig, optionsBatch: TBatchOptions) : {connection: Connection, optionsBatch: TBatchOptions} {
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
            formatCells: optionsBatch?.formatCells || 'native',
            hasSpid: optionsBatch && optionsBatch.hasSpid === true ? true : false,
            lock: lock,
        }
    }
}

export function BuildQueries(optionsBatch: TBatchOptions, query: string | string[]): TQuery[] {
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

export function ColumnMetadatTypeToKnownType(meta: ColumnMetaData): mssqlcoop.TType {
    const typeName = (meta.type?.name || '').toLowerCase()
    let fnd = undefined as mssqlcoop.TType
    switch (typeName) {
        case 'intn':
            fnd = mssqlcoop.Types.find(f => f.name === 'bigint')
            break
        case 'bitn':
            fnd = mssqlcoop.Types.find(f => f.name === 'bit')
            break
        case 'decimaln':
            fnd = mssqlcoop.Types.find(f => f.name === 'decimal')
            break
        case 'moneyn':
            fnd = mssqlcoop.Types.find(f => f.name === 'money')
            break
        case 'numericn':
            fnd = mssqlcoop.Types.find(f => f.name === 'numeric')
            break
        case 'floatn':
            fnd = mssqlcoop.Types.find(f => f.name === 'float')
            break
        case 'datetimen':
            fnd = mssqlcoop.Types.find(f => f.name === 'datetime')
            break
        default:
            fnd = mssqlcoop.Types.find(f => f.name === typeName)
    }
    return fnd || mssqlcoop.Types[0]
}