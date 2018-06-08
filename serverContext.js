var express = require('express')
var log4js = require('log4js')
var bodyParser = require('body-parser')
var auth = require('./engine/middleware/AuthService')
var activityLogger = require('./engine/middleware/ActivityLogger')
var config = require('./engine/Config')
var DbService = require('./engine/DbService')
var setup = require('./application/setup/Setup')
var cors = require('cors')
var _ = require('lodash')
// var pusage = require('pidusage')
var pm2 = require('pm2')
var pmx = require('pmx').init({
  http: true,
  errors: true,
  custom_probes: true,
  transactions: true,
  network: true,  // Network monitoring at the application level
  ports: true  // Shows which ports your app is listening on (default: false)
})

// var getCPU = function () {
//   pm2.list(function (err, processes) {
//       var found = _.findIndex(processes, {name: 'SERVER'})
//         //console.log(processes[0])
//         if (found >= 0) {
//           pusage.stat(processes[found].pid, function (err, stat) {
//                     // console.log('Pcpu: %s', stat.cpu)
//                     // console.log('Mem: %s', stat.memory) //those are bytes
//               return stat.cpu
//                    })
//         }else {
//           return 0
//         }
//     })
// }

// var probe = pmx.probe()
// var metric = probe.metric({
//   name: 'CPU usage',
//   value: function () {
//       return getCPU()
//     },
//   alert: {
//       mode: 'threshold',
//       value: 80,
//       msg: 'Detected over2% CPU usage', // optional
//       action: function () { // optional
//         console.error('Detected over 2% CPU usage')
//       },
//       cmp: function (value, threshold) { // optional
//         return (parseFloat(value) > threshold) // default check
//       }
//     }
// })
// TRANSACTION MANAGER
var TranProcessManager = require('./application/process/TransactionProcessor')
var ProcessManager = require('./application/context/ProcessManager.js')
var processBuffer = require('./application/process/ProcessBuffer')
var tranType = require('./model/TransactionType-model')
// SOCKET CONNECTION

var db = new DbService(require('./engine/Config').database)
var async = require('async')
var S = require('string')

/*
 LOAD MANAGER ON THE CONTEXT
 */
var manager = null// new ProcessManager();
var transManager = null
/*
 APPLICATIONS
 */
var securityCore = require('./application/SecurityCore')
var serverCore = require('./application/SERVERCore')
var serviceManager = require('./application/ManagerCore')
var messageResolver = require('./engine/middleware/MessageResolver')
var logger = log4js.getLogger('SERVER_CONTEXT')
var serverContext = express()
var contextPath = config.server.baseContext + '/'
var serverContextPath = contextPath + 'server/'
var serverContextCore = serverContextPath + 'core/'
var time = new Date()
process.on('uncaughtException', function (err) {
  logger.fatal(err)
})
serverContext.use(cors())
serverContext.use(bodyParser.json({limit: '500mb'}))
serverContext.use(bodyParser.urlencoded({extended: false, limit: '500mb'}))
serverContext.all('*', function (req, res, next) {
  next()
})
db.openConnection(function (err, isConn, db_options) {
  if (!err) {
    if (!isConn) {
            // check if the SERVER has been created on the database, if not it must enter setup mode
      logger.fatal('SETUP STATUS [' + isConn + ']')
      var setup_core = require('./application/setup/SetupCore')
      serverContext.use(contextPath, setup_core)
    } else {
            // Start up the SERVER in full functional mode
      setup(function (done) {
        manager = new ProcessManager()
        serverContext.set('ORG_MANAGER', manager)
        transManager = new TranProcessManager(db_options)
        serverContext.set('TRANS_MANAGER', transManager)
        auth.init(serverContext)
        processBuffer.init(transManager, function () {
          tranType.find({}, function (err, info) {
            async.forEachOf(info, function (entry, index, cb) {
              transManager.startTransaction({}, entry, {}, {}, {}, {}, {}, function (err, info) {
                cb()
              })
            }, function clean () {
              logger.info('---System Process Buffer has been initialized---')
            })
          })
        })
        serverContext.all('*', activityLogger)
        serverContext.all('*', messageResolver)
        logger.info('SETUP STATUS [' + done + ']')
        if (done) {
          logger.debug('STARTING SERVER ON RUNNING MODE')
          serverContext.use(contextPath, securityCore)
          serverContext.use(serverContextPath, serviceManager)
          serverContext.use(serverContextCore, serverCore)
          serverContext.use(function (req, res, next) {
            if (S(req.path).contains('setup/init')) {
              res.json({code: '00', message: 'success'})
            } else {
              res.json({code: '404', message: 'SERVER path [' + req.path + '] not implemented yet!'})
            }
          })
        } else {
          logger.fatal('STARTING SERVER ON SETUP MODE')
          var setup_core = require('./application/setup/SetupCore')
          serverContext.use(contextPath, setup_core)
        }
      })
    }
  } else {
    logger.fatal('SERVER STARTUP FAILED:[' + err + ']')
    process.exit(0)
  }
})

serverContext.on('started', function () {
  var _time = new Date()
//   pm2.list(function (err, processes) {
//     var found = _.findIndex(processes, {name: config.webapi.organizationID})
//     if (found >= 0) {
//       pm2.delete(processes[found].name, function (err_del, deleted) {
//         if (err_del) {
//           logger.info(err_del)
//         } else {
//           logger.info('pm2 successfully cleared child process')
//         }
//       })
//     }
//   })
  logger.info('SERVER STARTUP COMPLETED [', _time - time, 'ms]')
    // pdfService.startServices();
})

module.exports = serverContext
