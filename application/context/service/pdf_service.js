var request = require("request");
var Model = require('../../../model/index');
var fileTransactions = Model.FileTransactions;
var scheduleTransaction = Model.ScheduleTransactions;
var OnceOffTransactions = Model.OnceOffTransactions;
var ISOLoggers = Model.Is;
var config = Model.Config;
var file = Model.Files;
var async = require('async');
var moment = require('moment');
var handler = require('../tran_handler/PostJSON-handler');
var xfdf = require('xfdf')
//var url = 'https://localhost:9195/api/';
var tokenInfo = null;
var configInfo = null;
var S = require('string');
var path = require('path');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var _ = require('lodash');
var trim = require('trim');
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
var TOKEN_DIR = path.join(__dirname, '.credentials/');
var TOKEN_PATH = TOKEN_DIR + 'gmail-parts-portal-automation.json';
var config = require('./../../../engine/Config');
var PdfService = function () {
};
/**
 * the main pdf service with a interval timer for executing
 * **/
PdfService.prototype.startServices = function () {
    setTimeout(function () {
            setInterval(function () {
                var client_secret = path.join(__dirname,'client_secret.json')
                fs.readFile(client_secret, function processClientSecrets(err, content) {
                    if (err) {
                        console.log('Error loading client secret file: ' + err);
                        return;
                    }
                    // Authorize a client with the loaded credentials, then call the
                    // Gmail API.
                    authorize(JSON.parse(content), getMessages);
                });
                /* var directoryPath = path.join(__dirname,'files');
                fs.readdir(directoryPath, function (err, files) {
                    //handling error
                    if (err) {
                        return console.log('Unable to scan directory: ' + err);
                    }else{
                        async.forEachOf(files, function (file, index, callback) {
                            // Do whatever you want to do with the file
                            console.log(file);
                            var filePath = path.join(directoryPath,file);
                            async.waterfall([
                                function getConfigValues(next){
                                    config.findOne({name: "pdf_services"}, function (err, info) {
                                        if (!err && info && info.value) {
                                            next(null, info.value);
                                        }else{
                                            next(err, null);
                                        }
                                    })
                                },
                                function getPdfArray(data, next){
                                    var pdf2table = require('pdf2table');
                                    var fs = require('fs');
                                    fs.readFile(filePath, function (err, buffer) {
                                        if (err){
                                            next(err, null);
                                        }else{
                                            pdf2table.parse(buffer, function (err, rows, rowsdebug) {
                                            if(err){
                                                next(err, null);          
                                            }else {
                                                next(null, rows, data);
                                            }
                                        });
                                        }
                                        
                                    });
                                },
                                function readPdf(pdfarray, data, next){
                                    console.log('GET PDF TEXT FROM    :',filePath);
                                    var PDFJS = require('pdfjs-dist');
                                    var pdfdata = new Uint8Array(fs.readFileSync(filePath));
                                        PDFJS.getDocument(pdfdata).then(function (pdf) {
                                            var pdfDocument = pdf;
                                            var pagesPromises = [];
                                
                                            for (var i = 0; i < pdf.pdfInfo.numPages; i++) {
                                                (function (pageNumber) {
                                                    pagesPromises.push(getPageText(pageNumber, pdfDocument));
                                                })(i + 1);
                                            }
                                            Promise.all(pagesPromises).then(function (pagesText) {
                                                async.forEachOf(pagesText, function (page_data, index, cb) {
                                                    // page = S(page).replaceAll(' ', '').s
                                                    var page = page_data;
                                                    async.forEachOf(data, function (field, i, sb) {
                                                        if(field.replace && field.replace===true){
                                                            page = S(page_data).replaceAll(' ', '').s;
                                                        }
                                                        var start = page.search(field.search)+ field.search.length;
                                                        if(field.name=='insurer_rep' && field.value===""){
                                                            field.value = pdfarray[0];
                                                        }
                                                        if(page.search(field.search)>0){
                                                            //console.log(field.search, start)
                                                            var temp = page.substring(start);
                                                            var end = temp.search(field.cutAt);
                                                            var value_data = temp.substring(0, end);
                                                            if(field.value==="" && start>0 && end>0 && !Array.isArray(field.value)){
                                                                field.value = value_data;
                                                                sb();
                                                            }else if(Array.isArray(field.value)){
                                                                var value = value_data;
                                                                async.forEachOf(field.value, function (_value, _i, _cb) {
                                                                    //console.log(value, _value)
                                                                    if(_value.replace && _value.replace===true){
                                                                        value = S(value_data).replaceAll(' ', '').s;
                                                                    }
                                                                    console.log(S(value).contains(_value.search), _value.search,value.search(_value.search), value);
                                                                    if(S(value).contains(_value.search)) {
                                                                        var st = value.search(_value.search) + _value.search.length;
                                                                        if(value.search(_value.search)>=0){
                                                                            var tem = value.substring(st);
                                                                            var en = 0;
                                                                            var alen = 0;
                                                                            if (_value.cutAt != undefined) {
                                                                                en = tem.search(_value.cutAt);
                                                                                if(_value.alcutAt != undefined){
                                                                                    alen = tem.search(_value.cutAt);
                                                                                }
                                                                                if(alen<en && alen>0){
                                                                                    en = alen;
                                                                                }else if(en<=0 && alen>0){
                                                                                    en = alen
                                                                                }
                                                                            } else {
                                                                                _value.value = tem;
                                                                            }
                                                                           // console.log(st,en,tem, tem.substring(0, en))
                                                                            if (_value.value === "" && st > 0 && en > 0) {
                                                                                //console.log(st, en, tem, tem.substring(0, en))
                                                                                var temp2save = tem.substring(0, en);
                                                                                if(_value.alcutAt != undefined && S(temp2save).contains(_value.alcutAt)){
                                                                                    _value.value = temp2save.substring(0, temp2save.search(_value.alcutAt));
                                                                                    _cb();
                                                                                }else{
                                                                                    _value.value = temp2save;
                                                                                    _cb();
                                                                                }
                                                                            }else if (_value.value === "" && st > 0 && en < 0){
                                                                                _value.value = tem;
                                                                                _cb();
                                                                            }  else {
                                                                                _cb();
                                                                            } 
                                                                        }else{
                                                                            _cb();
                                                                        }
                                                                        
                                                                    }else{
                                                                        _cb();
                                                                    }
                                                                },function done() {
                                                                    sb();
                                                                })
                                                            }else{
                                                                sb();
                                                            }
                                                        }else{
                                                            sb();
                                                        }
                                                        
                                                    },function sbClose() {
                                                        cb();
                                                    })
                                                }, function close() {
                                                    next(null, {data:data, array:pdfarray, pdfText:pagesText});
                                                });
                                                //console.log(pagesText);
                                            });
                                
                                        }, function (reason) {
                                            // PDF loading error
                                            console.error(reason);
                                            next(reason, null);
                                        });
                                },
                                function createObject(result, next){
                                    var new_data = {};
                                    async.forEachOf(result.data, function(value, index, value_cb){
                                        if(Array.isArray(value.value) && value.value.length>1){
                                            new_data[value.name] = {};
                                            async.forEachOf(value.value, function(_value, _index, _cb){
                                                new_data[value.name][_value.name] = _value.value;
                                                _cb();
                                            },function done(){
                                                value_cb();
                                            })
                                        }else{
                                            new_data[value.name] = value.value;
                                            value_cb();
                                        }
                                    },function done(){
                                        result['final_data'] = new_data;
                                        next(null, result);
                                    })
                                },
                                function getParts( result, next){
                                    const tabula = require('tabula-js');
                                    const t = tabula(filePath,{pages: "all"});
                                    t.extractCsv(function(err, data){
                                        //console.log(_.findIndex(data,"PARTS,"), Array.isArray(data));
                                        var tableindex = 0;
                                        var table = [];
                                        var tableend = 0;
                                
                                        async.forEachOf(data, function (value, index, cb) {
                                            if(S(value).contains('Repair Information')){
                                                tableindex = index+3;
                                            }else if(S(value).contains('I:')){
                                                tableend = index;
                                            }
                                            //console.log(value, index);
                                            cb();
                                        })
                                        for(var i=tableindex;i<tableend;i++){
                                            table.push(data[i]);
                                        }
                                
                                        //console.log(table);
                                        var parts = [];
                                        async.forEachOf(table, function (value, index, cb) {
                                            S(value).replaceAll('"','').s
                                            if(index!==0) {
                                                var gno = value.substring(0,value.search(' '));
                                        
                                                var price = '';
                                                var desc = '';
                                                var oe_no = '';
                                                var array = [];
                                                var temp = value.substring(value.search(' '));
                                                temp  = S(temp).replaceAll('"','').s
                                                if(temp.search(',')>=0){
                                                    array = temp.split(',');
                                                    if(S(array[array.length-2]).contains('R')){
                                                        var p = array[array.length-2].replace('R','') + array[array.length-1];
                                                        price = p;
                                                        oe_no = array[array.length-3];
                                                        for(var i = 0; i<array.length-3;i++){
                                                            desc += array[i] + ' ';
                                                        }
                                                    }else{
                                                        price = array[array.length-1].replace('R','');
                                                        oe_no = array[array.length-2];
                                                        if(oe_no==='' || oe_no ===' '){
                                                            var secodelast = nthIndex(array[array.length-3],' ', 2);
                                                            desc = array[array.length-3].substring(0, secodelast);
                                                            oe_no = array[array.length-3].substring(secodelast);
                                                        }else {
                                                            for (var i = 0; i < array.length - 2; i++) {
                                                                desc += array[i] + ' ';
                                                            }
                                                        }
                                                    }
                                                    //console.log(array);
                                                }else{
                                                    array  = temp.split(' ');
                                                    if(S(array[array.length-2]).contains('R')){
                                                        var p = array[array.length-2].replace('R','') + array[array.length-1];
                                                        price = p;
                                                        oe_no = array[array.length-3];
                                                        for(var i = 0; i<array.length-3;i++){
                                                            desc += array[i] + ' ';
                                                        }
                                                    }else{
                                                        price = array[array.length-1].replace('R','');
                                                        oe_no = array[array.length-2];
                                                        if(oe_no==='' || oe_no ===' '){
                                                           var secodelast = nthIndex(array[array.length-3].trim(),' ', 2);
                                                           desc = array[array.length-3].substring(0, secodelast);
                                                           oe_no = array[array.length-3].substring(secodelast);
                                                        }else {
                                                            for(var i = 0; i<array.length-2;i++){
                                                                desc += array[i] + ' ';
                                                            }
                                                        }
                                
                                                    }
                                                    //console.log(array);
                                                }
                                                if(S(price).contains('undefined')){
                                                    price = price.replace('undefined','');
                                                }
                                                parts.push({'GNO':gno, "price":price, "oe_no":oe_no, "desc":desc});
                                                cb();
                                            }else{
                                                cb();
                                            }
                                        },
                                            function done() {
                                                result['final_data']['parts'] = parts;
                                                //console.log(result['final_data']);
                                                next(null, result['final_data']);
                                            })
                                    });
                                }
                            ],
                            function done(error, result){
                                //console.log(error, result);
                                var Pdf = require('./pdfjson');
                                var pd = new Pdf();
                                pd.pdt2json = result;
                                pd.save(function (errors, pddata) {
                                    data = {};
                                    if (errors) {
                                        console.log('Logs not saved', errors);
                                    } else {
                                        console.log('logs saved')
                                    }
                                })
                                callback();
                            })
                        });
                    }
                });*/
              }, 10000)
    }, 10000);
};



