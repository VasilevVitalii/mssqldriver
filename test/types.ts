import mssqlcoop from 'mssqlcoop'
import * as vv from 'vv-common'
import * as mssqldriver from '../src'

type TTestType = {
    type: mssqlcoop.TTypeName,
    typeJs: mssqlcoop.TTypeMappingJs,
    errors: string[],
    customDeclare?: string,
    checks: {ins: any, res: any}[],
}

const d = new Date()
const du1 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
const du2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()))
const du3 = new Date(Date.UTC(1970, 0, 1, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()))
const ds = `'${vv.dateFormat(d, '126')}'`



const testTypes = [
    {type: 'bigint', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]},
    {type: 'bit', typeJs: 'boolean', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 1, res: true}, {ins: 0, res: false}]},
    {type: 'decimal', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.568}], customDeclare: 'DECIMAL(18,3)'},
    {type: 'int', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]},
    {type: 'money', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 42.1234, res: 42.1234}, {ins: -42.5678, res: -42.5678}]},
    {type: 'numeric', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.568}], customDeclare: 'NUMERIC(18,3)'},
    {type: 'smallint', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]},
    {type: 'tinyint', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: 0, res: 0}]},
    {type: 'float', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.5678}]},
    // ===IGNORE! {type: 'real', typeJs: 'number', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.5678}]},
    {type: 'date', typeJs: 'Date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du1}]},
    {type: 'datetime2', typeJs: 'Date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2 }]},
    {type: 'datetime', typeJs: 'Date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2}]},
    {type: 'datetimeoffset', typeJs: 'Date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2}]},
    {type: 'smalldatetime', typeJs: 'Date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2}]},
    {type: 'time', typeJs: 'Date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du3}]},

    

] as TTestType[]

function script (t: TTestType): string {
    const res = [
        `IF OBJECT_ID('tempdb..#t') IS NOT NULL DROP TABLE #t`,
        `CREATE TABLE #t(__i INT IDENTITY(1,1), f ${t.customDeclare ? t.customDeclare : t.type.toUpperCase()})`,
    ] as string[]
    t.checks.forEach(c => {
        res.push(`INSERT INTO #t(f) VALUES (${c.ins})`)
    })
    res.push('SELECT * FROM #t ORDER BY __i')
    return res.join('\n')
}

export function TestTypes(mssql: mssqldriver.IApp, idx: number, callback: (testTypes: TTestType[]) => void) {
    if (idx >= testTypes.length) {
        callback(testTypes)
        return
    }
    const t = testTypes[idx]
    const s = script(t)
    mssql.exec(s, undefined, execResult => {
        if (execResult.kind === 'finish') {
            if (execResult.finish.error) {
                t.errors.push(`execResult.finish.error = ${execResult.finish.error}`)
            } else if (execResult.finish.tables.length !== 1) {
                t.errors.push(`execResult.finish.tables.length = ${execResult.finish.tables.length}`)
            } else if (execResult.finish.tables[0].rows.length !== t.checks.length) {
                t.errors.push(`execResult.finish.tables[0].rows.length = ${execResult.finish.tables[0].rows.length}, t.checks.length = ${t.checks.length}`)
            } else if (execResult.finish.tables[0].columns[1].typeJs !== t.typeJs) {
                t.errors.push(`columns[1].typeJs = ${execResult.finish.tables[0].columns[1].typeJs}, t.typeJs = ${t.typeJs}`)
            } else {
                t.checks.forEach((c, i) => {
                    if (['datetime'].includes(t.type) && c.res && execResult.finish.tables[0].rows[i].f) {
                        const delta = Math.abs(c.res.getTime() - execResult.finish.tables[0].rows[i].f.getTime())
                        if (delta > 1) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${execResult.finish.tables[0].rows[i].f}`)
                        }
                    } else if (['smalldatetime'].includes(t.type) && c.res && execResult.finish.tables[0].rows[i].f) {
                        const delta = Math.abs(c.res.getTime() - execResult.finish.tables[0].rows[i].f.getTime())
                        if (delta > 60000) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${execResult.finish.tables[0].rows[i].f}`)
                        }
                    } else if (['date', 'datetime2', 'datetimeoffset', 'time'].includes(t.type) && c.res && execResult.finish.tables[0].rows[i].f) {
                        if ( c.res.getTime() !== execResult.finish.tables[0].rows[i].f.getTime()) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${execResult.finish.tables[0].rows[i].f}`)
                        }
                    } else {
                        if (c.res !== execResult.finish.tables[0].rows[i].f) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${execResult.finish.tables[0].rows[i].f}`)
                        }
                    }
                })
            }
            idx++
            TestTypes(mssql, idx, callback)
        }
    })
}