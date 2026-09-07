const header = document.querySelector('.site-header');
const menu = header?.querySelector('nav');
const openButton = header?.querySelector('.nav-toggle');
const closeButton = header?.querySelector('.nav-close');
const backdrop = header?.querySelector('.nav-backdrop');
const connectButton = header?.querySelector('.explore-toggle');
const connectPanel = header?.querySelector('.explore-menu');
const mobileQuery = window.matchMedia('(max-width: 900px)');
function setConnect(open){connectPanel?.classList.toggle('open',open);connectButton?.classList.toggle('open',open);connectButton?.setAttribute('aria-expanded',String(open));connectPanel?.setAttribute('aria-hidden',String(!open));if(!mobileQuery.matches)backdrop?.classList.toggle('open',open)}
function setMenu(open){if(!mobileQuery.matches)return;menu?.classList.toggle('open',open);backdrop?.classList.toggle('open',open);document.body.classList.toggle('nav-open',open);openButton?.setAttribute('aria-expanded',String(open));if(!open)setConnect(false)}
openButton?.addEventListener('click',()=>setMenu(true));
closeButton?.addEventListener('click',()=>setMenu(false));
connectButton?.addEventListener('click',event=>{event.stopPropagation();setConnect(!connectPanel.classList.contains('open'))});
backdrop?.addEventListener('click',()=>{setConnect(false);setMenu(false)});
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{setConnect(false);setMenu(false)}));
document.addEventListener('click',event=>{if(!header?.contains(event.target))setConnect(false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){setConnect(false);setMenu(false);openButton?.focus()}});
mobileQuery.addEventListener('change',()=>{menu?.classList.remove('open');backdrop?.classList.remove('open');document.body.classList.remove('nav-open');setConnect(false)});
