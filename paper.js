/* Nocturne — the Share button and the theme switch. Written by qa/nocturne.js; never edited by hand. */
(function(){var root=document.documentElement,IDLE="Share",timer=0;
function markTheme(){var now=root.getAttribute("data-theme")==="darker"?"darker":"dark";[].forEach.call(document.querySelectorAll("[data-theme-set]"),function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-theme-set")===now));});}
function setTheme(v){if(v==="darker")root.setAttribute("data-theme","darker");else root.removeAttribute("data-theme");try{localStorage.setItem("nocturne-theme",v);}catch(err){}markTheme();}
function label(button,text){var word=button.querySelector(".sl");clearTimeout(timer);if(word)word.textContent=text;button.classList.toggle("failed",text!==IDLE);if(text!==IDLE)timer=setTimeout(function(){label(button,IDLE);},2400);}
function copied(button,out){label(button,IDLE);if(out){out.classList.remove("fail");out.textContent="Link copied";}}
function failed(button,out,url){label(button,"Copy failed");if(out){out.classList.add("fail");out.textContent=url;}}
function copy(button,out,url){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){copied(button,out);},function(){failed(button,out,url);});return;}failed(button,out,url);}
function share(button){var url=button.getAttribute("data-url"),title=button.getAttribute("data-title"),out=button.nextElementSibling;if(!out||!out.classList.contains("shout"))out=null;
if(navigator.share){navigator.share({title:title,url:url}).catch(function(err){if(!err||err.name!=="AbortError")copy(button,out,url);});return;}copy(button,out,url);}
markTheme();
document.addEventListener("click",function(e){var themeButton=e.target.closest("[data-theme-set]");if(themeButton){setTheme(themeButton.getAttribute("data-theme-set")==="darker"?"darker":"dark");return;}var shareButton=e.target.closest("[data-share]");if(shareButton)share(shareButton);});})();
