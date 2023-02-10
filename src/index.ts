import { OptionsBeautify, OptionsTds } from "./optionsBuild"
import { Exec, TBatchOptions, TExecResult, TMessage, TTable } from "./executor"
import * as mssqlcoop from "mssqlcoop"

export type TConnection =
    { authentication: 'sqlserver', instance: string, login: string, password: string, additional?: TConnectionAdditional } |
    { authentication: 'windows', instance: string, additional?: TConnectionAdditional }

export type TConnectionAdditional = {
    /**name database for connect, default - 'tempdb'*/
    database?: string,
    /**app name, which will be visible in MS SQL profiler, default - 'mssqldriver' */
    appName?: string,
    /**use utc in date and time,default - true*/
    useUtc?: boolean,
    /**format column name in select result, default - 'original'*/
    columnNameBeautify?: ('original' | 'first_letter_to_lower')
    /**connection timeout in milliseconds, default - 15000*/
    connectionTimeout?: number,
    /**execution timeout in milliseconds, default - 0 (infinity)*/
    executionTimeout?: number,
    /**if ping function fail and server name in instance like comp name, find ip for this comp name and change instance. default = true*/
    canInstanceToIp?: boolean
}

export type TServerInfo = {
    version: string,
    timezone: number,
    duration: number
}

export { TBatchOptions, TExecResult, TMessage, TTable }

export interface IApp {
    exec: (query: string | string[], options: TBatchOptions, callback: (result: TExecResult) => void) => void,
    ping: (callback: (error: Error, info: TServerInfo) => void) => void
}

export function Create(options: TConnection): IApp {
    const opt = OptionsBeautify(options)
    const optTds = OptionsTds(opt)

    return {
        exec(query: string | string[], options: TBatchOptions, callback: (result: TExecResult) => void) {
            Exec(optTds, options, query, callback)
        },
        ping(callback: (error: Error, info: TServerInfo) => void) {
            Exec(optTds, {receiveMessage: 'none'}, mssqlcoop.SchemataServer(), execResult => {
                if (execResult.kind !== 'finish') return
                if (execResult.finish.error) {
                    callback(execResult.finish.error, undefined)
                } else {
                    const table = execResult.finish.tables.length > 0 ? execResult.finish.tables[0] : undefined
                    const row = table && table.rows.length > 0 ? table.rows[0] : undefined
                    callback(undefined, {
                        version: row?.version,
                        timezone: row?.timezone,
                        duration: execResult.finish.duration.total
                    })
                }
            })
        }
    }
}