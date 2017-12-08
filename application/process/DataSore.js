
var data    =   {};

function DataStore() {

}
DataStore.prototype.push    =   function (name, server_ref, process, callback) {
    if(!data[name]){
        data[name]  =   [];
    }
    data[name].push({server_ref:server_ref, process:process});
    callback();
}
DataStore.prototype.shift    =   function (name, callback) {
    //console.log(data);
    if(data && data[name]){
        var list    =   data[name];
        var detail  =   list.pop();
        if(detail && detail.server_ref && detail.process){
            data[name]  =   list;
            callback(null, detail.server_ref, detail.process, list.length);
        }else{
            callback('#store.data.invalid');
        }
    }else{
        callback('#store.type.invalid');
    }
}

DataStore.prototype.checkData    =   function (process_name,callback) {
    callback(data[process_name]);
}

module.exports  =   new DataStore();
