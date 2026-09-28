/* Nocturne — follows the app's theme. Written by qa/nocturne.js; never edited by hand. */
try{var p=localStorage.getItem("nocturne-theme"),n=JSON.parse(localStorage.getItem("batwatch-settings")||"null")||JSON.parse(localStorage.getItem("batwatch-v3")||"null");var t=p==="dark"||p==="darker"?p:n&&n.theme;if(t==="darker")document.documentElement.setAttribute("data-theme","darker");}catch(e){}
