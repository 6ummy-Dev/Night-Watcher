/* Nocturne — the Share button and the theme switch. Written by qa/nocturne.js; never edited by hand. */
(function(){var R=document.documentElement;
function mark(){var d=R.getAttribute("data-theme")==="darker"?"darker":"dark";[].forEach.call(document.querySelectorAll("[data-theme-set]"),function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-theme-set")===d));});}
mark();
document.addEventListener("click",function(e){var x=e.target&&e.target.closest?e.target:null;if(!x)return;
var tb=x.closest("[data-theme-set]");if(tb){var v=tb.getAttribute("data-theme-set")==="darker"?"darker":"dark";
if(v==="darker")R.setAttribute("data-theme","darker");else R.removeAttribute("data-theme");try{localStorage.setItem("nocturne-theme",v);}catch(err){}mark();return;}
var b=x.closest("[data-share]");if(!b)return;
var u=b.getAttribute("data-url"),t=b.getAttribute("data-title"),l=b.querySelector(".sl"),o=b.nextElementSibling;
function say(m){if(l){var w=l.textContent;l.textContent=m;setTimeout(function(){l.textContent=w;},2400);}if(o&&o.className==="shout")o.textContent=m;}
if(navigator.share){navigator.share({title:t,url:u}).catch(function(){});return;}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){say("Link copied");},function(){say(u);});return;}
say(u);});})();
