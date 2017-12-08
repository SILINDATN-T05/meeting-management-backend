var mongoose        =   require('mongoose');
var S               =   require('string');


function Code(key, options) {
    mongoose.SchemaType.call(this, key, options, 'Code');
}
Code.prototype = Object.create(mongoose.SchemaType.prototype);
Code.prototype.cast = function(val) {
    if(val && val !=null && val!= undefined){
        if( typeof val === 'object' && val.code !=undefined && typeof val.code ==='string'){
            return(val.code);
        }else{
            if(typeof val === 'string'){
                val =   S(val).replaceAll(' ', '_').s;
                return(val.toUpperCase());
            }else{
                throw new Error('#code.value.invalid');
            }
        }
    }
    throw new Error('#code.value.invalid');
}
mongoose.Schema.Types.Code       =   Code;
module.exports                   =   Code;