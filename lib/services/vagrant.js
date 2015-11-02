import {Client} from 'ssh2'
import fs from 'fs'

let conn = new Client()
let connectPromise

export default conn

export function connect() {
    if (connectPromise) {
        return connectPromise
    }
    connectPromise = new Promise((resolve, reject) => {
        conn.connect({
        	host: '192.168.73.10',
        	port: 22,
        	username: 'root',
            agent: process.env.SSH_AUTH_SOCK,
            agentForward: true
        })
        conn.on('ready', function() {
        	resolve(conn)
        })
    })
    return connectPromise
}

export function exec(cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, function(err, stream) {
            if (err) {
                return reject(err)
            }
            var output = ''
            var readOutput = function(data) {
                //TODO: Make this a cli flag
                process.stdout.write(data)
                output += data
            }
            stream.on('data', readOutput)
            stream.stderr.on('data', readOutput)
            stream.on('close', function(exitCode, signal) {
                if (exitCode === 0) {
                    resolve(output)
                } else {
                    let e = new Error('SSH exec error')
                    e.code = 'EXEC_ERROR'
                    e.exitCode = exitCode
                    e.output = output
                    reject(e)
                }
            })
        })
    })
}
