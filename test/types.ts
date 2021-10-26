import * as mssqlcoop from 'mssqlcoop'
import * as mssqldriver from '../src'

type TTestType = {
    type: mssqlcoop.TTypeName,
    customDeclare?: string,
    checks: {ins: any, res: any}[],
    errors?: string[]
}

const testTypes = [
    {type: 'bigint', checks: [{ins: undefined, res: undefined}, {ins: 42, res: 42}, {ins: -42, res: -42}]}
] as TTestType[]


function script (t: TTestType): string {
    const res = [
        `IF OBJECT_ID('tempdb..#t') IS NOT NULL DROP TABLE #t`,
        `CREATE TABLE #t(__i INT IDENTITY(1,1), f ${t.customDeclare ? t.customDeclare : t.type.toUpperCase()})`,
    ] as string[]
    t.checks.forEach(c => {
        `INSERT INTO #t(f) VALUES (${c.ins})`
    })
    return res.join('\n')
}

export function TestTypes(mssql: mssqldriver.IApp, idx: number, callback: (hasError: boolean) => void) {
    if (idx >= testTypes.length) {
        callback(testTypes.some(f => f.errors && f.errors.length > 0))
        return
    }
    const t = testTypes[idx]
    const s = script(t)
    mssql.exec(s, undefined, execResult => {

    })
}