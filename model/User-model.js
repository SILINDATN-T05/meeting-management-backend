var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var base = require('./plugins/BaseModel');
var auditor = require('./plugins/TrailsLogger');
var Platform = require('./types/Platform');
var UserStates = require('./types/UserState');
var hook = require('./hooks/User-hook');
var SessionHistory = require('./sub/SessionHistrory-model');

const UserSchema = new Schema({
    msisdn: {type: String, required: true},
    username: {type: String, required: false, default: '',uppercase: true},
    firstName: {type: String, required: true,uppercase: true},
    lastName: {type: String, required: true,uppercase: true},
    status: {type: UserStates, default: 'ACTIVE'},
    roles: [{type: Schema.Types.ObjectId, ref: 'Role'}],
    language: {type: Schema.Types.ObjectId, ref: 'Language'},
    session_actions: [SessionHistory],
    email:{type: String, required: true}
});
UserSchema.plugin(auditor);
UserSchema.plugin(base);
UserSchema.index({msisdn: 1}, {unique: true});
UserSchema.index({username: 1}, {unique: true});
UserSchema.index({email: 1}, {unique: true});
UserSchema.methods.addAccessHistory = function (actions) {
    var self = this;
    if (actions && actions.length > 0) {
        for (i = 0; i < actions.length; i++) {
            self.session_actions.push(actions[i]);
        }
    }
}

UserSchema.pre('save', function (next) {
    hook.preSave(this.isNew, this, next);
})

module.exports = mongoose.model('User', UserSchema);
