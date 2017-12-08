

var S           =   require('string');
var async              =   require('async');
var helper      =   exports = module.exports = {};
var _                   = require('lodash');

helper.prepareUpdate = function (old_data, new_data, callback) {
    if (new_data && new_data != undefined) {
        var newData = {};
        var oldData = {};

        old_data = old_data._doc;
        delete old_data.created;
        delete old_data.updated;
        delete old_data.createdBy;
        delete old_data.updatedBy;
        delete old_data.dateRegistered;
        delete new_data.created;
        delete new_data.updated;
        delete new_data.createdBy;
        delete new_data.updatedBy;
        delete new_data.dateRegistered;


        Object.keys(new_data).forEach(function (key) {
            if (typeof new_data[key] === 'object') {
                if (Array.isArray(new_data[key])) {
                    if (new_data[key] !== old_data[key]) {
                        newData[key] = new_data[key];
                    }
                } else {
                    Object.keys(new_data[key]).forEach(function (k) {
                        if (new_data[key][k] != old_data[key][k]) {
                            newData[key][k] = new_data[key][k];
                        }
                    });
                }
            } else if (old_data[key] != new_data[key]) {
                newData[key] = new_data[key];
            }
        });
        if(Array.isArray(new_data)){
            async.forEachOf(new_data, function(data, i, cb) {
                var found = _.findIndex(old_data.limits, ["id", data.id]);
                Object.keys(data).forEach(function (key) {
                    if (typeof data[key] === 'object') {
                        if (Array.isArray(data[key])) {
                            if (data[key] !== old_data[found][key]) {
                                newData[key] = data[key];
                            }
                        } else {
                            Object.keys(new_data[key]).forEach(function (k) {
                                if (new_data[key][k] != old_data[key][k]) {
                                    newData[key][k] = data[key][k];
                                }
                            });
                        }
                    } else if (old_data[found][key] != data[key]) {
                        newData[key] = data[key];
                    }
                });
                cb();
            })
        }else {
            Object.keys(new_data).forEach(function (key) {
                if (typeof new_data[key] === 'object') {
                    if (Array.isArray(new_data[key])) {
                        if (new_data[key] !== old_data[key]) {
                            newData[key] = new_data[key];
                        }
                    } else {
                        Object.keys(new_data[key]).forEach(function (k) {
                            if (new_data[key][k] != old_data[key][k]) {
                                newData[key][k] = new_data[key][k];
                            }
                        });
                    }
                } else if (old_data[key] != new_data[key]) {
                    newData[key] = new_data[key];
                }
            });
        }
        if (oldData.hasOwnProperty('dateRegistered')) {
            delete oldData.dateRegistered;
            delete newData.dateRegistered;
        }
        callback(null, { old_data: old_data, new_data: newData });
    } else {
        callback('#audit_helper.data.invalid', null);
    }
}
module.exports = helper;
