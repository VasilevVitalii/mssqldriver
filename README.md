# mssqldriver
Driver for MS SQL Server, based on https://tediousjs.github.io/tedious
## Features
1. Receiving data in chunks or full
2. Receiving spid
3. Many queries in one connection
## License
*MIT*
## Install
```
npm i mssqldriver
```
## Example
```typescript
import * as mssqldriver from 'mssqldriver'
const mssql = mssqldriver.Create({
    authentication: 'sqlserver',
    instance: 'myserver/myinstance',
    login: 'sa',
    password: '123'
})
mssql.exec([`print 'Hello'`, `select * from sys.columns`], {formatCells: 'string', hasSpid: true, receiveMessage: 'directly', receiveTables: 200}, callbackExec => {
    if (callbackExec.kind === 'spid') {
        console.log(`spid`, callbackExec.spid)
        return
    }
    if (callbackExec.kind === 'message') {
        console.log(`message`, callbackExec.message)
        return
    }
    if (callbackExec.kind === 'columns') {
        console.log(`columns (new table begin)`, callbackExec.columns)
        return
    }
    if (callbackExec.kind === 'rows') {
        console.log(`rows`, callbackExec.rows)
        return
    }
    if (callbackExec.kind === 'finish') {
        console.log(`finish`, callbackExec.finish)
    }
})
```
