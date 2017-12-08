
var S           =   require('string');
var async              =   require('async');
var helper      =   exports = module.exports = {};

helper.prepareUpdate  =   function (old_data, new_data, callback) {
    if(new_data && new_data!=undefined) {
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
            var temp1 = {};
            var temp2 = {};
            if(key==='customer_details'&& typeof old_data[key] ==='object'){
                Object.keys(old_data[key]).forEach(function (custKey) {
                    if (old_data.customer_details[custKey] != new_data.customer_details[custKey] && new_data.customer_details[custKey].length > 1) {
                        temp1 = {};
                        temp2 = {};
                        newData[custKey] = new_data.customer_details[custKey];
                        oldData[custKey] = old_data.customer_details[custKey];
                    }
                });
            }else if (old_data[key] != new_data[key] && new_data[key].length > 1) {
                temp1 = {};
                temp2 = {};
                newData[key] = new_data[key];
                oldData[key] = old_data[key];
            }
        });

        if (oldData.hasOwnProperty('dateRegistered')) {
            delete oldData.dateRegistered;
            delete newData.dateRegistered;
        }
        if (oldData.hasOwnProperty('limits')) {
            delete oldData.limits;
            delete newData.limits;
        }
        callback(null, {old_data: oldData, new_data: newData});
    }else{
        callback('#audit_helper.data.invalid', null);
    }
}
module.exports  =   helper;
