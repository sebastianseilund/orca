import _ from 'lodash'
import sane from 'sane'
import path from 'path'
import chalk from 'chalk'
import hostExec from './host-exec'
import {updateApp} from './marathon'

var longestName = 0

export default class Watcher {
    constructor(opts) {
    	this.name = opts.name
        this.dir = opts.dir
    	if (!opts.glob) {
    		opts.glob = [
    			'**/*.js',
    			'**/*.json',
    			'**/*.html',
    			'**/*.hbs',
    			'**/*.css',
    			'**/*.liquid'
    		]
    	}

    	longestName = Math.max(longestName, this.name.length)

    	this.restarting = false
    	this.again = false

    	this.watcher = sane(this.dir, {
    			glob: opts.glob,
    			watchman: true
    		})
    		.on('ready', () => {
    			this.log('Ready')
                this.restart()
    		})
    		.on('change', this.changed.bind(this, 'Changed'))
    		.on('add', this.changed.bind(this, 'Added'))
    		.on('delete', this.changed.bind(this, 'Deleted'))
    }

    changed(type, filepath) {
    	this.log(type + ' ' + filepath)
    	this.scheduleRestart(500)
    }

    scheduleRestart(delay) {
    	clearTimeout(this.restartTimer)
    	this.restartTimer = setTimeout(this.restart.bind(this), delay)
    }

    async restart() {
    	if (this.restarting) {
    		this.again = true
    		return
    	}
    	this.restarting = true

        try {
            let tag = 'orca.' + Date.now() //TODO: couldn't we override the previous tag? I.e. not use a timestamp
            let imageName = `192.168.23.11:5000/${this.name}:${tag}`
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
    		await this.restart()
    	}
    }

    log(msg) {
    	console.log(chalk.grey(_.padLeft('[' + this.name + ']', longestName + 2)) + ' ' + msg)
    }
}
