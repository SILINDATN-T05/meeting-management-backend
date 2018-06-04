const express = require('express')
const router = express.Router()
const handler = express()
const Role = require('../../model/Role-model')
const Org = require('../../model/Organisation-model')
let log4js = require('log4js')
let logger = log4js.getLogger('ROLE-HANDLER')
logger.level = 'debug'
router.post('/create', function (req, res) {
  const data = req.body
  const user = data.user
  let org = data.role.organizationID
  Org.findOne({organisationName: org}, function (err, org) {
    if (err || !org) {
      res.send({code: '06', message: '#role.create.org.invalid'})
      return
    }
        // -------------------------------------------//
    Role.findOne({name: data.role.name, override: 'YES'}, function (err, role_exist) {
      if (!err && role_exist) {
        res.send({code: '06', message: '#role.create.name.exist'})
        return
      }
      let role = new Role()
      role.name = data.role.name
      role.description = data.role.description
      role.organizationID = data.role.organizationID
      role.permissions = data.role.permissions
      role.persist(user, function (err, role_doc) {
        if (!err && role_doc) {
          res.send({code: '00', message: 'success', data: role_doc})
        } else {
          res.send({code: '06', message: '#role.create.failed'})
        }
      })
    })
  })
})
router.post('/list_all', function (req, res) {
  const session = req.body.session
  const query = req.body.query || {}
  if (session && session.organizationID) {
    Org.findOne({organisationName: session.organizationID}, function (err, org) {
      if (!err && org) {
        Role.find(query, function (err, result) {
          res.send({code: '00', message: 'success', data: result})
        })
      } else {
        res.send({code: '06', message: '#role.list_all.refused'})
      }
    })
  } else {
    res.send({code: '06', message: '#role.list_all.refused'})
  }
})
router.post('/list_by_id', function (req, res) {
  const session = req.body.session
  const data = req.body
  if (session && session.organizationID) {
    Org.findOne({organisationName: session.organizationID}, function (err, org) {
      if (!err && org) {
        Role.find({_id: {$in: data.roles}}, function (err, result) {
          if (!err && result) {
            res.send({code: '00', message: 'success', data: result})
          } else {
            res.send({code: '06', message: '#role.list_by_id.ntf'})
          }
        })
      } else {
        res.send({code: '06', message: '#role.list_all.refused'})
      }
    })
  } else {
    res.send({code: '06', message: '#role.list_all.refused'})
  }
})
router.post('/list_org', function (req, res) {
  const session = req.body.session
  if (session && session.organizationID) {
    Org.findOne({organisationName: session.organizationID}, function (err, org) {
      if (!err && org) {
        Role.find({organizationID: org.organisationName}, function (err, result) {
          res.send({code: '00', message: 'success', data: result})
        })
      } else {
        res.send({code: '06', message: '#role.list.org.required'})
      }
    })
  } else {
    res.send({code: '06', message: '#role.list_org.refused'})
  }
})
router.post('/edit', function (req, res) {
  const data = req.body
  const user = data.user
  const org = data.role.organizationID
  const role = data.role._id
  Role.findOne({_id: role, organizationID: org}, function (err, doc) {
    if (!err && doc) {
      doc.name = data.role.name
      doc.description = data.role.description
      doc.permissions = data.role.permissions
      doc.persist(user, function (err, result) {
        if (err) {
          logger.fatal(err)
          res.send({code: '06', message: '#role.update.failed'})
        } else {
          res.send({code: '00', message: 'success', data: result})
        }
      })
    } else {
      res.send({code: '06', message: '#role.update.invalid'})
    }
  })
})

handler.use('/role', router)
module.exports = handler
