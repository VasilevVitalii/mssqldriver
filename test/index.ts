//https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md

import * as mssqldriver from '../src'


const mssql = mssqldriver.Create({
    authentication: 'sqlserver',
    instance: '192.168.201.220',
    login: 'sa',
    password: '333666999'
})

const query1 = [
    `IF OBJECT_ID('tempdb..#i') IS NOT NULL DROP TABLE #i`,
    `CREATE TABLE #i(g UNIQUEIDENTIFIER NOT NULL, i INT NOT NULL, n NVARCHAR(50), FDM DATETIME, PRIMARY KEY(g, i))`,
    `INSERT INTO #I(g, i, n, FDM) SELECT NEWID(), 42, NULL, GETDATE()`,
    `SELECT *, 'hi', 1 f1, 2 f1 FROM #i`,
    `SELECT * FROM sys.objects`,
    `DECLARE @i INT, @m NVARCHAR(MAX)`,
    `SET @i = 0`,
    `WHILE (@i < 10) BEGIN`,
    `    SET @m = 'PRINT MESSAGE ' + CONVERT(NVARCHAR(MAX),@i)`,
    `    PRINT @m`,
    `    SET @m = 'RAISERROR MESSAGE ' + CONVERT(NVARCHAR(MAX),@i)`,
    `    RAISERROR(@m, 10, 1) WITH NOWAIT`,
    `    WAITFOR DELAY '00:00:01'`,
    `    SET @i = @i + 1`,
    `END`,
    `SELECT * FROM sys.objects`,
].join('\n')

mssql.exec(query1)