
var mongoose        =   require('mongoose');
var async           =   require('async');
//--------------MIDDLEWARE------------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//------------------------------------------//
var Schema          =   mongoose.Schema;

var OrganisationSchema = new Schema({

    organisationName:   {type: String, required: false},
    cluster_size:       {type: Number, default: 1},
    system:             {type: String, required: false, default:'NO'},
    dbConn:             {type: Object, required: false},
    languages:          [{  language:       {type: Schema.ObjectId,  required: true},
                            org_default:    {type: Boolean, required: true, default: false}
                        }],
    sync_languages:     { type: Boolean, required: false, default: true}
});
OrganisationSchema.plugin(auditor);
OrganisationSchema.plugin(base);
OrganisationSchema.index({organisationName: 1},{unique:true});

OrganisationSchema.methods.hasDefaultLanguage   =   function(callback){
    var self    =   this;
    for(i=0; i<self.languages.length;i++){
        var lang    =   self.languages[i];
        if(lang.org_default === true){
            return callback(null, true);
        }
    }
    return callback(null, false);
}
OrganisationSchema.methods.addLanguage   =   function(lang, user, callback){
    var self            =   this;
    var coll            =   [];
    self.cluster_size   =   (self.cluster_size && self.cluster_size > 0)?self.cluster_size:1;
    async.eachSeries(self.languages, function(l, next){
        coll.push(l.language.toString());
        next();
    }, function done(){
        if(coll.indexOf(lang._id.toString()) > -1){
            return callback('#org.language.add.exist', null);
        }else{
            self.languages.push({language: lang, org_default: self.languages.length === 0});
            self.sync_languages =   true;
            self.persist(user, callback);
        }
    });
}
module.exports  =   mongoose.model('Organisation', OrganisationSchema);
