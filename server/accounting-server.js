"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

// APP

var extensionServeStatic = require('extension-serve-static');

// var Promises = require('best-promise');

var backend = require("backend-plus");
var MiniTools = require("mini-tools");

class AppAccounting extends backend.AppBackend{
    configList(){
        return super.configList().concat([
            'def-config.yaml',
            'local-config.yaml'
        ]);
    }
    addLoggedServices(){
        super.addLoggedServices();
        var be = this;
        be.app.use('/',extensionServeStatic(this.rootPath+'client',{staticExtensions:['jpg','png','html','gif']}));
        be.app.get('/',MiniTools.serveJade(this.rootPath+'client/pandora'));
    }
    pantallaAgregarAsiento(){
        be.app.get('/structure/asiento', function(req,res){
            this.readStructure('node_modules/accounting-machine/estructuras/estructura-asiento.yaml').then(function(estructura){
                return MiniTools.serveJson(estructura)(req,res);
            });
        });
    }
}

new AppAccounting().start();