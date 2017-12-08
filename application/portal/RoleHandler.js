
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var Permission      =   require('../../model/Permission-model');
var Role            =   require('../../model/Role-model');
var Org             =   require('../../model/Organisation-model');
var User            =   require('../../model/User-model');
var async           =   require('async');

router.post('/create', function(req, res) {
    var data        =   req.body;
    var user        =   data.user;
    var org         =   data.role.organizationID;
    Org.findOne({organisationName: org}, function(err, org){
        if(err || !org){
            res.send({code:'06', message: '#role.create.org.invalid'});
            return;
        }
        //-------------------------------------------//
        Role.findOne({name: data.role.name, override:'YES'}, function(err, role){
            if(!err && role){
                res.send({code:'06', message: '#role.create.name.exist'});
                return;
            }
            var role                =   new Role();
            role.name               =   data.role.name;
            role.description        =   data.role.description;
            role.organizationID     =   org.organisationName;
            var permissions         =   data.role.permissions;
            if(permissions && permissions.length){
                for(var i=0; i<permissions.length; i++){
                    role.permissions.push(permissions[i]);
                }
            }
            role.persist(user, function(err, role){
                if(!err && role){
                    res.send({code:'00', message: 'success', data:role});
                }else{
                    res.send({code:'06', message: '#role.create.failed'});
                }
            });
        });
    });
});
router.post('/list_all', function(req, res) {
    var session =   req.body.session;
    if(session && session.organizationID){
        Org.findOne({organisationName: session.organizationID}, function(err, org){
            if(!err && org){
                Role.find({}, function(err, result){
                    res.send({code:'00', message: 'success', data: result});
                });
            }else{
                res.send({code:'06', message: '#role.list_all.refused'});
            }
        });
    }else{
        res.send({code:'06', message: '#role.list_all.refused'});
    }
});
router.post('/list_by_id', function(req, res) {
    var session =   req.body.session;
    var data = req.body;
    if(session && session.organizationID){
        Org.findOne({organisationName: session.organizationID}, function(err, org){
            if(!err && org){
                var roleResult = [];
                Role.find({_id:{$in:data.roles}}, function(err, result){
                    if(!err && result){
                        async.forEachOf(result, function (role, i, sb){
                                roleResult.push(role.name);
                                sb();
                            },
                            function close() {
                                res.send({code: '00', message: 'success',data: roleResult});
                            });
                    }else {
                        res.send({code:'06', message: '#role.list_by_id.ntf'});
                    }
                });
            }else{
                res.send({code:'06', message: '#role.list_all.refused'});
            }
        });
    }else{
        res.send({code:'06', message: '#role.list_all.refused'});
    }
});
router.post('/list_org', function(req, res) {
    var session =   req.body.session;
    if(session && session.organizationID) {
        Org.findOne({organisationName: session.organizationID}, function (err, org) {
            if(!err && org){
                Role.find({organizationID: org.organisationName}, function(err, result){
                    res.send({code:'00', message: 'success', data: result});
                });
            }else{
                res.send({code:'06', message: '#role.list.org.required'});
            }
        });
    }else{
        res.send({code:'06', message: '#role.list_org.refused'});
    }
});
router.post('/edit', function(req, res) {
    var data        =   req.body;
    var user        =   data.user;
    var org         =   data.role.organizationID;  //org id
    var role        =   data.role._id;            //role id
    var permissions =   data.role.permissions;      //array of permission
    /*
        {
            "organizationID":"SYSTEM",
            "role":"5649affa85ca90012d7a90fb",
            "permissions":["5649aff985ca90012d7a90dd", "5649aff985ca90012d7a90e3"]
        }
     */
    Role.findOne({_id: role, organizationID: org}, function(err, doc){
        if(!err && doc){
            doc.permissions =   [];
            if(permissions){
                for(var i=0; i<permissions.length; i++){
                    doc.permissions.push(permissions[i]);
                }
            }
            doc.persist(user, function(err, result){
                if(err){
                    res.send({code:'06', message: '#role.update.failed'});
                }else{
                    res.send({code:'00', message: 'success', data: result});
                }
            });
        }else{
            res.send({code:'06', message: '#role.update.invalid'});
        }
    });
});
router.post('/getUsers', function(req, res) {
    var session =   req.body.session;
    var data    =   req.body;
    if(session && session.organizationID){
        Org.findOne({organisationName: session.organizationID, system:'YES'}, function(err, org){
            if(!err && org){
                Role.findOne({name:data.name,organizationID:session.organizationID}, function(err, result){
                    if(!err && result){
                        User.find({roles:{$in:[result._id]}}, function (error, users) {
                            if(!error && users){
                                res.send({code:'00', message: 'success', data: users});
                            }else {
                                res.send({code:'06', message: 'role.'+data.name+'.users.ntf', data: error});
                            }
                        })
                    }else {
                        res.send({code:'06', message: 'role.'+data.name+'.ntf', data: err});
                    }
                });
            }else{
                res.send({code:'06', message: '#role.getUsers.refused'});
            }
        });
    }else{
        res.send({code:'06', message: '#role.list_all.refused'});
    }
});

handler.use('/role', router);
module.exports = handler;
