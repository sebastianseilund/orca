import Queue from 'promise-queue'
import argv from './argv'

let queue = new Queue(argv.c, Math.Infinity)

export default queue
