import {spawn} from 'child_process'
import argv from './argv'

export default function(cmd, args, opts) {
    return new Promise((resolve, reject) => {
        let s = spawn(cmd, args, opts)

        let output = ''
        let onData = data => {
            if (argv.v) {
                process.stdout.write(data)
            }
            output += data
        }

        s.stdout.on('data', onData)
        s.stderr.on('data', onData)

        s.on('close', function (exitCode) {
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
}
