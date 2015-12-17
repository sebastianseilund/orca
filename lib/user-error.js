export default function(message) {
    let e = new Error(message)
    e.code = 'USER_ERROR'
    return e
}
