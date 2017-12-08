'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var PDFSchema = new Schema({
    Created_date: {
        type: Date,
        default: Date.now
    },
    pdt2json:{type:Object,default:null},
    pdt2file:[],
    pdt2file2:{type:Object,default:null},
    pdf2excell2json:{type:String,default:null},
    pdf2text:{type:String,default:null},
    pdftotest:{type:String,default:null},
    pdf2extract:{type:String,default:null},
    pdftext:{type:String,default:null}
});

module.exports = mongoose.model('pdf', PDFSchema);