/**
 * get the test from each pdf page
 * **/
function getPageText(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the text of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;
                var finalString = "";
                //console.log(textContent)

                // Concatenate the string of the item to the final string
                for (var i = 0; i < textItems.length; i++) {
                    var item = textItems[i];

                    finalString += item.str + " ";
                }

                // Solve promise with the text retrieven from the page
                resolve(finalString);
            });
        });


    })
}

/**
 * get the part number from a space separed string
 * **/
function nthIndex(str, pat, n){
    var L= str.length, i= -1;
    while(n!=0){
        i= str.lastIndexOf(pat);
        str = str.substring(0, i);
        if(str.length>4){
            n=0;
        }else{
            n--;
        }
    }
    return i;
}

// Authorise the application on GMail.
var authorize = function (credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    // Check if we have previously stored a token.
    //console.log(TOKEN_PATH);
    fs.readFile(TOKEN_PATH, function (err, token) {
        //console.log(err, token)
        if (err) {
            getNewToken(oauth2Client, callback);
        }
        else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
};

// If authorisation has not been given yet, we need to get a new token.
var getNewToken = function (oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        console.log(code)
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
};

// Store the new token.
var storeToken = function (token) {
    console.log(token)
    try {
        fs.mkdirSync(TOKEN_DIR);
    }
    catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    console.log(token)
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), function (err, data) {
        console.log(err, data, TOKEN_PATH);
    });
    console.log('Token stored to ' + TOKEN_PATH);
};

