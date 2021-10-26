//https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md

import path from 'path'
import fs from 'fs'
import * as types from './types'

import * as mssqldriver from '../src'


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
    password: connection.password
})

mssql.exec(`PRINT 'HI'`, {hasSpid: true}, execResult => {
    //const execResult
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