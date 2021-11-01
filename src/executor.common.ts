import { ConnectionConfig, Connection, ColumnMetaData } from 'tedious'
import * as vv from 'vv-common'
import * as mssqlcoop from 'mssqlcoop'
import { TBatchOptions, TQuery, TColumn } from './executor'

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
        top.push({kind: 'spid', script: 'SELECT @@SPID spid', queryIdx: undefined})
    }
    if (optionsBatch?.lock) {
        top.push({kind: 'lock.on', script: mssqlcoop.HelperLockSessionOn(optionsBatch.lock.key, optionsBatch.lock.database, optionsBatch.lock.wait), queryIdx: undefined})
        bot.unshift({kind: 'lock.off', script: mssqlcoop.HelperLockSessionOff(optionsBatch.lock.key, optionsBatch.lock.database), queryIdx: undefined})
    }
    const sripts = !Array.isArray(query) ? [query] : query
    sripts.filter(f => !vv.isEmpty(f)).forEach((q, i) => {
        mid.push({kind: 'query', script: q, queryIdx: i})
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

export function ColumnsBuild(columnsRaw: ColumnMetaData[]) : {typeColumn: mssqlcoop.TType, column: TColumn}[] {
    const columns = columnsRaw.map(m => {
        const flags = m['flags']
        const typeColumn = ColumnMetadatTypeToKnownType(m)
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

export function ColumnsNameNormalize(columns: {typeColumn: mssqlcoop.TType, column: TColumn}[]) {
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

// eslint-disable-next-line @typescript-eslint/ban-types
export function GenerateFunctionConvertRow(formatCells: ('native' | 'string'), columns: {typeColumn: mssqlcoop.TType, column: TColumn}[] ): Function {
    const getRowFunctionBody = [] as string[]
    if (formatCells === 'native') {
        columns.forEach((c, i) => {
            if (c.typeColumn.name === 'bigint') {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : parseInt(row[${i}].value)`)
            } else {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value`)
            }
        })
        return Function('row',`return { ${getRowFunctionBody.join(',')} }`)
    }
    if (formatCells === 'string') {
        columns.forEach((c, i) => {
            if (c.typeColumn.name === 'bit') {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : (row[${i}].value === true ? 'true' : 'false')`)
            } else if (['decimal', 'int', 'money', 'numeric', 'smallint', 'smallmoney', 'tinyint', 'bigint', 'float', 'real'].includes(c.typeColumn.name)) {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value.toString()`)
            } else if (['binary', 'image', 'varbinary'].includes(c.typeColumn.name)) {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value.toString('hex')`)
            } else if (['date', 'datetime', 'datetime2', 'datetimeoffset', 'time', 'smalldatetime'].includes(c.typeColumn.name)) {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : formatDate(row[${i}].value)`)
            } else {
                getRowFunctionBody.push(`${c.column.name}:row[${i}].value === null ? undefined : row[${i}].value`)
            }
        })
        return Function('row', `formatDate`, `return { ${getRowFunctionBody.join(',')} }`)
    }

    return Function(`return undefined`)
}