// Get all the message in the Gmail inbox.
var getMessages = function (auth) {
    var gmail = google.gmail('v1');
    gmail.users.messages.list({
        auth: auth,
        userId: 'me',
        q: 'in:inbox'
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var messages = response.messages;
        if (_.isUndefined(messages) || messages.length == 0) {
            console.log('No messages found.');
        }
        else {
            console.log('Messages:');
            async.forEachOf(messages, function (message, index, message_callback) {
                FetchSingleMessage(auth, message.id);
                message_callback();
            });
        }
    });
};

// Fetch a single message and get the attachments.
var FetchSingleMessage = function (auth, messageId) {
    var gmail = google.gmail('v1');
    gmail.users.messages.get({
        auth: auth,
        userId: 'me',
        id: messageId
    }, function (error, response) {
        if (error) {
            console.log('Error Occured: ', error);
        }
        else {
            getAttachments(auth, response);
        }
    });
};

// Get the attachment, and send it to be parsed for claim creation.
var getAttachments = function (auth, message) {
    var gmail = google.gmail('v1');
    var parts = message.payload.parts;
    var assessment_pdf = {};
    var assessment_images = [];
    async.forEachOf(parts, function (part, i, cb) {
        var pdf = part.filename.search('.pdf');
        if (part.filename && part.filename.length > 0) {
            var attachId = part.body.attachmentId;
            gmail.users.messages.attachments.get({
                auth: auth,
                id: attachId,
                messageId: message.id,
                userId: 'me'
            }, function (error, attachment) {
                if (error) {
                    console.log('Error occured while reading attachment: ' + error.message);
                    archiveMessage(auth, message);
                    cb();
                }
                else {
                    if(pdf!==-1){
                        assessment_pdf = {filename:part.filename, filedata:attachment.data};
                        cb();
                    }else{
                        var image = attachment.data;
                        image = image.replace(/_/g, '/');
                        image = image.replace(/-/g, '+');
                        assessment_images.push({filename:part.filename, filedata:image});
                        cb();
                    }
                }
            });
        }else{
            cb();
        }
    }, function done() {
        var found = _.findIndex(message.payload.headers, {name:'Subject'});
        var subject = message.payload.headers[found].value.substring(message.payload.headers[found].value.lastIndexOf(':')+1);
        var assessment_no = subject.lastIndexOf('/')>0?subject.substring(0, subject.lastIndexOf('/')):subject;
        console.log(subject, assessment_no);
        create_assessment(assessment_no, assessment_images, assessment_pdf, auth, message.id, archiveMessage);
        // var filePath  =  path.join(__dirname,"/pdfs/"+ assessment_pdf.filename)
        // fs.writeFileSync(filePath, Buffer.from(assessment_pdf.filedata, 'base64'), { encoding: 'binary' });
        // Continue to parse the data, and return to archive the mail when done.
        // assessment_pdf_reader(filePath, assessment_images,assessment_pdf, auth, message.id, archiveMessage);
    });
};

