const header = document.querySelector('.site-header');
const menu = document.querySelector('.site-header nav');
const menuToggle = document.querySelector('.nav-toggle');
const menuClose = document.querySelector('.nav-close');
const backdrop = document.querySelector('.nav-backdrop');
const exploreToggle = document.querySelector('.explore-toggle');
const exploreMenu = document.querySelector('.explore-menu');
function setExplore(open){exploreMenu?.classList.toggle('open',open);exploreToggle?.classList.toggle('open',open);exploreToggle?.setAttribute('aria-expanded',String(open));exploreMenu?.setAttribute('aria-hidden',String(!open));backdrop?.classList.toggle('open',open||menu?.classList.contains('open'))}
function setMobileMenu(open){menu?.classList.toggle('open',open);backdrop?.classList.toggle('open',open);document.body.classList.toggle('nav-open',open);menuToggle?.setAttribute('aria-expanded',String(open));if(!open)setExplore(false)}
menuToggle?.addEventListener('click',event=>{event.stopImmediatePropagation();setMobileMenu(!menu.classList.contains('open'))},true);
menuClose?.addEventListener('click',()=>setMobileMenu(false));
backdrop?.addEventListener('click',()=>{setMobileMenu(false);setExplore(false)});
exploreToggle?.addEventListener('click',event=>{event.stopPropagation();setExplore(!exploreMenu.classList.contains('open'))});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){setMobileMenu(false);setExplore(false)}});
document.addEventListener('click',event=>{if(!header?.contains(event.target))setExplore(false)});
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMobileMenu(false)));
