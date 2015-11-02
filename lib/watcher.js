import _ from 'lodash'
import sane from 'sane'
import path from 'path'
import chalk from 'chalk'
import {exec} from './services/vagrant'

var longestName = 0

export default class Watcher {
    constructor(opts) {
    	this.name = opts.name
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

    	this.watcher = sane(opts.dir, {
    			glob: opts.glob,
    			watchman: true
    		})
    		.on('ready', () => {
    			this.log('Ready')
    		})
    		.on('change', this.changed.bind(this, 'Changed'))
    		.on('add', this.changed.bind(this, 'Added'))
    		.on('delete', this.changed.bind(this, 'Deleted'))

        this.restart()
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
            let imageName = `docker-registry.marathon.mesos:31500/${this.name}:lookout`
            console.log(await exec('hostname'))
            this.log('Building image...')
            await exec(`cd /srv/source/${this.name} && docker build -t ${imageName} .`)
            this.log('Pushing image...')
            await exec(`cd /srv/source/${this.name} && docker push ${imageName}`)
            this.log('Updating Marathon...')
            this.log(chalk.green('Restarted'))
        } catch (e) {
            if (e.code == 'EXEC_ERROR') {
                this.log(chalk.red('Error. Exit code was: ' + e.exitCode + '. Output was:'))
				console.log(e.output)
            } else {
                this.log(chalk.red(err.stack || err))
            }
            //TODO: Retry?
        }

        this.restarting = false
    	if (this.again) {
    		this.again = false
    		await this.restart()
    	}
    	// vagrant.exec(this.cmd, function(err, stream) {
    	//     if (err) {
    	// 		self.log(chalk.red(err.stack || err))
    	// 		self.endRestart()
    	// 		return
    	// 	}
    	// 	var output = ''
    	// 	var readOutput = function(data) {
    	// 		output += data
    	// 	}
    	// 	stream.on('data', readOutput)
    	// 	stream.stderr.on('data', readOutput)
    	//     stream.on('close', function(code, signal) {
    	// 		if (code === 0) {
    	// 			self.log(chalk.green('Restarted'))
    	// 		} else {
    	// 			self.log(chalk.red('Error. Exit code was: ' + code + '. Will retry in 1s. Output was:'))
    	// 			console.log(output)
    	// 			self.scheduleRestart(1000)
    	// 		}
    	// 		self.endRestart()
    	//     })
    	// })
    }

    log(msg) {
    	console.log(chalk.grey(_.padLeft('[' + this.name + ']', longestName + 2)) + ' ' + msg)
    }
}
