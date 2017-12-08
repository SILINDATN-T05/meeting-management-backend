
var Session =   require('../../../model/Session-model');

module.exports  =   function (req, res) {
    res.send({code: '00', message: 'success'});
    if(req.body && req.body.session && req.body.session._id){
        Session.findOne({_id: req.body.session._id}, function(err, doc){
            if(!err && doc){
                doc.remove();
            }
        });
    }
}
