const express = require('express')
const router = express.Router()
const handler = express()
const Role = require('../../model/Role-model')
const Permission = require('../../model/Permission-model')
const Logs = require('../../model/TranStepLog-model')
const User = require('../../model/User-model')
const async = require('async')
const _ = require('lodash')

router.post('/count_all', function (req, res) {
  async.waterfall([
    function countRoles (next) {
      Role.find({}, function (err, roles) {
        if (!err) {
          next(null, roles.length)
        } else {
          next(null, 0)
        }
      })
    },
    function countPermissions (roles, next) {
      let keys = ['BUTTON',
        'PAGE',
        'ADMINISTRATOR',
        'ACTION',
        'VIEW',
        'WEB-API-SERVICE']
      let result = []
      Permission.find({}, function (err, permissions) {
        if (!err) {
          result = [
            _.filter(permissions, {category: 'BUTTON'}).length,
            _.filter(permissions, {category: 'PAGE'}).length,
            _.filter(permissions, {category: 'ADMINISTRATOR'}).length,
            _.filter(permissions, {category: 'ACTION'}).length,
            _.filter(permissions, {category: 'VIEW'}).length,
            _.filter(permissions, {category: 'WEB-API-SERVICE'}).length
          ]
          next(null, {total: permissions.length, permissions: {name: 'Permissions Vs Category', keys: keys, value: result}}, roles)
        } else {
          result = [0, 0, 0, 0, 0, 0]
          next(null, {total: permissions.length, permissions: {name: 'Permissions Vs Category', keys: keys, value: result}}, roles)
        }
      })
    },
    function countUsers (permission, roles, next) {
      let result = {
        permission: permission,
        roles: roles
      }
      User.find({}, function (err, users) {
        if (!err) {
          result['users'] = users.length
          next(null, result)
        } else {
          result['users'] = 0
          next(null, result)
        }
      })
    }

  ],
        function done (err, results) {
          if (!err) {
            res.send({code: '00', message: 'success', data: results})
          } else {
            res.send({code: '06', message: '#count.count_all.failed'})
          }
        })
})
router.post('/list_all', function (req, res) {
  const query = req.body.query || {}
  Logs.find(query, function (err, result) {
    if (!err) {
      res.send({code: '00', message: 'success', data: result})
    } else {
      res.send({code: '06', message: '#permission.list_all.refused'})
    }
  })
})
handler.use('/count', router)
module.exports = handler
