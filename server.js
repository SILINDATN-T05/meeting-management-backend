var http = require('http')
var util = require('util')
var log4js = require('log4js')
// var config = require('./engine/Config')
var serverContext = require('./serverContext')
var logger = log4js.getLogger('SERVER_CORE')

/**
 * Get port from environment and store in Express.
 */
var port = process.env.PORT // 2. Using process.env.PORT

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
serverContext.set('port', port)
var server = http.createServer(serverContext)
server.listen(port)
server.on('connection', function (socket) {
  socket.setNoDelay(true)
})
server.on('error', function (err) {
  logger.fatal(util.format('ERROR STARTING SERVER CORE [%s], SERVER SHUTTING DOWN', err))
  process.exit()
})
server.on('listening', function () {
  var addr = server.address()
  var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
  logger.debug('SERVER Server has been started on:' + new Date())
  logger.debug('Listening on:' + bind)
  serverContext.emit('started')
})
process.on('SIGINT', function () {
  logger.fatal('SERVER SHUTTING DOWN : ', new Date())
})
