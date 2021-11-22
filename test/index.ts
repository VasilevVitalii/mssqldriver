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
        connectionTimeout: 5000,
        useUtc: true,
    }
})

// let c = 0
// mssql.exec(['SELECT TOP 100000 * FROM sys.objects AS o1, sys.objects AS o2, sys.objects AS o3'], {receiveTables: 500}, execResult => {
//     const a = execResult
//     if (execResult.kind === 'columns') {
//         console.log('colimns!')
//     }
//     if (execResult.kind === 'rows') {
//         c = c + execResult.rows.length
//         console.log(c)
//     }
//     if (execResult.kind === 'finish') {
//         console.log(execResult.finish)
//         console.log(execResult.finish.duration.total)
//     }
// })

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