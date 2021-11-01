import mssqlcoop from 'mssqlcoop'
import * as vv from 'vv-common'
import * as mssqldriver from '../src'

type TTestType = {
    type: mssqlcoop.TTypeName,
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
    //{type: 'bigint', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]},
    //{type: 'bit', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 1, res: true}, {ins: 0, res: false}]},
    //{type: 'decimal', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.568}], customDeclare: 'DECIMAL(18,3)'},
    //{type: 'int', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]},
    {type: 'money', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 42.1234, res: 42.1234}, {ins: -42.5678, res: -42.5678}]},
    {type: 'numeric', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.568}], customDeclare: 'NUMERIC(18,3)'},
    {type: 'smallint', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]},
    {type: 'tinyint', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: 0, res: 0}]},
    {type: 'float', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.5678}]},
    {type: 'real', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}, {ins: 1.123, res: 1.123}, {ins: 1.5678, res: 1.5678}]},
    {type: 'date', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du1}]},
    {type: 'datetime2', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2 }]},
    {type: 'datetime', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2}]},
    {type: 'datetimeoffset', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2}]},
    {type: 'smalldatetime', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du2}]},
    {type: 'time', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: ds, res: du3}]},
    {type: 'char', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42        `}, {ins: `'aaa'`, res: `aaa       `}], customDeclare: 'CHAR (10)'},
    {type: 'text', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}]},
    {type: 'varchar', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}], customDeclare: 'VARCHAR(50)'},
    {type: 'varchar', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}], customDeclare: 'VARCHAR(MAX)'},
    {type: 'sysname', errors: [], checks: [{ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}]},
    {type: 'nchar', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42        `}, {ins: `'aaa'`, res: `aaa       `}], customDeclare: 'NCHAR (10)'},
    {type: 'ntext', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}]},
    {type: 'nvarchar', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}], customDeclare: 'NVARCHAR(50)'},
    {type: 'nvarchar', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'42'`, res: `42`}, {ins: `'aaa'`, res: `aaa`}], customDeclare: 'NVARCHAR(MAX)'},
    {type: 'binary', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `0x1`, res: Buffer.from([1,0,0,0,0,0,0,0])}], customDeclare: 'BINARY(8)'},
    {type: 'image', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `0x1`, res: Buffer.from([1])}]},
    {type: 'varbinary', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `0x1`, res: Buffer.from([1])}], customDeclare: 'VARBINARY(8)'},
    {type: 'xml', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'<a>aaa</a>'`, res: `<a>aaa</a>`}]},
    {type: 'uniqueidentifier', errors: [], checks: [{ins: 'NULL', res: undefined}, {ins: `'B453DBD2-AFD8-435D-9A54-90A94FF6CB86'`, res: `B453DBD2-AFD8-435D-9A54-90A94FF6CB86`}]},
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
            } else {
                t.checks.forEach((c, i) => {
                    const f = execResult.finish.tables[0].rows[i].f
                    if (c.res && f && ['real'].includes(t.type)) {
                        const delta = Math.abs(c.res - f)
                        const minTrueDelta = 0.0001
                        if (delta > minTrueDelta) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${f}, minTrueDelta = ${minTrueDelta}`)
                        }
                    } else if (c.res && f && ['datetime', 'smalldatetime', 'date', 'datetime2', 'datetimeoffset', 'time'].includes(t.type)) {
                        const delta = Math.abs(c.res.getTime() - f.getTime())
                        let minTrueDelta = 0
                        if (t.type === 'datetime') {
                            minTrueDelta = 3
                        } else if (t.type === 'smalldatetime') {
                            minTrueDelta = 60000
                        }
                        if (delta > minTrueDelta) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${f}, minTrueDelta = ${minTrueDelta}`)
                        }
                    } else if (c.res && f && Buffer.isBuffer(c.res) && Buffer.isBuffer(f)) {
                        if (c.res.toString('hex') !== f.toString('hex')) {
                            t.errors.push(`row #${i}: res = ${c.res.toString('hex')}, f = ${f.toString('hex')}`)
                        }
                    } else if (c.res !== f) {
                        t.errors.push(`row #${i}: res = ${c.res}, f = ${f}`)
                    }
                })
            }
            idx++
            TestTypes(mssql, idx, callback)
        }
    })
}

