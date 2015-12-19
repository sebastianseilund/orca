import fs from 'fs'
import path from 'path'
import promisify from 'es6-promisify'
import {argv} from 'yargs'
import yaml from 'js-yaml'
import userError from './user-error'

let readFile = promisify(fs.readFile)
let stat = promisify(fs.stat)

let configFile = path.resolve(argv._[0])
let configDir = path.dirname(configFile)

let data

export async function init() {

    try {
        let contents = await readFile(configFile)
        data = yaml.safeLoad(contents)
    } catch (e) {
        throw userError(`Could not open config file (${configFile}): ${e.message}`)
    }

    if (!data.marathon) {
        throw userError(`Config file must contain a key called \`marathon\`.`)
    }
    if (!data.registry) {
        throw userError(`Config file must contain a key called \`registry\`.`)
    }
    if (!data.apps || !data.apps.length) {
        throw userError(`Config file must contain a key called \`apps\`.`)
    }

    await normalizeApps()

    return data
}

export function get() {
    return data
}

async function normalizeApps() {
    data.apps = await Promise.all(data.apps.map(normalizeApp))
}

async function normalizeApp(app) {
    if (typeof app === 'string') {
        app = {
            name: app
        }
    }
    if (!app.dir) {
        app.dir = app.name
    }
    app.dir = path.isAbsolute(app.dir) ? app.resolve(app.dir) : path.resolve(path.join(configDir, app.dir))

    if (!app.glob) {
		app.glob = [
			'**/*'
		]
    }

    if (!app.name.match(/^[a-zA-Z0-9_\-]+$/)) {
        throw userError(`Invalid app name: ${app.name}`)
    }

    let dockerfile = path.join(app.dir, 'Dockerfile')
    let stats
    try {
        stats = await stat(dockerfile)
    } catch (e) {
        //Ignore
    }
    if (!stats || !stats.isFile()) {
        throw userError(`Dockerfile for \`${app.name}\` does not exist: ${dockerfile}`)
    }

    return app
}
