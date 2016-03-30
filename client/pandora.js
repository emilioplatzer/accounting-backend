"use strict";

var html=jsToHtml.html;

function Pandora(){
}

var pandora = new Pandora();

function resizeNow(){
    // lateral.style.height = window.innerHeight - superior.clientHeight -2 + 'px';
    // central.style.height = window.innerHeight - superior.clientHeight -2 + 'px';
}

function mostrar(mensaje){
    statusArea.textContent+='\n'+mensaje;
}

function lineaMenu(tipo, href, leyenda){
    return html.div({"class": "linea-menu"},[
        html.a({href: href},[
            html.img({"class": "menu-icon", src: "menu-ico-"+tipo+".png"}), 
            html.span(leyenda)
        ])
    ]);
}

function desplegarRegistro(almacen, metadatos, formulario, titulo, matriz){
    var filaTitulos=[];
    var filaCeldas=[];
    var filasMatrices=[];
    var valores={};
    if(matriz || almacen[formulario] instanceof Array){
        almacen[formulario]=almacen[formulario]||[];
        almacen[formulario].push(valores);
    }else{
        almacen[formulario]=valores;
    }
    var puedoAgregarFila=!!matriz;
    var camposDeLaFila={};
    metadatos.estructura.formularios[formulario].celdas.forEach(function(celda){
        if(celda.tipo == 'pregunta'){
            filaTitulos.push(html.td({"class": "encabezado", title: celda.texto||''}, celda.pregunta));
            var elementosExtra=[];
            if(celda.variable=='fecha' && formulario=='encabezado'){
                var now=new Date();
                valores.fecha = new Date(now.getFullYear(),now.getMonth(),now.getDate())
            }
            if(celda.typeInfo.references){
                var elemento=html.input({type:"text"}).create();
                elemento.setAttribute('list', "list-"+celda.typeInfo.references);
                elementosExtra.push(html.datalist({id:"list-"+celda.typeInfo.references},
                    metadatos.listas[celda.typeInfo.references].map(function(registro){
                        return html.option({value:registro[celda.variable]});
                    })
                ));
            }else{
                var elemento=Tedede.bestCtrl(celda.typeInfo).create();
            }
            Tedede.adaptElement(elemento, celda.typeInfo);
            if(celda.variable=='asiento' && formulario=='encabezado'){
                elemento.autofocus=true;
            }
            elemento.setTypedValue(valores[celda.variable]||null);
            if(celda.typeInfo.clase){
                elemento.classList.add(celda.typeInfo.clase);
            }else{
                elemento.classList.add('edit-'+celda.variable);
            }
            elemento.addEventListener('update', function(){
                valores[celda.variable] = elemento.getTypedValue();
                if(puedoAgregarFila){
                    puedoAgregarFila=false;
                    var tabla=elemento;
                    while(tabla && tabla.tagName!='TABLE'){ tabla = tabla.parentNode; };
                    if(tabla){
                        var row = tabla.insertRow(-1);
                        row.className="fila-editable";
                        desplegarRegistro(almacen, metadatos, formulario, null, true).forEach(function(cell){
                            row.appendChild(cell.create());
                        });
                    }
                    elemento.parentNode.parentNode
                }
            });
            if(formulario=='renglones' && celda.variable!='cuenta'){
                elemento.disabled=!!celda.filtroc;
            }
            if(formulario=='renglones' && celda.variable=='cuenta'){
                elemento.addEventListener('focusout',function(){
                    var valor = elemento.getTypedValue();
                    if(valor){
                        if(valor.toUpperCase()!==valor){
                            valor = valor.toUpperCase();
                            elemento.setTypedValue(valor);
                        }
                        var registro_cuenta = metadatos.tablas.cuentas[valor];
                        for(var nombreCampo in camposDeLaFila){
                            var elementoCampo = camposDeLaFila[nombreCampo];
                            if(registro_cuenta){
                                elementoCampo.disabled=!!elementoCampo.filtroc && !registro_cuenta[elementoCampo.filtroc];
                            }else if(nombre_campo!='cuenta'){
                                elementoCampo.disabled=true;
                            }
                        }
                    }
                });
            }
            elemento.filtroc=celda.filtroc;
            camposDeLaFila[celda.variable] = elemento;
            filaCeldas.push(html.td([elemento].concat(elementosExtra)));
        }
        if(celda.tipo == 'matriz'){
            filasMatrices.push(html.tr([html.td({"class": "matriz", colspan: 999}, [
                desplegarRegistro(almacen, metadatos, celda.matriz, celda.matriz, true)
            ])]));
        }
    });
    if(!titulo){
        return filaCeldas;
    }else{
        var filas=[
            html.caption({"class": "caption-editable"}, titulo),
            html.tr({"class": "fila-encabezados"}, filaTitulos),
            html.tr({"class": "fila-editable"}, filaCeldas)
        ].concat(filasMatrices);
        return html.table(filas);
    }
}

function desplegar(metadatos, formulario, titulo){
    central.innerHTML="";
    var almacen={};
    central.appendChild(desplegarRegistro(almacen, metadatos, formulario, titulo).create());
    var botonGrabar = html.button("grabar").create();
    var botonReintentar = html.button("reintentar").create();
    botonGrabar.addEventListener('click', function(){
        botonReintentar.style.visibility = 'visible';
        botonReintentar.textContent = 'grabando...';
        botonReintentar.disabled = true;
        setTimeout(function(){ 
            botonReintentar.disabled = false; 
            botonReintentar.textContent = "reintentar"
        },2000);
        botonGrabar.disabled = true;
        AjaxBestPromise.post({
            url:'./agregarAsiento',
            data:{
                asiento:JSON.stringify(almacen)
            }
        }).then(function(mensaje){
            result.textContent = "ok: "+mensaje;
            botonReintentar.style.display = 'none';
            botonGrabar.style.display = 'none';
        }).catch(function(err){
            result.textContent = err;
        });
    });
    central.appendChild(botonGrabar);
    botonReintentar.style.visibility = 'hidden';
    botonReintentar.addEventListener('click', function(){
        botonGrabar.disabled = false;
        botonReintentar.style.visibility = 'hidden';
    });
    central.appendChild(botonReintentar);
    central.appendChild(html.div([
        html.pre({id:"result"}, "cargando...")
    ]).create());
}

