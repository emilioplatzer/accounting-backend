"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

// APP

var extensionServeStatic = require('extension-serve-static');

// var Promises = require('best-promise');

var backend = require("backend-plus");
var MiniTools = require("mini-tools");

var AccountingMachine = require('accounting-machine');

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
        var am = new (AccountingMachine.Machine)(be.config);
        be.app.use('/',extensionServeStatic(this.rootPath+'client',{staticExtensions:['jpg','png','html','gif']}));
        be.app.get('/',MiniTools.serveJade(this.rootPath+'client/pandora'));
        be.app.get('/structure/asiento', function(req,res){
            be.registroVacio = {};
            be.readStructure('node_modules/accounting-machine/estructuras/estructura-asiento.yaml').then(function(estructura){
                MiniTools.serveJson(estructura)(req,res);
            }).catch(MiniTools.serveErr(req,res));
        });
        be.app.post('/agregarAsiento', function(req,res){
            console.log("***********");
            console.log(req.body);
            var asiento = JSON.parse(req.body.asiento);
            asiento.encabezado.fecha = new Date(asiento.encabezado.fecha||null);
            asiento.renglones = asiento.renglones.map(function(renglon){
                renglon.fecha = new Date(renglon.fecha||asiento.encabezado.fecha||null);
                renglon.vencimiento = new Date(renglon.vencimiento||renglon.fecha||null);
                renglon.subc = renglon.subc||'';
                return renglon;
            }).filter(function(renglon){
                return !!renglon.importe && !isNaN(renglon.importe);
            });
            console.log('por grabar', asiento);
            am.agregarAsiento(asiento).then(function(result){
                res.end('¡Grabado!');
            }).catch(MiniTools.serveErr(req,res));
        });
    }
}

new AppAccounting().start();