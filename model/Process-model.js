
var mongoose = require('mongoose');
var config = require('../engine/Config');
var ProcessState = require('./types/ProcessState');
var Schema = mongoose.Schema;

var ProcessSchema = new Schema({
    name: {type: String, required: true},
    conn: {type: String, required: true},
    cluster: {type: Number, default: 1},
    attempts: {type: Number, default: 0},
    status: {type: ProcessState, default: 'READY'},
    port: {type: Number, default: config.server.service_init_port},
    action: [{
        action: {type: String, required: true},
        action_date: {type: Date, required: true, default: Date.now},
        user: {type: String, required: true},
        reason: {type: String, default: ''},
    }]
});
ProcessSchema.index({name: 1}, {unique: true});
ProcessSchema.methods.logAction = function (action, user, callback) {
    var self = this;
    self.action.push({action_date: Date.now(), action: action, user: user});
    self.save(function (err, doc) {
        if (callback) {
            return callback(err, doc);
        }
    });
}
ProcessSchema.virtual('args').get(function () {
    var args = [];
    var self = this;
    args.push(self.port);
    args.push(self.conn);
    args.push(self.name);
    args.push(self.cluster);
    return (args);
});
module.exports = mongoose.model('Process', ProcessSchema);