// The claim has successfully been created, we can now archive this mail.
var archiveMessage = function (auth, messageId) {
    var gmail = google.gmail('v1');
    gmail.users.messages.modify({
        auth: auth,
        userId: 'me',
        id: messageId,
        resource: {
            removeLabelIds: ['INBOX']
        }
    }, function (error, response) {
        if (error) {
            console.log('Error Occured: ', error);
        }
        else {
            console.log("Message " + messageId + " successfully processed.");
        }
    });
};

// For development only.
var listLabels = function (auth) {
    var gmail = google.gmail('v1');
    gmail.users.labels.list({
        auth: auth,
        userId: 'me'
    }, function (error, response) {
        console.log(response);
    });
};

/***
 * get assessment, get assessmegt parts
 * <!params>
 *  images
 *  assessment_no
 *  pdf
 *  </params>
 * ** */
var create_assessment = function(assessment_no, Images, PDF, GmailAuth, GmailMessageId, callback){
    async.waterfall([
        /**
         * Server login, to get token
         * **/
        function login(next){
            var options = { method: 'POST',
              url: config.url_token,
              headers: 
               { 'postman-token': '9660cbf0-f21b-f2e8-7dca-224d5893b7ff',
                 'cache-control': 'no-cache',
                 'content-type': 'application/json' },
              body: 
               { username: config.webapi.username,
                 password: config.webapi.password,
                 channel: config.webapi.channel,
                 organizationID: config.webapi.organizationID,
                 application: config.webapi.application },
              json: true };
            
            request(options, function (error, response, body) {
                console.log(body)
              if (error){
                  next(error, null);
              }else{
                next(null, body.access_token);
              }
            });
            
        },
        function getAssessment(token, next){
            var request_body = {
                assessment_no: assessment_no,
                trans_type:"GETASSESSMENT001"
            }
            var options = { method: 'POST',
            url: config.url,
            headers: 
             {
               'x-access-token': token,
               'content-type': 'application/json' },
            body: request_body,
            json: true };
          
            request(options, function (error, response, body) {
                if (error){
                    next(error, null);
                }else{
                    if(body.data && body.data.code==='00'){
                        next(null, body.data.data.data||body.data.data, token);
                    }else{
                        next(body.data||body, null);
                    }
                }
            })
        },
        function createAssessment(assessment_data, token, next){
            /* "id": 0,
            "assessmentId": "MGA30343_C1000000",
            "manufacturer": "CHEVROLET",
            "model": "Sonic",
            "subModel": "LS",
            “modelSheetNumber”: "383402",
            "vehicleType": "string",
            "vinNumber": "KL1JJ5DF9DB094961",
            "modelYear": "2013",
            "registrationNumber": "CK28LHGP",
            “engineNumber”: "A14XER19YT5953",
            “registrationMonth”: "January",
            “registrationYear”: "2013",
            “odometer”: "88732",
            “colour ”: "Silver",
            “paintCode”: "",
            “modelSpec”: "FROM MODEL 2013,AIR CONDITIONING,FOG LAMP,1364CCM 103KW,TYRE 195/65 R 15.. H,ALU RIMS 6J X 15,4 DOOR,2 COAT METALLIC,PAINTING OFF VEHICLE",
            “creatorSiteId”: "",
            “lastUpdatedBy”: "",
            “workProvider”: "ABSA I DIRECT",
            “versionNumber”: "1",
            “claimNumber”: "475701/3/16",
            “policyNumber”: "47/5701/3/16",
            “submittedBy”: "Part Sourcing 01",
            “dateOfAccident”: "",
            “repairerName”: "Reef tune up",
            “repairerAddress”: "",
            “repairerTel”: "",
            “repairerId”: "1048",
            “assessorName”: "",
            “assessorAddress ”: "",
            "repairStartDate": "",
            “repairEndDate”: "",
            “underWarranty”: "NO",
            “warrantyExpiry”: "",
            “submittedDateTime”: "",
             "dateReceived": "",*/
            var request_body = {
                insurer_rep: assessment_data.submittedBy,
                assessment_no: assessment_no,
                claim_no:assessment_data.claimNumber,
                mbr_id: assessment_data.repairerId,
                repair_date:  assessment_data.repairStartDate,
                vehicle_id:       assessment_data.registrationNumber,
                warranty_status:       assessment_data.underWarranty,
                images:JSON.stringify(Images).replace(/"/g, "\\\""),
                pdf:JSON.stringify(PDF).replace(/"/g, "\\\""),
                trans_type:"CREATEASSESSMENT001"
            }
            var options = { method: 'POST',
            url: config.url,
            headers: 
             {
               'x-access-token': token,
               'content-type': 'application/json' },
            body: request_body,
            json: true };
          
            request(options, function (error, response, body) {
                if (error){
                    next(error, null);
                }else{
                    if(body.data && body.data.code==='00'){
                        next(null, body.data);
                    }else{
                        next(body.data||body, null);
                    }
                }
            })
        }
    ],
    function done(error, result){
        //console.log(error, result);
        if(error){
            console.log(error);
            callback(null, null);
        }else{
            callback(GmailAuth, GmailMessageId);
        }
        
    })
}
/**
 * Read data from a pdf file
 * **/
