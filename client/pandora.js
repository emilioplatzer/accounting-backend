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

function desplegarRegistro(estructura, formulario, titulo, matriz){
    var filaTitulos=[];
    var filaCeldas=[];
    var filasMatrices=[];
    var valores={};
    var puedoAgregarFila=!!matriz;
    estructura.formularios[formulario].celdas.forEach(function(celda){
        if(celda.tipo == 'pregunta'){
            filaTitulos.push(html.td({"class": "encabezado", title: celda.texto||''}, celda.pregunta));
            var elemento=Tedede.bestCtrl(celda.typeInfo).create();
            Tedede.adaptElement(elemento, celda.typeInfo);
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
                        desplegarRegistro(estructura, formulario, null, true).forEach(function(cell){
                            row.appendChild(cell.create());
                        });
                    }
                    elemento.parentNode.parentNode
                }
            });
            filaCeldas.push(html.td([elemento]));
        }
        if(celda.tipo == 'matriz'){
            filasMatrices.push(html.tr([html.td({"class": "matriz", colspan: 999}, [
                desplegarRegistro(estructura, celda.matriz, celda.matriz, true)
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

function desplegar(estructura, formulario, titulo){
    central.innerHTML="";
    var x=desplegarRegistro(estructura, formulario, titulo).create();
    central.appendChild(x);
    //central.appendChild(desplegarRegistro(estructura, formulario, titulo).create());
}

var pantallas = {
    menu: function(){
        central.innerHTML="";
        central.appendChild(html.div([
            html.h1("menú principal"),
            lineaMenu('mod', '#agregarAsiento', 'Crear nuevo asiento'),
            lineaMenu('lis', '#reporte', 'Saldos del libro mayor'),
            lineaMenu('mod', '#agregarAsiento', 'actores'),
            lineaMenu('lis', '#reporte', 'Saldos de cuentas corrientes'),
            lineaMenu('mod', '#reporte', 'Plan de producción'),
            lineaMenu('lis', '#reporte', 'Inventario'),
            lineaMenu('red', './login', 'Salir (logout)'),
        ]).create());
    },
    agregarAsiento: function(){
        central.innerHTML="";
        central.appendChild(html.div([
            html.pre({id:"result"}, "cargando...")
        ]).create());
        AjaxBestPromise.get({
            url:'structure/asiento',
            data:{}
        }).then(JSON.parse).then(function(estructura){
            result.innerText='mostrando...';
            desplegar(estructura, 'encabezado', "Crear nuevo asiento");
        },function(err){
            result.innerText=err;
        });
    },
    reporte: function(){
        central.innerHTML="";
        central.appendChild(html.div([
            html.pre("cargando...")
        ]).create());
    }
}

function hashchangeListener(when){
    return function(){
        if(!window.location.hash){
            window.location.hash='#menu';
        }else{
            var pantalla=window.location.hash.split(':')[0];
            pantallas[pantalla.substr(1)]();
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