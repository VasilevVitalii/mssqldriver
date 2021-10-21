import { OptionsBeautify, OptionsTds } from "./optionsBuild"
import { ConnectionConfig } from 'tedious'

export type TConnection =
    { type: 'mixed', instance: string, login: string, password: string, additional: TConnectionAdditional } |
    { type: 'domain', instance: string, additional: TConnectionAdditional }

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

export interface IApp {
    aa: string
}

export function Create(options: TConnection) {
    const opt = OptionsBeautify(options)
    const optTds = OptionsTds(opt)
}