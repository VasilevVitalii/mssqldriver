import path from 'path'
import fs from 'fs'
import * as types from './types'
import * as mssqldriver from '../src'
import * as variants from './variants'

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
        connectionTimeout: 3000,
        useUtc: true,
    }
})

const mssqlBad = mssqldriver.Create({
    authentication: 'sqlserver',
    instance: 'aaa',
    login: 'bbb',
    password: 'ccc',
    additional: {
        connectionTimeout: 3000
    }
})

let hasError = false

types.TestStringTypes(mssql, 0, () => {
    types.TestTypes(mssql, 0, testTypes => {
        testTypes.forEach((t, i) => {
            const msg = `TEST TYPE #${i} (${t.type}): `
            if (t.errors.length > 0) {
                hasError = true
                console.warn(`${msg} HAS ERRORS`)
                t.errors.forEach(e => {
                    console.warn(`   ${e}`)
                })
            } else {
                console.log(`${msg} DONE`)
            }
        })
        mssqlBad.exec('SELECT 1', undefined, execResult => {
            if (execResult.kind === 'finish') {
                if (execResult && !execResult.finish.error) {
                    console.warn(`TEST BAD CONNECT FAIL`)
                } else {
                    console.log(`TEST BAD CONNECT DONE`)
                }
            }
            variants.TestVariants(mssql, 0, testVariants => {
                testVariants.forEach((v, i) => {
                    let hasVariantsError = false
                    const msg = `VARIANT #${i}`
                    if (v.needMessages !== JSON.stringify(v.resultMessages)) {
                        hasVariantsError = true
                        console.warn(`${msg} ERROR MESSAGE`)
                        console.warn(`need ${v.needMessages}`)
                        console.warn(`rest ${JSON.stringify(v.resultMessages)}`)
                    }
                    if (v.needTables !== JSON.stringify(v.resultTables)) {
                        hasVariantsError = true
                        console.warn(`${msg} ERROR TABLES`)
                        console.warn(`need ${v.needTables}`)
                        console.warn(`rest ${JSON.stringify(v.resultTables)}`)
                    }
                    if (v.need !== JSON.stringify(v.result)) {
                        hasVariantsError = true
                        console.warn(`${msg} ERROR FINISH`)
                        console.warn(`need ${v.need}`)
                        console.warn(`rest ${JSON.stringify(v.result)}`)
                    }
                    if (v.options && v.options.hasSpid && !v.spid) {
                        hasVariantsError = true
                        console.warn(`${msg} ERROR SPID`)
                    }
                    if (v.hasError && v.result.kind === 'finish' && !v.result.finish.error) {
                        hasVariantsError = true
                        console.warn(`${msg} ERROR NEED ERROR`)
                    }
                    if (!v.hasError === true && v.result.kind === 'finish' && v.result.finish.error) {
                        hasVariantsError = true
                        console.warn(`${msg} ERROR NO NEED ERROR`)
                    }
                    if (!hasVariantsError) {
                        console.log(`${msg} DONE`)
                    } else {
                        hasError = true
                    }
                })
                if (hasError) {
                    console.warn('TESTS FAILED')
                } else {
                    console.log('TESTS PASSED')
                }
            })
        })
    })
})


// let spid1 = 0
// mssql.exec([`PRINT 'HI1'; SELECT 1 AS F1`,`PRINT 'HI2'; SELECT 2 AS F2;`], {hasSpid: true}, execResult => {
//     if (execResult.kind === 'spid') {
//         spid1 = execResult.spid
//     } else if (execResult.kind === 'finish') {
//         const needMessages = '[{"queryIdx":0,"isError":false,"message":"HI1","lineNumber":1},{"queryIdx":1,"isError":false,"message":"HI2","lineNumber":1}]'
//         const needTables = '[{"queryIdx":0,"columns":[{"name":"F1","type":"int","isNullable":false,"isIdentity":false,"isReadOnly":false}],"rows":[{"F1":1}]},{"queryIdx":1,"columns":[{"name":"F2","type":"int","isNullable":false,"isIdentity":false,"isReadOnly":false}],"rows":[{"F2":2}]}]'

//         if (!spid1 || spid1 <= 0) {
//             console.warn(`SPID FAIL`)
//             result.hasError = true
//         } else if (needMessages !== JSON.stringify(execResult.finish.messages)) {
//             console.warn(`CUMULATIVE MESSAGE FAIL`)
//             result.hasError = true
//         } else if (needTables !== JSON.stringify(execResult.finish.tables)) {
//             console.warn(`CUMULATIVE TABLES FAIL`)
//             result.hasError = true
//         } else {
//             console.log(`SPID AND CUMULATIVE DONE`)
//         }
//         result.testCount++
//     }
// })

// mssql.exec([`SELECT 1 AS F1`, `SELECT`, `SELECT 2 AS F2`], undefined, execResult => {
//     if (execResult.kind === 'finish') {

//         console.log(JSON.stringify(execResult.finish.messages))
//         console.log(JSON.stringify(execResult.finish.tables))

//         const needMessages = ''
//         const needTables = ''
//         if (needMessages !== JSON.stringify(execResult.finish.messages)) {
//             console.warn(`CUMULATIVE (ERROR) MESSAGE FAIL`)
//             result.hasError = true
//         } else if (needTables !== JSON.stringify(execResult.finish.tables)) {
//             console.warn(`CUMULATIVE (ERROR) TABLES FAIL`)
//             result.hasError = true
//         } else {
//             console.log(`CUMULATIVE (ERROR) DONE`)
//         }
//         result.testCount++
//     }
// })