function desplegarListado(reporte,detalle){
    var celdasTitulo=[];
    var primeraLinea=true;
    var filas=[];
    var acumulado=0;
    reporte.forEach(function(renglon){
        var celdasListado=[];
        for(var campo in renglon){
            if(primeraLinea){
                celdasTitulo.push(html.th(campo));
            }
            var valor=""+(renglon[campo]||'');
            if(campo=='fecha' || campo=='vencimiento'){
                valor=valor.split('T')[0];
                valor=valor.split('-').reverse().join('/');
            }
            if(campo=='acumulado'){
                acumulado-=-valor;
                valor=acumulado;
            }
            celdasListado.push(html.td({"class": "campo-"+campo}, valor));
        }
        if(primeraLinea){
            filas.push(html.tr(celdasTitulo));
            primeraLinea=false;
        }
        delete renglon.saldo;
        if(detalle){
            celdasListado.push(html.td([html.a({href:'#'+detalle+':'+JSON.stringify(renglon), title: "ver detalle"}, "\u21d2")])); // ⇒
        }
        filas.push(html.tr(celdasListado));
    });
    central.innerHTML="";
    central.appendChild(html.table({"class": "listado"}, filas).create());
}

function traerListado(url, adaptarParametros, detalle){
    return function(parametros){
        central.innerHTML="";
        central.appendChild(html.div([
            html.pre({id:"result"}, "cargando..."),
        ]).create());
        AjaxBestPromise.post({
            url:url,
            data:{parametros:adaptarParametros(parametros)}
        }).then(JSON.parse).then(function(reporte){
            result.textContent='mostrando...';
            desplegarListado(reporte, detalle);
        },function(err){
            result.textContent=err;
        });
    }
}

var metadatos=null;

function leerMetadatos(){
    var trayendo={};
    if(metadatos){
        return Promise.resolve(metadatos);
    }
    return Promise.resolve().then(function(){
        return AjaxBestPromise.get({
            url:'structure/asiento',
            data:{}
        });
    }).then(JSON.parse).then(function(estructura){
        trayendo.estructura=estructura;
        return AjaxBestPromise.post({
            url:'obtenerCuentas',
            data:{}
        });
    }).then(JSON.parse).then(function(cuentas){
        trayendo.listas={
            cuentas: cuentas
        };
        trayendo.tablas={
            cuentas: {}
        };
        cuentas.forEach(function(registro_cuenta){
            trayendo.tablas.cuentas[registro_cuenta.cuenta]=registro_cuenta;
        });
        metadatos = trayendo;
        return metadatos;
    })
}

var pantallas = {
    menu: {desplegar: function(){
        central.innerHTML="";
        central.appendChild(html.div([
            html.h1("menú principal"),
            lineaMenu('mod', '#agregarAsiento', 'Crear nuevo asiento'),
            lineaMenu('lis', '#reporte:cuenta', 'Saldos del libro mayor'),
            lineaMenu('mod', '#agregarAsiento', 'actores'),
            lineaMenu('lis', '#reporte:cuenta,actor', 'Saldos de cuentas corrientes'),
            lineaMenu('mod', '#reporte:cuenta,concepto', 'Plan de producción'),
            lineaMenu('lis', '#reporte:cuenta,concepto', 'Inventario'),
            lineaMenu('aud', '#ultimosAsientos', 'Últimos asientos cargados'),
            lineaMenu('red', './login', 'Salir (logout)'),
        ]).create());
    }},
    agregarAsiento: {desplegar: function(){
        central.innerHTML="";
        central.appendChild(html.div([
            html.pre({id:"result"}, "cargando...")
        ]).create());
        leerMetadatos().then(function(metadatos){
            desplegar(metadatos, 'encabezado', "Crear nuevo asiento");
        },function(err){
            result.textContent=err;
        });
    }},
    reporte: {desplegar: traerListado('obtenerSaldos', function(p){ return JSON.stringify(p.split(',')) }, 'cuenta')},
    cuenta:  {desplegar: traerListado('obtenerCuenta', function(x){ return x})},
    ultimosAsientos: {desplegar: traerListado('ultimosAsientos', function(p){ return JSON.stringify((p||'').split(',')) }) }
}

function hashchangeListener(when){
    return function(){
        if(!window.location.hash){
            window.location.hash='#menu';
        }else{
            var dospuntos=window.location.hash.indexOf(':');
            if(dospuntos>0){
                var pantalla=window.location.hash.substr(1,dospuntos-1);
                var parametros=window.location.hash.substr(dospuntos+1);
            }else{
                var pantalla=window.location.hash.substr(1);
                var parametros=null;
            }
            pantallas[pantalla].desplegar(parametros);
        }
    }
}

window.addEventListener('load', function(){
    hashchangeListener('load')();
    resizeNow();
});

window.addEventListener('hashchange', hashchangeListener('hashchange'));

window.addEventListener('resize', resizeNow);

window.addEventListener('error', function(e){
  mostrar(e.error);
});