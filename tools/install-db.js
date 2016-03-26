"use strict";

var AccountingMachine = require('accounting-machine');
var MiniTools = require('mini-tools');

console.log('INSTALL DB TOOL');

return MiniTools.readConfig([
    'def-config.yaml',
    'local-config.yaml'
]).then(function(config){
    if(!config.testing){
        console.log('not in testing mode');
    }
    return AccountingMachine.installDbSchema(config, "./install/local-install-data.sql");
}).then(function(){
    console.log('Listo');
}).catch(function(err){
    console.log(err);
    console.log(err.stack);
});

