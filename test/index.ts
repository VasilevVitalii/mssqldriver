//https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md

import path from 'path'
import fs from 'fs'
import * as types from './types'

import * as mssqldriver from '../src'

//const getRow = new Function(`row`, `toN`, `return Number("55")`)

// function aa (row) {
//     return {__i:row[0]['value'] as number,f:row[1]['value'] as number}
// }

//const aaa = getRow(undefined, (a) => {return Number(a)})

//console.log(String(123))

const localPath = path.join(__dirname, '..', '..', 'test')
const connectionFile = path.join(localPath, 'connaction.json')
const connection = fs.existsSync(connectionFile) ? JSON.parse(fs.readFileSync(connectionFile, 'utf8')) : {}
connection.authentication = connection.authentication || 'instance'
connection.login = connection.login || 'sa'
connection.password = connection.password || 'pass'
fs.writeFileSync(connectionFile, JSON.stringify(connection, null, 4), 'utf8')

const mssql = mssqldriver.Create({
    authentication: 'sqlserver',
    instance: connection.authentication,
    login: connection.login,
    password: connection.password,
    additional: {
        connectionTimeout: 3000
    }
})

const customTest1 = {error: undefined as Error, point: undefined as string}
const customTest2 = {error: undefined as Error, spid: 0, finished: false}

const mssqlBad = mssqldriver.Create({
    authentication: 'sqlserver',
    instance: 'aaa',
    login: 'bbb',
    password: 'ccc',
    additional: {
        connectionTimeout: 3000
    }
})
// mssqlBad.exec('SELECT 1', undefined, execResult => {
//     if (execResult?.kind === 'finish') {
//         if (execResult && execResult.finish && execResult.finish.error) {
//             customTest1.error = execResult.finish.error
//             customTest1.point = execResult.finish.error['point']
//         }
//     }
// })

// mssql.exec(`PRINT 'HI'`, {hasSpid: true}, execResult => {
//     if (execResult.kind === 'spid') {
//         customTest2.spid = execResult.spid
//     } else if (execResult.kind === 'finish') {
//         customTest2.error = execResult.finish.error
//         customTest2.finished = true
//     }
// })

types.TestTypes(mssql, 0, hasError => {

})

// types.TestTypes(mssql, 0, () => {

// })

// function testTypes(types: types.TTestType[], idx, callback: () => void) {

// }



// const query1 = [
//     `IF OBJECT_ID('tempdb..#i') IS NOT NULL DROP TABLE #i`,
//     `CREATE TABLE #i(g UNIQUEIDENTIFIER NOT NULL, i INT NOT NULL, n NVARCHAR(50), FDM DATETIME, PRIMARY KEY(g, i))`,
//     `INSERT INTO #I(g, i, n, FDM) SELECT NEWID(), 42, NULL, GETDATE()`,
//     `SELECT *, 'hi', 1 f1, 2 f1 FROM #i`,
//     `/* SELECT * FROM sys.objects`,
//     `DECLARE @i INT, @m NVARCHAR(MAX)`,
//     `SET @i = 0`,
//     `WHILE (@i < 10) BEGIN`,
//     `    SET @m = 'PRINT MESSAGE ' + CONVERT(NVARCHAR(MAX),@i)`,
//     `    PRINT @m`,
//     `    SET @m = 'RAISERROR MESSAGE ' + CONVERT(NVARCHAR(MAX),@i)`,
//     `    RAISERROR(@m, 10, 1) WITH NOWAIT`,
//     `    WAITFOR DELAY '00:00:01'`,
//     `    SET @i = @i + 1`,
//     `END`,
//     `SELECT * FROM sys.objects */`,
// ].join('\n')

//mssql.exec(query1)