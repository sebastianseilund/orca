import chalk from 'chalk'
import promiseMapSeries from 'promise-map-series'
import {init as initConfig, get as getConfig} from './config'
import Watcher from './watcher'

export default async function() {
    try {
        await initConfig()
    } catch (e) {
        if (e.code === 'USER_ERROR') {
            console.log(chalk.red(e.message))
        } else {
            console.log(chalk.red('Error:'))
            console.log(chalk.red(e.stack || e.message))
        }
        process.exit(1)
    }

    let config = getConfig()
    await promiseMapSeries(config.apps, app => {
        let watcher = new Watcher(app, config.buildArgs)
        return watcher.watch()
    })
}
