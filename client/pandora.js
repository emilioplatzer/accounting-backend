"use strict";

var html=jsToHtml.html;

function Pandora(){
}

var pandora = new Pandora();

function resizeNow(){
    lateral.style.height = window.innerHeight - superior.clientHeight -2 + 'px';
    central.style.height = window.innerHeight - superior.clientHeight -2 + 'px';
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

var pantallas = {
    menu: function(){
        central.innerHTML="";
        central.appendChild(html.div([
            html.h1("menú principal"),
            lineaMenu('mod', '#agregarAsiento', 'crear nuevo asiento'),
            lineaMenu('lis', '#reporte', 'Saldos del libro mayor'),
            lineaMenu('mod', '#agregarAsiento', 'actores'),
            lineaMenu('lis', '#reporte', 'Saldos de cuentas corrientes'),
            lineaMenu('mod', '#reporte', 'Plan de producción'),
            lineaMenu('lis', '#reporte', 'Inventario'),
            lineaMenu('red', './login', 'Salir (logout)'),
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