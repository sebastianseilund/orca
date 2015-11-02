var _ = require('lodash')
var Watcher = require('./watcher')

module.exports = function(name) {
	new Watcher({
		name: name,
		dir: '/Users/sebsei/projects/audiorental/' + name
	})
}
