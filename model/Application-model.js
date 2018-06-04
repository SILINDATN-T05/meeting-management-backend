var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Channel = require('./types/Channel')

// --------------MIDDLEWARE------------------//
var base = require('./plugins/BaseModel')
var auditor = require('./plugins/TrailsLogger')
// ------------------------------------------//

const ApplicationSchema = new Schema({
  code: {type: String, required: true},
  name: {type: String, required: true},
  version: {type: String, required: false, default: '1.0'},
  description: {type: String, required: false},
  channel: {type: Channel},
  organizationID: {type: String, required: true},
  permissions: [{type: mongoose.Schema.ObjectId, ref: 'Permission'}],
  trans_code: [{
    name: {type: String, required: true},
    code: {type: String, required: true}
  }],
  status: {type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE'},
  public_key: {type: String, required: false},
  private_key: {type: String, required: false}
})
ApplicationSchema.plugin(auditor)
ApplicationSchema.plugin(base)
ApplicationSchema.index({code: 1}, { unique: true })
ApplicationSchema.virtual('isActive').get(function () {
  return (this.status && this.status.valueOf() === 'ACTIVE')
})
module.exports = mongoose.model('Application', ApplicationSchema)
