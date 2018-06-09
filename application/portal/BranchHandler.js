let express = require('express')
let router = express.Router()
let Branch = require('../../model/Branch-model')
let Org = require('../../model/Organisation-model')
let async = require('async')

router.post('/branch/create', function (req, res) {
  let data = req.body
  let user = data.user
  Branch.findOne({NAME: data.branch.name, override: 'YES'}, function (err, branch) {
    if (!err && branch) {
      res.send({code: '06', message: '#branch.create.name.exist'})
      return
    }
    branch = new Branch()
    branch.NAME = data.branch.name
    branch.TELEPHONE = data.branch.telephone
    branch.GPS_LAT = data.branch.gps_lat
    branch.GPS_LONG = data.branch.gps_long
    branch.K8_ACCOUNT_AP = data.branch.k8_account_ap
    branch.K8_ACCOUNT_AR = data.branch.k8_account_ar
    branch.persist(user, function (err, branch) {
      if (!err && branch) {
        res.send({code: '00', message: 'success', data: branch})
      } else {
        res.send({code: '06', message: '#branch.create.failed'})
      }
    })
  })
})
router.post('/branch/list_all', function (req, res) {
  let query = req.body.query || {}
  Branch.find(query, function (err, result) {
    if (!err) {
      res.send({code: '00', message: 'success', data: result})
    } else {
      res.send({code: '06', message: err.message || err})
    }
  })
})
router.post('/branch/list_by_id', function (req, res) {
  let session = req.body.session
  let data = req.body
  if (session && session.organizationID) {
    Org.findOne({organisationName: session.organizationID}, function (err, org) {
      if (!err && org) {
        let branchResult = []
        Branch.find({_id: {$in: data.branchs}}, function (err, result) {
          if (!err && result) {
            async.forEachOf(result, function (branch, i, sb) {
              branchResult.push(branch.name)
              sb()
            },
            function close () {
              res.send({code: '00', message: 'success', data: branchResult})
            })
          } else {
            res.send({code: '06', message: '#branch.list_by_id.ntf'})
          }
        })
      } else {
        res.send({code: '06', message: '#branch.list_all.refused'})
      }
    })
  } else {
    res.send({code: '06', message: '#branch.list_all.refused'})
  }
})

router.post('/branch/edit', function (req, res) {
  let data = req.body
  let user = data.user
  let branch = data.branch._id
  Branch.findOne({_id: branch}, function (err, doc) {
    if (!err && doc) {
      doc.TELEPHONE = data.branch.TELEPHONE
      doc.GPS_LAT = data.branch.GPS_LAT
      doc.GPS_LONG = data.branch.GPS_LONG
      doc.K8_ACCOUNT_AP = data.branch.K8_ACCOUNT_AP
      doc.K8_ACCOUNT_AR = data.branch.K8_ACCOUNT_AR
      doc.persist(user, function (err, result) {
        if (err) {
          res.send({code: '06', message: '#branch.update.failed'})
        } else {
          res.send({code: '00', message: 'success', data: result})
        }
      })
    } else {
      res.send({code: '06', message: '#branch.update.invalid'})
    }
  })
})
module.exports = router
