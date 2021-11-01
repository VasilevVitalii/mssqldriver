import mssqlcoop from 'mssqlcoop'
import * as vv from 'vv-common'
import * as mssqldriver from '../src'

type TTestVariant = {
    scripts: string[],
    spid?: number,
    hasError?: boolean
    options?: mssqldriver.TBatchOptions,
    result?: mssqldriver.TExecResult,
    resultMessages?: mssqldriver.TMessage[],
    resultTables?: mssqldriver.TTable[],
    need?: string,
    needMessages?: string,
    needTables?: string,
}

const testVariants = [
    {
        scripts: [`PRINT 'HI1'; SELECT 1 AS F1`,`PRINT 'HI2'; SELECT 2 AS F2;`],
        options: {hasSpid: true},
        need: '{"kind":"finish","finish":{"tables":[{"queryIdx":0,"columns":[{"name":"F1","type":"int","isNullable":false,"isIdentity":false,"isReadOnly":false}],"rows":[{"F1":1}]},{"queryIdx":1,"columns":[{"name":"F2","type":"int","isNullable":false,"isIdentity":false,"isReadOnly":false}],"rows":[{"F2":2}]}],"messages":[{"queryIdx":0,"isError":false,"message":"HI1","lineNumber":1},{"queryIdx":1,"isError":false,"message":"HI2","lineNumber":1}]}}'
    },
    {
        scripts: [`PRINT 'HI1'; SELECT 1 AS F1`,`PRINT 'HI2'; SELECT * from noexiststable`, `PRINT 'HI3'; SELECT 3 AS F3`],
        hasError: true,
        options: {hasSpid: true},
        need: '{"kind":"finish","finish":{"tables":[{"queryIdx":0,"columns":[{"name":"F1","type":"int","isNullable":false,"isIdentity":false,"isReadOnly":false}],"rows":[{"F1":1}]}],"messages":[{"queryIdx":0,"isError":false,"message":"HI1","lineNumber":1},{"queryIdx":1,"isError":false,"message":"HI2","lineNumber":1}]}}'
    },
] as TTestVariant[]

export function TestVariants(mssql: mssqldriver.IApp, idx: number, callback: (testVariants: TTestVariant[]) => void) {
    if (idx >= testVariants.length) {
        callback(testVariants)
        return
    }
    const t = testVariants[idx]
    mssql.exec(t.scripts, t.options, execResult => {
        if (execResult.kind === 'spid') {
            t.spid = execResult.spid
        } else if (execResult.kind === 'message') {
            t.resultMessages.push(execResult.message)
        } else if (execResult.kind === 'columns') {
            t.resultTables.push({queryIdx: execResult.queryIdx, columns: execResult.columns, rows: []})
        } else if (execResult.kind === 'rows') {
            t.resultTables[t.resultTables.length - 1].rows.push(execResult.rows)
        } else if (execResult.kind === 'finish') {
            t.result = execResult
            idx++
            TestVariants(mssql, idx, callback)
        }
    })
}