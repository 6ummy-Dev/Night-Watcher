/* Nocturne — sets the theme before first paint: the paper's own choice (nocturne-theme) first, else the app's theme. Written by qa/nocturne.js; never edited by hand. */
(function(){var t=null;try{t=localStorage.getItem("nocturne-theme");}catch(e){}
if(t!=="dark"&&t!=="darker"){t=null;try{var app=JSON.parse(localStorage.getItem("batwatch-settings")||"null")||JSON.parse(localStorage.getItem("batwatch-v3")||"null");t=app&&app.theme;}catch(e){}}
if(t==="darker")document.documentElement.setAttribute("data-theme","darker");})();
