/* Nocturne — Share this issue, and the theme switch. Written by qa/nocturne.js; never edited by hand. */
(function(){var root=document.documentElement,IDLE="Share this issue",timer=0;
function markTheme(){var on=root.getAttribute("data-theme")==="darker";[].forEach.call(document.querySelectorAll("[data-theme-switch]"),function(b){b.setAttribute("aria-checked",on?"true":"false");});}
function setTheme(v){if(v==="darker")root.setAttribute("data-theme","darker");else root.removeAttribute("data-theme");try{localStorage.setItem("nocturne-theme",v);}catch(err){}markTheme();}
function label(button,text){var word=button.querySelector(".sl");clearTimeout(timer);if(word)word.textContent=text;button.classList.toggle("failed",text!==IDLE);if(text!==IDLE)timer=setTimeout(function(){label(button,IDLE);},2400);}
function copied(button,out){label(button,IDLE);if(out){out.classList.remove("fail");out.textContent="Link copied";}}
function failed(button,out,url){label(button,"Copy failed");if(out){out.classList.add("fail");out.textContent=url;}}
function copy(button,out,url){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){copied(button,out);},function(){failed(button,out,url);});return;}failed(button,out,url);}
function shout(button){var row=button.closest(".more"),out=row&&row.querySelector(".shout");return out||null;}
function share(button){var url=button.getAttribute("data-url"),title=button.getAttribute("data-title"),out=shout(button);
if(navigator.share){navigator.share({title:title,url:url}).catch(function(err){if(!err||err.name!=="AbortError")copy(button,out,url);});return;}copy(button,out,url);}
function showSheetless(){if(navigator.share)return;[].forEach.call(document.querySelectorAll(".btn.share"),function(b){var row=b.closest(".more");if(!row)return;[].forEach.call(row.querySelectorAll("[hidden]"),function(el){el.removeAttribute("hidden");});});}
markTheme();showSheetless();
document.addEventListener("click",function(e){var themeButton=e.target.closest("[data-theme-switch]");if(themeButton){setTheme(root.getAttribute("data-theme")==="darker"?"dark":"darker");return;}var copyButton=e.target.closest("[data-copy]");if(copyButton){copy(copyButton,shout(copyButton),copyButton.getAttribute("data-url"));return;}var shareButton=e.target.closest("[data-share]");if(shareButton)share(shareButton);});})();
