
var async = require('async');
var S = require('string');
var Language = require('../../../../model/Language-model');
var User = require('../../../../model/User-model');
var Locale = require('../../../../model/Locale-model');
var helper = exports = module.exports = {};
var logger = require('winston');

helper.mapParams = function (user, req, mapper, callback) {
    async.waterfall([
            /*
             DO MESSAGES
             */
            function doLanguages(next) {
                User.findOne({_id: user}, function (err, doc) {
                    if (!err && doc) {
                        async.waterfall([
                            function userLanguage(fx) {
                                Language.findOne({_id: doc.language}, function (err, doc) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    fx(null, doc);
                                });
                            },
                            function dfLanguage(org_lang, fx) {
                                Language.findOne({system_default: true}, function (err, doc) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    fx(org_lang, doc);
                                });
                            }
                        ], function _t(org_lang, lang) {
                            next(null, org_lang, lang);
                        });
                    } else {
                        next('#trans.params.user.invalid');
                    }
                });
            },
            function doMap(org_lang, lang, next) {
                var result = {};
                var template_error = null;
                async.forEachOf(mapper, function doMap(value, key, cb) {
                    //-------------starts with #-----//
                    if (S(value).startsWith('#')) {
                        //--------------------------//
                        async.waterfall([
                                function _customer(fx) {
                                    var code = S(value).chompLeft('#').s;
                                    var query = [{$match: {code: code.toLowerCase()}},
                                        {$unwind: '$message'},
                                        {$match: {'message.language': lang._id}}
                                    ];
                                    Locale.aggregate(query, function (err, templates) {
                                        if (!err && templates && templates.length > 0) {
                                            //result[key] = templates.shift().message.text;
                                            fx(templates.shift());
                                        } else {
                                            fx(null);
                                        }
                                        //cb();
                                    });
                                },
                                function _org(fx) {
                                    var code = S(value).chompLeft('#').s;
                                    var query = [{$match: {code: code.toLowerCase()}},
                                        {$unwind: '$message'},
                                        {$match: {'message.language': org_lang._id}}
                                    ];
                                    Locale.aggregate(query, function (err, templates) {
                                        if (!err && templates && templates.length > 0) {
                                            //result[key] = templates.shift().message.text;
                                            fx(templates.shift());
                                        } else {
                                            fx(null);
                                        }
                                        //cb();
                                    });
                                }
                            ],
                            function _i(template) {
                                if (template && template.message && template.message.text) {
                                    result[key] = '#' + template.message.text;
                                } else {
                                    template_error = template_error ? template_error : '#trans.template.ntf' + key;
                                }
                                cb();
                            });
                        /*var code = S(value).chompLeft('#').s
                         var query = [{$match: {code: code}},
                         {$unwind: '$message'},
                         {$match: {"message.language": lang._id}}
                         ];
                         Locale.aggregate(query, function (err, templates) {
                         if (!err && templates && templates.length > 0) {
                         result[key] = templates.shift().message.text;
                         }
                         cb();
                         });*/
                        //--------------------------//
                    } else {
                        var parts = value.split('|');
                        var param = parts.shift();
                        var constraints = parts.shift() || 1;
                        var default_value = parts.shift() || undefined;
                        result[param] = req[key] ? req[key]
                            : constraints && constraints === '0'
                            ? default_value
                            ? default_value
                            : ''
                            : default_value;
                        cb();
                    }
                    //-----------------------------//
                }, function _done() {
                    next(template_error, result);
                });
            },
            function doValidate(result, next) {
                var param = null;
                async.forEachOf(result, function doMap(value, key, cb) {
                    param = value === undefined ? key : param;
                    cb();
                }, function _done() {
                    next(param, result);
                });
            }
        ],
        function done(err, result) {
            callback(err, result);
        });
};
module.exports = helper;