var assessment_pdf_reader = function(filePath,Images,PDF, GmailAuth, GmailMessageId, callback){
    console.log(filePath);
    async.waterfall([
        /**
         * Read config values from db
         * **/
        function getConfigValues(next){
            config.findOne({name: "pdf_services"}, function (err, info) {
                if (!err && info && info.value) {
                    next(null, info.value);
                }else{
                    next(err, null);
                }
            })
        },
        /**
         * read pdf as a table array**/
        function getPdfArray(data, next){
            var pdf2table = require('pdf2table');
            var fs = require('fs');
            fs.readFile(filePath, function (err, buffer) {
                if (err){
                    next(err, null);
                }else{
                    pdf2table.parse(buffer, function (err, rows, rowsdebug) {
                    if(err){
                        next(err, null);          
                    }else {
                        next(null, rows, data);
                    }
                });
                }
                
            });
        },
        /**
         * read all text from pdf
         * **/
        function readPdf(pdfarray, data, next){
            console.log('GET PDF TEXT FROM    :',filePath);
            var PDFJS = require('pdfjs-dist');
            var pdfdata = new Uint8Array(fs.readFileSync(filePath));
                PDFJS.getDocument(pdfdata).then(function (pdf) {
                    var pdfDocument = pdf;
                    var pagesPromises = [];
        
                    for (var i = 0; i < pdf.pdfInfo.numPages; i++) {
                        (function (pageNumber) {
                            pagesPromises.push(getPageText(pageNumber, pdfDocument));
                        })(i + 1);
                    }
                    Promise.all(pagesPromises).then(function (pagesText) {
                        async.forEachOf(pagesText, function (page_data, index, cb) {
                            // page = S(page).replaceAll(' ', '').s
                            var page = page_data;
                            async.forEachOf(data, function (field, i, sb) {
                                if(field.replace && field.replace===true){
                                    page = S(page_data).replaceAll(' ', '').s;
                                }
                                var start = page.search(field.search)+ field.search.length;
                                if(field.name=='insurer_rep' && field.value===""){
                                    field.value = pdfarray[0];
                                }
                                if(page.search(field.search)>0){
                                    //console.log(field.search, start)
                                    var temp = page.substring(start);
                                    var end = temp.search(field.cutAt);
                                    var value_data = temp.substring(0, end);
                                    if(field.value==="" && start>0 && end>0 && !Array.isArray(field.value)){
                                        field.value = value_data;
                                        sb();
                                    }else if(Array.isArray(field.value)){
                                        var value = value_data;
                                        async.forEachOf(field.value, function (_value, _i, _cb) {
                                            //console.log(value, _value)
                                            if(_value.replace && _value.replace===true){
                                                value = S(value_data).replaceAll(' ', '').s;
                                            }
                                            //console.log(S(value).contains(_value.search), _value.search,value.search(_value.search), value);
                                            if(S(value).contains(_value.search)) {
                                                var st = value.search(_value.search) + _value.search.length;
                                                if(value.search(_value.search)>=0){
                                                    var tem = value.substring(st);
                                                    var en = 0;
                                                    var alen = 0;
                                                    if (_value.cutAt != undefined) {
                                                        en = tem.search(_value.cutAt);
                                                        if(_value.alcutAt != undefined){
                                                            alen = tem.search(_value.cutAt);
                                                        }
                                                        if(alen<en && alen>0){
                                                            en = alen;
                                                        }else if(en<=0 && alen>0){
                                                            en = alen
                                                        }
                                                    } else {
                                                        _value.value = tem;
                                                    }
                                                   // console.log(st,en,tem, tem.substring(0, en))
                                                    if (_value.value === "" && st > 0 && en > 0) {
                                                        //console.log(st, en, tem, tem.substring(0, en))
                                                        var temp2save = tem.substring(0, en);
                                                        if(_value.alcutAt != undefined && S(temp2save).contains(_value.alcutAt)){
                                                            _value.value = temp2save.substring(0, temp2save.search(_value.alcutAt));
                                                            _cb();
                                                        }else{
                                                            _value.value = temp2save;
                                                            _cb();
                                                        }
                                                    }else if (_value.value === "" && st > 0 && en < 0){
                                                        _value.value = tem;
                                                        _cb();
                                                    }  else {
                                                        _cb();
                                                    } 
                                                }else{
                                                    _cb();
                                                }
                                                
                                            }else{
                                                _cb();
                                            }
                                        },function done() {
                                            sb();
                                        })
                                    }else{
                                        sb();
                                    }
                                }else{
                                    sb();
                                }
                                
                            },function sbClose() {
                                cb();
                            })
                        }, function close() {
                            next(null, {data:data, array:pdfarray, pdfText:pagesText});
                        });
                        //console.log(pagesText);
                    });
        
                }, function (reason) {
                    // PDF loading error
                    console.error(reason);
                    next(reason, null);
                });
        },
        /**
         * create file object of key and value from pdf data
         */
        function createObject(result, next){
            var new_data = {};
            async.forEachOf(result.data, function(value, index, value_cb){
                if(Array.isArray(value.value) && value.value.length>1){
                    new_data[value.name] = {};
                    async.forEachOf(value.value, function(_value, _index, _cb){
                        new_data[value.name][_value.name] = _value.value;
                        _cb();
                    },function done(){
                        value_cb();
                    })
                }else{
                    new_data[value.name] = value.value;
                    value_cb();
                }
            },function done(){
                result['final_data'] = new_data;
                next(null, result);
            })
        },

        /**
         * generate xml from pdf
         */
        // function getXML(result, next){
        //     var xfdf = require('xfdf')
            
        //    var builder =   new xfdf({
        //     pdf: filePath,
        //     translateBools: true,
        //     format: {
        //       pretty: false,
        //     }
        //   });
        //     result['myxml'] = builder.;
        //     next(null ,result);
        // },
        /**
         * get parts from pdf
         * **/
        function getParts( result, next){
            const tabula = require('tabula-js');
            const t = tabula(filePath,{pages: "all"});
            t.extractCsv(function(err, data){
                //console.log(_.findIndex(data,"PARTS,"), Array.isArray(data));
                var tableindex = 0;
                var table = [];
                var tableend = 0;
        
                async.forEachOf(data, function (value, index, cb) {
                    if(S(value).contains('Repair Information')){
                        tableindex = index+3;
                    }else if(S(value).contains('I:')){
                        tableend = index;
                    }
                    //console.log(value, index);
                    cb();
                })
                for(var i=tableindex;i<tableend;i++){
                    table.push(data[i]);
                }
        
                //console.log(table);
                var parts = [];
                async.forEachOf(table, function (value, index, cb) {
                    value = S(value).replaceAll('"','').s
                    value = S(value).replaceAll('\"','').s
                    if(index!==0) {
                        var gno = value.substring(0,value.search(' '));
                
                        var price = '';
                        var desc = '';
                        var oe_no = '';
                        var array = [];
                        var temp = value.substring(value.search(' ')).replace(/^\s*|\s*$/g, '');
                        //temp  = S(temp).replaceAll('"','').s
                        if(temp.search(',')>=0 && temp.search(',')<temp.lastIndexOf(',')){
                            array = temp.split(',');
                            if(S(array[array.length-2]).contains('R')){
                                var p = array[array.length-2].replace('R','') + array[array.length-1];
                                price = p;
                                oe_no = array[array.length-3];
                                for(var i = 0; i<array.length-3;i++){
                                    desc += array[i] + ' ';
                                }
                            }else{
                                price = array[array.length-1].replace('R','');
                                oe_no = array[array.length-2];
                                if(oe_no==='' || oe_no ===' '){
                                    var oetemp = array[array.length-3].replace(/^\s*|\s*$/g, '');
                                    // var lastChar = oetemp.substr(oetemp.length - 1);;
                                    // while(lastChar===' '){
                                    //     oetemp = oetemp.substring(0, oetemp.length - 1);
                                    // }
                                   var secodelast = nthIndex(oetemp,' ', 2);
                                    desc = array[array.length-3].substring(0, secodelast);
                                    oe_no = array[array.length-3].substring(secodelast);
                                }else {
                                    for (var i = 0; i < array.length - 2; i++) {
                                        desc += array[i] + ' ';
                                    }
                                }
                            }
                            //console.log(array);
                        }else{
                            array  = temp.split(' ');
                            if(S(array[array.length-2]).contains('R')){
                                var p = array[array.length-2].replace('R','') + array[array.length-1];
                                price = p;
                                oe_no = array[array.length-3];
                                for(var i = 0; i<array.length-3;i++){
                                    desc += array[i] + ' ';
                                }
                            }else{
                                price = array[array.length-1].replace('R','');
                                oe_no = array[array.length-2];
                                if(oe_no==='' || oe_no ===' '){
                                    var oetemp = array[array.length-3].replace(/^\s*|\s*$/g, '');
                                    // var lastChar = oetemp.substr(oetemp.length - 1);;
                                    // while(lastChar===' '){
                                    //     oetemp = oetemp.substring(0, oetemp.length - 1);
                                    // }
                                   var secodelast = nthIndex(oetemp,' ', 2);
                                   desc = array[array.length-3].substring(0, secodelast);
                                   oe_no = array[array.length-3].substring(secodelast);
                                }else {
                                    for(var i = 0; i<array.length-2;i++){
                                        desc += array[i] + ' ';
                                    }
                                }
        
                            }
                            //console.log(array);
                        }
                        if(S(price).contains('undefined')){
                            price = price.replace('undefined','');
                        }
                        parts.push({'GNO':gno, "price":price, "oe_no":oe_no, "desc":desc});
                        cb();
                    }else{
                        cb();
                    }
                },
                    function done() {
                        result['final_data']['parts'] = parts;
                        result['final_data']['images'] = Images;
                        result['final_data']['pdf'] = PDF;
                        result['final_data']['table'] = table;
                        //result['final_data']['myxml'] = result['myxml'];
                        fs.unlinkSync(filePath);
                        //console.log(result['final_data']);
                        next(null, result['final_data']);
                    })
            });
        }
    ],
    function done(error, result){
        //console.log(error, result);
        var Pdf = require('./pdfjson');
        var pd = new Pdf();
        pd.pdt2json = result;
        pd.save(function (errors, pddata) {
            data = {};
            if (errors) {
                console.log('Logs not saved', errors);
            } else {
                console.log('logs saved')
            }
        })
        callback(GmailAuth, GmailMessageId);
    })
}

module.exports = new PdfService();