import requestp from 'request-promise'
import {get as getConfig} from './config'

export async function updateApp(name, tag) {
    //Load current state
    let registry = getConfig().registry
    let current = await getApp(name)
    let container = current.app.container
    container.docker.image = `${registry}/${name}:${tag}`

    //Update
    await request('PUT', `/v2/apps/${name}?force=true`, {
        payload: {
            container
        }
    })
}

export async function getApp(name) {
    return request('GET', `/v2/apps/${name}`)
}

export async function request(method, url, {payload}={}) {
    try {
        return await requestp({
            method,
            url: getConfig().marathon + url,
            json: payload || true
        })
    } catch (e) {
        let e2 = new Error(`Marathon error ${e.statusCode}: ` + JSON.stringify(e.response && e.response.body, null, '  '))
        e2.code = 'MARATHON_ERROR'
        throw e2
    }
}
