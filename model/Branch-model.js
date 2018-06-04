
let mongoose = require('mongoose')
let Schema = mongoose.Schema

let base = require('./plugins/BaseModel')
let auditor = require('./plugins/TrailsLogger')

const BranchSchema = new Schema({
  name: {type: String, required: true, uppercase: true},
  description: {type: String, required: false, default: null},
  organizationID: {type: String, required: false, default: null},
  status: {type: String, required: false, default: null}
})
BranchSchema.plugin(auditor)
BranchSchema.plugin(base)
BranchSchema.index({name: 1}, { unique: true })
module.exports = mongoose.model('Branches', BranchSchema)
