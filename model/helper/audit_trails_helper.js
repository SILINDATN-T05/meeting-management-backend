var helper  =   module.exports  =   {};
var Changes =   require('../Changes-Model');

helper.createLogger =   function(model, type, callback){
    if(type === 'CREATE'){
        create(model, callback);
    }else if(type === 'UPDATE'){
        update(model, callback);
    }else{
        remove(model, callback);
    }
}
helper.failedLogger =   function(change,failure_reason, callback){
    //console.log('___FAILED CHANGE:',change);
    Changes.findOne({_id:change}, function(err, doc){
        if(doc){
            doc.status          =   'FAILED';
            doc.failure_reason  =   failure_reason;
            doc.save(function(){
                return callback(null, null);
            });
        }else{
            return callback(null, null);
        }
    });
}
var create  =   function(self, callback){
    var changes             =   new Changes();
    changes.model           =   self.modelName();
    changes.typeOfChange    =   'CREATE';
    changes.newObject       =   self;
    changes.oldObject       =   null;
    changes.dateOfChange    =   Date.now();
    //changes.changedBy       =   self.createdBy;
    //--------------CHANGE USER-------------//
    //changes.createdBy   =   self;
    //changes.updatedBy_id   =   self.updatedBy_id;
    changes.createdBy      =   self.createdBy;
    changes.updatedBy      =   self.updatedBy;
    //------------------------------------//
    changes.save(function(err, change){
        return callback(err, change);
    });
}
var update  =   function(self, callback){
    var changes             =   new Changes();
    //console.error('______________MODEL_____',  self.model.modelName||self.modelName());
    changes.model           =   self.model.modelName|| self.modelName();
    changes.typeOfChange    =   'UPDATE';
    changes.newObject       =   self;
    changes.dateOfChange    =   Date.now();
    //--------------CHANGE USER-------------//
    //changes.createdBy_id   =   self.createdBy_id;
    //changes.updatedBy_id   =   self.updatedBy_id;
    changes.createdBy      =   self.createdBy;
    changes.updatedBy      =   self.updatedBy;
    //------------------------------------//
    //changes.changedBy       =   self.updatedBy;
    self.findOne({_id:self._id}, function(err, doc){
        if(!err && doc){
            changes.oldObject       =   doc;
            changes.save(function(err, change){
                return callback(err, change);
            });
        }else{
            return callback('Invalid Update');
        }
    })

}
var remove  =   function(self, callback){
    var changes             =   new Changes();
    changes.model           =   self.model.modelName|| self.modelName();
    changes.typeOfChange    =   'DELETE';
    changes.newObject       =   null;
    changes.oldObject       =   self;
    changes.dateOfChange    =   Date.now();
    //--------------CHANGE USER-------------//
    changes.createdBy      =   self.createdBy;
    changes.updatedBy      =   self.updatedBy;
    //------------------------------------//
    changes.save(function(err, change){
        return callback(err, change);
    });
}
