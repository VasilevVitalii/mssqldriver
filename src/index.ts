import { OptionsBeautify, OptionsTds } from "./optionsBuild"
import { Exec, TBatchOptions, TExecResult, TMessage, TTable } from "./executor"

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

export { TBatchOptions, TExecResult, TMessage, TTable }

export interface IApp {
    //run: (query: string | string[], options?: TBatchOptions) => void
    exec: (query: string | string[], options: TBatchOptions, callback: (result: TExecResult) => void) => void
}

export function Create(options: TConnection): IApp {
    const opt = OptionsBeautify(options)
    const optTds = OptionsTds(opt)

    //Exec(optTds, undefined, "select 42, 'hello world'")

    return {
        // run(query: string | string[], options?: TBatchOptions) {
        //     Run(optTds, options, query)
        // },
        exec(query: string | string[], options: TBatchOptions, callback: (result: TExecResult) => void) {
            Exec(optTds, options, query, callback)
        },
    }
}