
var fs                      =   require('fs');
var os                      =   require('os');
var path                    =   require('path');
var moment                  =   require('moment');
var helper                  =   exports = module.exports = {};
var jsonfile                =   require('jsonfile');

//Set global JSON spacing for easy readability

jsonfile.spaces = 2;


/*
    tempConfig  =   {
        application: 'DEMO_PORTAL',
        user:       {
                    msisdn: '27733659441',
                    firstName:'Admin'
                    lastName:'Admin'
                    status:'ACTIVE',
                    passwordDetails:{
                        hash:'test',
                        status:'ACTIVE',
                    }
            }
    }
 */
helper.tempConfig  =   function(){
    var date    =   moment(Date.now()).format('YYYYMMDD_HH');
    var name    =   os.tmpdir()+'/server_'+date+'_tem.json';
    return(name);
};
helper.permsConfig  =   function(){
    return(__dirname+'/../../../config/permission.json');
};
helper.configPath  =   function(){
    return(path.normalize(__dirname+'/../../..')+'/config/config.json');
};
helper.createTempConfig =   function(payload, url, callback){
    var self    =   this;
    var name    =   self.tempConfig();
   jsonfile.writeFile(name, payload, function(err){
        if(err){
            callback('Please fix permission on your temp folder');
        }else{
            var configPath  =   self.configPath();
            var data        =   JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if(data){
                data.local.database.connectionString =   url;
                jsonfile.writeFile(configPath, data, function(err){
                    if(err){
                        callback('Please fix permission on your config folder');
                    }else{
                        return callback();
                    }
                });
            }else{
                callback('Config error');
            }
        }
    });
};
helper.hasTempFile   =  function(callback){
    return callback(fs.existsSync(this.tempConfig()));
};
helper.loadConfigData   =  function(callback){
    var data        =   JSON.parse(fs.readFileSync(this.tempConfig(), 'utf8'));
    fs.unlinkSync(this.tempConfig());
    return callback(data);
};
helper.loadPermsData   =  function(callback){
    var data        =   JSON.parse(fs.readFileSync(this.permsConfig(), 'utf8'));
    return callback(data);
};
module.exports  =   helper;
