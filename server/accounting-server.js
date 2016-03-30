"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

// APP

if(process.argv[2]=='--dir'){
    process.chdir(process.argv[3]);
    console.log('cwd',process.cwd());
}

var extensionServeStatic = require('extension-serve-static');
var _ = require('lodash');

// var Promises = require('best-promise');

var backend = require("backend-plus");
var MiniTools = require("mini-tools");

var Promises = require("promise-plus");

var AccountingMachine = require('accounting-machine');


class AppAccounting extends backend.AppBackend{
    configList(){
        return super.configList().concat([
            'def-config.yaml',
            'local-config.yaml'
        ]);
    }
    obtenerEstructura(){
        var be = this;
        if(this.estructura){
            return Promises.resolve(this.estructura);
        }else{
            this.registroVacio={};
            return this.readStructure('node_modules/accounting-machine/estructuras/estructura-asiento.yaml').then(function(estructura){
                be.estructura = estructura;
                return estructura;
            });
        }
    }
    addLoggedServices(){
        var be = this;
        be.app.get('/',MiniTools.serveJade(this.rootPath+'client/pandora'));
        super.addLoggedServices();
        var am = new (AccountingMachine.Machine)(be.config);
        be.app.use('/',extensionServeStatic(this.rootPath+'client',{staticExtensions:['jpg','png','html','gif']}));
        be.app.get('/structure/asiento', function(req,res){
            be.registroVacio = {};
            be.obtenerEstructura().then(function(estructura){
                MiniTools.serveJson(estructura)(req,res);
            }).catch(MiniTools.serveErr(req,res));
        });
        be.app.post('/agregarAsiento', function(req,res){
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
            am.agregarAsiento(asiento).then(function(result){
                res.end('¡Grabado!');
            }).catch(MiniTools.serveErr(req,res));
        });
        be.app.post('/obtenerSaldos', function(req,res){
            var parametros = JSON.parse(req.body.parametros);
            be.obtenerEstructura().then(function(){
                parametros.forEach(function(parametro){
                    if(be.estructura.formularios.renglones.celdas.filter(function(celda){
                        return celda.tipo=='pregunta' && celda.variable==parametro;
                    }).length==0){
                        console.log('parametro invalido para el corte de obtenerSaldos',parametro);
                        throw new Error('parametro invalido para el corte de obtenerSaldos');
                    }
                });
                return am.obtenerSaldos(parametros)
            }).then(function(lista){
                MiniTools.serveJson(lista)(req,res);
            }).catch(MiniTools.serveErr(req,res));
        });
        be.app.post('/obtenerCuenta', function(req,res){
            var parametros = JSON.parse(req.body.parametros);
            be.obtenerEstructura().then(function(){
                _.forEach(parametros, function(valor, parametro){
                    if(be.estructura.formularios.renglones.celdas.filter(function(celda){
                        return celda.tipo=='pregunta' && celda.variable==parametro;
                    }).length>0){
                    }
                });
                return am.obtenerCuenta(parametros);
            }).then(function(lista){
                MiniTools.serveJson(lista)(req,res);
            }).catch(MiniTools.serveErr(req,res));
        });
        be.app.post('/obtenerCuentas', function(req,res){
            Promises.start(function(){
                return am.obtenerCuentas();
            }).then(function(lista){
                MiniTools.serveJson(lista)(req,res);
            }).catch(MiniTools.serveErr(req,res));
        });
        be.app.post('/ultimosAsientos', function(req,res){
            Promises.start(function(){
                return am.ultimosAsientos();
            }).then(function(lista){
                MiniTools.serveJson(lista)(req,res);
            }).catch(MiniTools.serveErr(req,res));
        });
    }
}

process.on('uncaughtException', function(err){
  console.log("Caught exception:",err);
  process.exit(1);
});

process.on('unhandledRejection', function(err){
  console.log("unhandledRejection:",err);
});

new AppAccounting().start();