export function TestStringTypes(mssql: mssqldriver.IApp, idx: number, callback: (testTypes: TTestType[]) => void) {
    if (idx >= testTypes.length) {
        callback(testTypes)
        return
    }
    const t = testTypes[idx]
    const s = script(t)
    mssql.exec(s, {formatCells: 'string'}, execResult => {
        if (execResult.kind === 'finish') {
            if (execResult.finish.error) {
                t.errors.push(`execResult.finish.error = ${execResult.finish.error}`)
            } else if (execResult.finish.tables.length !== 1) {
                t.errors.push(`execResult.finish.tables.length = ${execResult.finish.tables.length}`)
            } else if (execResult.finish.tables[0].rows.length !== t.checks.length) {
                t.errors.push(`execResult.finish.tables[0].rows.length = ${execResult.finish.tables[0].rows.length}, t.checks.length = ${t.checks.length}`)
            } else {
                t.checks.forEach((c, i) => {
                    const f = execResult.finish.tables[0].rows[i].f
                    if (f !== undefined && typeof f !== 'string') {
                        t.errors.push(`row #${i}: typeof f = ${typeof f}`)
                    } else if ((c.res === undefined && f !== undefined) || (c.res !== undefined && f === undefined)) {
                        t.errors.push(`row #${i}: c.res  === undefined ${c.res === undefined}, f === undefined ${f === undefined} `)
                    } else if (c.res !== undefined && f !== undefined) {
                        if (t.type === 'real') {
                            const delta = Math.abs(parseFloat(c.res) - parseFloat(f))
                            const minTrueDelta = 0.0001
                            if (delta > minTrueDelta) {
                                t.errors.push(`row #${i}: res = ${c.res}, f = ${f}, minTrueDelta = ${minTrueDelta}`)
                            }
                        } else if (t.type === 'binary' || t.type === 'image' || t.type === 'varbinary') {
                            if (c.res.toString('hex') !== f.toString()) {
                                t.errors.push(`row #${i}: res = ${c.res}, f = ${f}`)
                            }
                        } else if (t.type === 'date' || t.type === 'datetime2' || t.type === 'datetimeoffset' || t.type === 'time') {
                            if (vv.dateFormat(c.res, '126') !== f.toString()) {
                                t.errors.push(`row #${i}: res = ${vv.dateFormat(c.res, '126')}, f = ${f}`)
                            }
                        } else if (t.type === 'datetime') {
                            const d1 = new Date(c.res)
                            const d2 = new Date(c.res)
                            const d3 = new Date(c.res)
                            const d4 = new Date(c.res)
                            const d5 = new Date(c.res)

                            d2.setMilliseconds(d2.getMilliseconds() + 1)
                            d3.setMilliseconds(d3.getMilliseconds() + 2)
                            d4.setMilliseconds(d4.getMilliseconds() - 1)
                            d5.setMilliseconds(d5.getMilliseconds() - 2)

                            if (![vv.dateFormat(d1, '126'), vv.dateFormat(d2, '126'), vv.dateFormat(d3, '126'), vv.dateFormat(d4, '126'), vv.dateFormat(d5, '126')].includes(f)) {
                                t.errors.push(`row #${i}: res = [${vv.dateFormat(d1, '126')},${vv.dateFormat(d2, '126')},${vv.dateFormat(d3, '126')},${vv.dateFormat(d4, '126')},${vv.dateFormat(d5, '126')}], f = ${f}`)
                            }
                        } else if (t.type === 'smalldatetime') {
                            const delta = Math.abs((new Date(c.res)).getTime() - (new Date(f)).getTime())
                            const minTrueDelta = 60000
                            if (delta > minTrueDelta) {
                                t.errors.push(`row #${i}: res = ${c.res}, f = ${f}, delta = ${delta}, minTrueDelta = ${minTrueDelta}`)
                            }
                        } else if (c.res.toString() !== f.toString()) {
                            t.errors.push(`row #${i}: res = ${c.res}, f = ${f}`)
                        }
                    }
                })
            }
            idx++
            TestStringTypes(mssql, idx, callback)
        }
    })
}

// IF OBJECT_ID('tempdb..#t') IS NOT NULL DROP TABLE #t 
// CREATE TABLE #t(f1 DATE, f2 DATETIME, f3 DATETIME2, f4 DATETIMEOFFSET, f5 TIME, f6 SMALLDATETIME)
// INSERT INTO #t(f1, f2, f3, f4, f5, f6)
// SELECT GETDATE(),GETDATE(),GETDATE(),GETDATE(),GETDATE(),GETDATE()
// SELECT 
// CONVERT(VARCHAR(MAX),f1, 126),
// CONVERT(VARCHAR(MAX),f2, 126),
// CONVERT(VARCHAR(MAX),f3, 126),
// CONVERT(VARCHAR(MAX),f4, 126),
// CONVERT(VARCHAR(MAX),f5, 126),
// CONVERT(VARCHAR(MAX),f6, 126)
// FROM #t