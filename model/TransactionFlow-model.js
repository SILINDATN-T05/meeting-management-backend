var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
var Name            =   require('./plugins/UpperCaseName');
//-----------------------------------------//
var defaultConditions       =       '';

var TransactionFlowSchema = new Schema({
    name :              { type: String, required: true },
    description:        { type: String, required: false},
    extras:             { type: Object, required: false, default:{}},
    transaction_map:    { type: Object, required: false, default:{}},
    global_timeout:     { type: Number, required: false, default: -1},
    result_conditions:  { type: String, default:''},
    //-------------  TRAN FLOW STEPS TRANSITIONS -----------------//
    startStep :    { type: String, required: true },
    steps:         [{
                        name:         { type:  String},
                        tran_step:    { type:  Schema.ObjectId, required: true, ref: 'TransactionFlowStep'},
                        autocomplete :{ type:  String,   enum:['YES','NO'], require:true, default:'YES'},
                        _id:           false,
                        transition:{
                            _id:            false,
                            condition:      {type: String, required: false, default:defaultConditions},
                            onFail:         {type: String, required: true, default:'END'},
                            onSuccess:      {type: String, required: true, default:'END'},
                            name:           {type: String, default:'STEP'},
                        },
                        time_out:           { type: Number, required: false, default: -1},
                        timeout_target:     {type: String, required: true, default:'END'},
                        attempts:           { type: Number, required: false, default: -1},
                        step_config:            { type: Schema.ObjectId, required: false, ref: 'Configuration'},
                   }]
});
TransactionFlowSchema.plugin(base);
TransactionFlowSchema.plugin(auditor);
TransactionFlowSchema.plugin(Name);
TransactionFlowSchema.index({name: 1}, { unique: true });
TransactionFlowSchema.pre('save', function(next) {
    var self    =   this;
    if(self.startStep === null || self.startStep=== undefined){
        next(new Error('#flow.create.step.start.required'));
        return;
    }
    for (z = 0; z < self.steps.length; z++) {
        for (k = 0; k < self.steps[z].transition.length; z++) {
            self.steps[z].transition[k].id  =   mongoose.Types.ObjectId();
        }
    }
    var names   =   [];
    for (z = 0; z < self.steps.length; z++) {
        var step    =   self.steps[z];
        if(names.indexOf(step.name) >-1){
            next(new Error('#flow.create.step.duplicate'));
            return;
        }else{
            names.push(step.name);
        }
    }
    next();
});
module.exports = mongoose.model('TransactionFlow', TransactionFlowSchema);
