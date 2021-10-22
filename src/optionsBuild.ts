import os from 'os'
import tds from 'tedious'
import vv from 'vv-common'
import { TConnection, TConnectionAdditional } from ".";
import { TBatchOptions } from './executor';

export function OptionsBeautify(optionsRaw: TConnection): TConnection {
    if (!optionsRaw) return undefined
    const additional = {
        database: optionsRaw.additional?.database || 'tempdb',
        appName: optionsRaw.additional?.appName || 'mssqldriver',
        useUtc: optionsRaw.additional?.useUtc === false ? false : true,
        columnNameBeautify: optionsRaw.additional?.columnNameBeautify || 'original',
        connectionTimeout: optionsRaw.additional?.connectionTimeout || 15000,
        executionTimeout: optionsRaw.additional?.executionTimeout || 0,
        canInstanceToIp: optionsRaw.additional?.canInstanceToIp === false ? false : true
    } as TConnectionAdditional
    if (optionsRaw.type === 'domain') {
        return {
            type: 'domain',
            instance: optionsRaw?.instance || '',
            additional: additional
        }
    } else if (optionsRaw.type === 'mixed') {
        return {
            type: 'mixed',
            instance: optionsRaw?.instance || '',
            login: optionsRaw.login || 'sa',
            password: optionsRaw.password,
            additional: additional
        }
    } else {
        return undefined
    }
}

export function OptionsTds(options: TConnection): tds.ConnectionConfig {
    const server = options.instance.replace(/\\/g, '/').split('/')
    const serverTds = server.length > 0 ? server.shift() : undefined

    let portTds = undefined
    const portTdsIndx = server.length > 0 ? server[server.length - 1].lastIndexOf(',') : -1
    if (server.length > 0 && portTdsIndx > 0) {
        portTds = vv.nz(vv.toInt(server[server.length - 1].substring(portTdsIndx).trim()), -1)
        server[server.length - 1] = server[server.length - 1].substring(0, portTdsIndx).trim()
    }

    const instanceNameTds = server.length > 0 ? server.join('/') : undefined

    return {
        server: serverTds,
        authentication: {
            type: options.type === 'mixed' ? 'default' : 'ntlm',
            options: {
                userName: options.type === 'mixed' ? options.login : os.userInfo().username,
                password: options.type === 'mixed' ? options.password : '',
                domain: options.type === 'mixed' ? '' : os.hostname().toUpperCase(),
            }
        },
        options: {
            instanceName: instanceNameTds,
            port: portTds,
            appName: options.additional.appName,
            connectTimeout: options.additional.connectionTimeout,
            requestTimeout: options.additional.executionTimeout,
            database: options.additional.database,
            encrypt: false,
            useColumnNames: false,
            useUTC: options.additional.useUtc,
            camelCaseColumns: options.additional.columnNameBeautify === 'first_letter_to_lower' ? true : false,
            trustServerCertificate: false
        }
    }
}