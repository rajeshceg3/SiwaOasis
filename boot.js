const status=document.querySelector('#loadStatus');
function recovery(message){status.replaceChildren();const box=document.createElement('div'),p=document.createElement('p'),b=document.createElement('button');p.textContent=message;b.textContent='Try loading again';b.onclick=()=>location.reload();box.append(p,b);status.append(box);status.classList.add('show');b.focus();}
const timer=setTimeout(()=>recovery('The evening is taking longer to load. You can wait or try again.'),20000);
try{await import('./game.js');clearTimeout(timer);status.classList.remove('show');}catch{clearTimeout(timer);recovery('This walk could not open. Check your connection and try again. A browser with WebGL is needed.');}
