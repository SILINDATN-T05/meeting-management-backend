var mongoose    =   require('mongoose');
var async       =   require('async');
var ModelState  =   require('../types/ModelState');
var Schema      =   mongoose.Schema;
var ObjectId    =   Schema.ObjectId;


module.exports  =   function UpperCaseName(schema, options){
    var fields  =   [
            {status:        {type: ModelState,  default: 'ACTIVE'}},
            {created:       {type: Date,        default:  Date.now()}},
            {updated:       {type: Date,        default:  Date.now()}},
            {createdBy:     {type: ObjectId,    required: true, ref: 'User'}},
            {updatedBy:     {type: ObjectId,    required: false, ref:'User'}},
        ];
    for(i=0;i<fields.length;i++){
        schema.add(fields[i]);
    }
    var currentModel;
    schema.on('init', init);
    function init (model) {
        currentModel    =   model;
    }
    schema.methods.modelName =   function(){
        return(currentModel.modelName);
    }
    schema.methods.find =   function(options, callback){
        currentModel.find(options, function(err, data){
            return callback(err, data);
        });
    }
    schema.methods.findOne =   function(options, callback){
        currentModel.findOne(options, function(err, data){
            return callback(err, data);
        });
    }
    schema.methods.bindUser =   function(user){
       var self =   this;
        if(user && user!=undefined && user._id){
            self.updatedBy   =   user._id;
            if(self.isNew) {
                self.createdBy = user._id;
            }
        }else{
            throw new Error('#persist.user.'+self.modelName()+'.invalid');
        }
    }
    if(options && options.duplicate){
        schema.pre('save', function(next){
            var self    =   this;
            if(self.isNew){
                var errors  =   [];
                var msg     =   '#'+self.modelName().toLowerCase()+'.create.exist.';
                async.eachSeries(options.duplicate,function iterator(param, callback) {
                    var options     =   {};
                    options[param]  =   self[param];
                    self.findOne(options, function(err, doc){
                        if(!err && doc){
                            errors.push(msg+param);
                        }
                        callback();
                    });
                },function done(){
                    if(errors.length>0){
                        return  next(new Error(errors[0]));
                    }else{
                        return next();
                    }
                });
            }else{
                self.updated    =   Date.now();
                return next();
            }
        });
    }
    //-------------------DELETION HOOKS-----------//
    schema.pre('find', function(next){
        var self    =   this;
        deletionHook(self, function(){
            return next();
        });
    });
    schema.pre('findOne', function(next){
        var self    =   this;
        deletionHook(self, function(){
            return next();
        });
    });
    var deletionHook    =   function(self, callback){
        var isOverride  =   (self._conditions['override'] &&  self._conditions['override']=== true);
        async.waterfall([
            function _override(next) {
                if(isOverride===true){
                    self._conditions['override']    =   null;
                }else{
                    self._conditions['status']  =   {$ne: 'DELETED'};
                }
                next();
            }
        ],
        function done() {
            callback();
        });
    }
}