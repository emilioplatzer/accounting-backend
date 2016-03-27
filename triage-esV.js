"use strict";

if(!process.env.npm_package_entrypoint){
    throw new Error('Must fill npm_package_entrypoint');
}

if(process.version.match(/v0/)){
    require("es6-shim");
    var dir = 'server-trans';
}else{
    var dir = 'server';
}

module.exports = require('./'+dir+'/accounting-server.js');
