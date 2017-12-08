var S           =   require('string');
var mongoose    =   require('mongoose');
var helper      =   require('../helper/audit_trails_helper');
var Promise     =   require('mpromise');

module.exports  =   function TrailsLogger(schema){
        schema.pre('save', function(next, done){
            var self        =   this;
            helper.createLogger(self,(self.isNew)?'CREATE':'UPDATE', function(err, change){
                if(!err && change){
                    self.lastChange =   change._id;
                    next();
                }else{
                    next(new Error(err));
                }
            });
        });
        schema.pre('update', function(next){
            var self        =   this;
            helper.createLogger(self,'UPDATE', function(err, change){
                if(!err && change){
                    self.lastChange =   change._id;
                    next();
                }else{
                    next(new Error(err));
                }
            });
        });
        schema.pre('remove', function(next){
            var self        =   this;
            helper.createLogger(self,'DELETE', function(err, change){
                if(!err && change){
                    self.lastChange =   change._id;
                    next();
                }else{
                    next(new Error(err));
                }
            });
        });
        /*
            THIS METHOD REPLACES SAVE
            FOR PROPER AUDIT-TRAILS
         */

        schema.methods.persist   = function(){
            var self        =   this;
            var args        =   Array.prototype.slice.call(arguments, 0);
            var callback    =   args.pop();
            var user        =   args.shift();
            if(user){
                self.bindUser(user);
                self.save(function(err, doc){
                    if(err){
                        helper.failedLogger(self.lastChange,err, function(){
                            return callback(err, doc);
                        })
                    }else{
                        return callback(err, doc);
                    }
                });
            }else{
                return callback(new Error('#model.create.user.required'));
            }
        }
    //---------REMOVE ACTION-------------------//
    schema.methods.delete   =  schema["remove"];
    schema.methods.remove   = function() {
        var self        = this;
        var args        = Array.prototype.slice.call(arguments, 0);
        var user        = args.shift();         // required
        var callback    = args.pop();           //can be thr
        var conditions  = args.shift();         // wen override
        if(!user){
            throw new Error('#model.remove.user.require.'+self.modelName());
        }
        //-------------------------------------//
        if(conditions && conditions.override && conditions.override === true){
            try
            {
                mongoose.model(self.modelName(), schema).findByIdAndRemove(self._id,function(err, doc){
                    return callback(err, doc);
                });
            }catch(e)
            {
                return callback(e);
            }

        }else{
            self.deleted    =   true;
            self.status    =   "DELETED";
            self.persist(user, function(err, doc){
                if(callback){
                    return callback(err, doc);
                }
            });
        }
    }
}