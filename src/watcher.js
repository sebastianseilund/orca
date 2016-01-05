import _ from 'lodash'
import sane from 'sane'
import path from 'path'
import chalk from 'chalk'
import hostExec from './host-exec'
import queue from './queue'
import {updateApp} from './marathon'
import {get as getConfig} from './config'

export default class Watcher {
    constructor(opts) {
    	this.name = opts.name
        this.dir = opts.dir
        this.glob = opts.glob

    	this.restarting = false
    	this.again = false
    }

    watch() {
        return new Promise(resolve => {
            this.watcher = sane(this.dir, {
        			glob: this.glob,
        			watchman: true
        		})
        		.on('ready', () => {
        			this.log('Ready')
                    this.enqueueRestart()
                    resolve()
        		})
        		.on('change', this.changed.bind(this, 'Changed'))
        		.on('add', this.changed.bind(this, 'Added'))
        		.on('delete', this.changed.bind(this, 'Deleted'))
        })
    }

    changed(type, filepath) {
    	this.log(type + ' ' + filepath)
    	this.scheduleEnqueue(500)
    }

    scheduleEnqueue(delay) {
    	clearTimeout(this.enqueueTimer)
    	this.enqueueTimer = setTimeout(this.enqueueRestart.bind(this), delay)
    }

    enqueueRestart() {
        if (this.restarting) {
    		this.again = true
    		return
    	}
    	this.restarting = true
        queue.add(this.restart.bind(this))
    }

    async restart() {
        try {
            let tag = 'orca.' + Date.now() //We append a timestamp since we want to make sure Marathon pulls the new image
            let imageName = getConfig().registry + `/${this.name}:${tag}`
            this.log('Building image...')
            await hostExec('docker', ['build', '-t', imageName, '.'], {cwd: this.dir})
            this.log('Pushing image...')
            await hostExec('docker', ['push', imageName], {cwd: this.dir})
            this.log('Updating Marathon...')
            await updateApp(this.name, tag)
            this.log(chalk.green('Restarted'))
        } catch (e) {
            if (e.code == 'EXEC_ERROR') {
                this.log(chalk.red('Error. Exit code was: ' + e.exitCode + '. Output was:'))
				console.log(e.output)
            } else if (e.code == 'MARATHON_ERROR') {
                this.log(chalk.red(e.message))
            } else {
                this.log(chalk.red(e.stack || e.message))
            }
            //TODO: Retry?
        }

        this.restarting = false
    	if (this.again) {
    		this.again = false
    		await this.enqueueRestart()
    	}
    }

    log(msg) {
        let longestName = getConfig().apps.reduce((memo, app) => {
            return Math.max(memo, app.name.length)
        }, 0)
    	console.log(chalk.grey(_.padLeft('[' + this.name + ']', longestName + 2)) + ' ' + msg)
    }
}
