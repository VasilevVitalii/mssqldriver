//https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md

import * as mssqldriver from '../src'


const mssql = mssqldriver.Create({
    type: 'mixed',
    instance: 'odin\\run2010',
    login: 'sa',
    password: '123Qazws'
})

const query1 = [
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

mssql.run(query1)