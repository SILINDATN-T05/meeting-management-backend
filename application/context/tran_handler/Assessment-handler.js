var async = require('async');
var Chance = require('chance');
var moment = require('moment');
var S = require('string');
var TranHandler = require('./TranHandler');
var User = require('../../../model/User-model');
var Role = require('../../../model/Role-model');
var Session = require('../../../model/Session-model');
var AuthDetail = require('../../../model/AuthDetail-model');
var Assessment = require('../../../model/Assessment-model');
var Part = require('../../../model/Part-model');
var Application = require('../../../model/Application-model');
var Org = require('../../../model/Organisation-model');
var helper = require('../../../engine/HashService');
var serverHelper = require('./helper/serverHelper');
var helper_query             =   require('./../../../application/context/tran_handler/helper/query_helper');
var audit_helper       =   require('./../../../application/context/tran_handler/helper/auditHelper');
var configurations     =   require('../../../engine/ConfigService');
var AssessmentAtt      =   require('../../../model/AssessmentAttachedment');
var config             =   new configurations();
var passwordSheriff    =   require('password-sheriff');
var shortid            =   require('shortid');
var PasswordPolicy     =   passwordSheriff.PasswordPolicy;
var logger             =   require('util');
var randomize          = require('randomatic');
var _                  = require('lodash');
var charsets           =   passwordSheriff.charsets;
var handler = new TranHandler();
var chance = new Chance();

handler.processStep = function (uri, headers, filter, payload, callback) {

    var action = payload.action;
    switch(action){
        case 'create_assessment':
            async.waterfall([
                function prepare_parts(next){
                    try{
                        var parts = filter.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
                        console.log(typeof parts, headers);
                        parts = parts.replace('"[', '[');
                        parts = parts.replace(']"', ']');
                        parts = JSON.parse(parts)
                        next(null, parts)
                    }catch(e){
                        console.log(e);
                        next(null, []);
                    }
                },
                function insertImages(parts, next){
                    try{
                        payload.images = JSON.parse(payload.images);
                    }catch(e){

                    }
                    var imageIds = [];
                    async.forEachOf(payload.images, function(image, index, cb){
                        var attached = new AssessmentAtt();
                        attached.filename = image.filename;
                        attached.filedata = image.filedata;
                        attached.persist(payload.user, function(err, image_doc){
                            if(!err){
                                imageIds.push(image_doc._id);
                                cb();
                            }else{
                                cb();
                            }
                        })
                    },function done(){
                        next(null, imageIds, parts)
                    });
                    
                },
                function insertPdf(images, parts, next){
                    try{
                        payload.pdf = JSON.parse(payload.pdf);
                    }catch(e){
                    }
                    var attached = new AssessmentAtt();
                    attached.filename = payload.pdf.filename;
                    attached.filedata = payload.pdf.filedata;
                    attached.persist(payload.user, function(err, pdf_doc){
                        if(!err){
                            next(null, pdf_doc._id, images, parts);
                        }else{
                            next(null, "", images, parts);
                        }
                    })
                },
                function insertAssessment(pdf, images, parts, next){
                    Assessment.findOne({assessment_no:payload.assessment_no}, function(error, assessment_info){
                        if(!error && assessment_info){
                            next(null, parts, assessment_info, 'exist');
                        }else{
                            var assessment = new Assessment();
                            assessment.warranty_status = payload.warranty_status;
                            assessment.vehicle_id      = payload.vehicle_id||'';
                            if(payload.repair_date && payload.repair_date.length>4){
                                assessment.repair_date =new Date(payload.repair_date);
                            }
                            assessment.mbr_id = payload.mbr_id||'';
                            assessment.claim_no = payload.claim_no;
                            assessment.assessment_no = payload.assessment_no;
                            assessment.insurer_rep = payload.insurer_rep||'';
                            assessment.images    = images||[];
                            assessment.pdf       = pdf||"";
                            assessment.persist(payload.user, function(err, assessment_doc){
                                if(err){
                                    next(err, null);
                                }else{
                                    next(null, parts, assessment_doc, 'new');
                                }
                            })
                        }
                    })
                },
                function insertPart(parts, assessment, state, next){
                    if(state==='new'){
                        async.forEachOf(parts, function(part, index, cb){
                            var _part  = new Part();
                            _part.assessment_id = assessment._id;
                            _part.oe_no = part.partNumber||'';
                            _part.auda_guid = part.guid||'';
                            _part.auda_id = part.id||'';
                            _part.auda_description = part.partDescription||'';
                            _part.auda_price = part.partPrice||'0';
                            _part.persist(payload.user, function(err, part_doc){
                                console.log(err);
                                cb();
                            })
                        },
                        function close(){
                            next(null, {data:assessment, message:'successfully created assessment'});
                        });
                    }else{
                        try{
                        async.waterfall([
                            function getAssessmentParts(next){
                                Part.find({assessment_id:assessment._id}, function(error, assessment_parts){
                                    if(!error && assessment_parts.length>0){
                                        next(null, assessment_parts)
                                    }else{
                                        next(null, []);
                                    }
                                })
                            },
                            function CompareParts(assessment_parts, next){
                                var parts_array = parts;
                                async.forEachOf(assessment_parts, function(part, index, cb){
                                    console.log(assessment_parts, parts_array);
                                    async.forEachOf(parts_array, function(_part, _index, _cb){
                                        if(_part.id!= undefined&&part.auda_id!=undefined &&part.auda_id===_part.id.toString()){
                                            _.pullAt(parts_array,[_index]);
                                            cb();
                                        }else{
                                            _cb();
                                        }
                                    },
                                    function done(){
                                        cb();
                                    })
                                }, function close(){
                                    next(null, parts_array)
                                })
                            },
                            function insertPart(parts_different, next){
                                async.forEachOf(parts_different, function(part, index, cb){
                                    var _part  = new Part();
                                    _part.assessment_id = assessment._id;
                                    _part.oe_no = part.partNumber||'';
                                    _part.auda_guid = part.guid||'';
                                    _part.auda_id = part.id||'';
                                    _part.auda_description = part.partDescription||'';
                                    _part.auda_price = part.partPrice||'0';
                                    _part.additional = 'YES';
                                    _part.persist(payload.user, function(err, part_doc){
                                        console.log(err);
                                        cb();
                                   })
                                },
                                function close(){
                                    next(null, assessment);
                                });
                            }
                        ],
                        function done(err, assessment){
                            if(!err){
                                next(null, {data:assessment, message:'assessment successfully updated'});
                            }else{
                                next(err, null);
                            }
                        });
                    }catch(err){
                        next(err, null);
                    }
                }
                    
                }
            ], 
            function done(error, result){
                if(error){
                    callback({code: '06', message: error});
                }else{
                    callback(null, {code: '00', message: result.message, data:result.data});
                }
            });
            break;
        default:
            callback({code: '06', message: '#payload.action.invalid'});
    }
};
module.exports = handler;
