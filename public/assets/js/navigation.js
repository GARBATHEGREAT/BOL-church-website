(function(){
  const header=document.querySelector('.site-header');
  if(!header)return;
  const menu=header.querySelector('nav');
  const openButton=header.querySelector('.nav-toggle');
  const closeButton=header.querySelector('.nav-close');
  const backdrop=header.querySelector('.nav-backdrop');
  const connectButton=header.querySelector('.explore-toggle');
  const connectPanel=header.querySelector('.explore-menu');
  function isMobile(){return window.innerWidth<=900}
  function closeConnect(){connectPanel.classList.remove('open');connectButton.classList.remove('open');connectButton.setAttribute('aria-expanded','false');connectPanel.setAttribute('aria-hidden','true')}
  function openMenu(){if(!isMobile())return;menu.classList.add('open');backdrop.classList.add('open');document.body.classList.add('nav-open');openButton.setAttribute('aria-expanded','true')}
  function closeMenu(){menu.classList.remove('open');backdrop.classList.remove('open');document.body.classList.remove('nav-open');openButton.setAttribute('aria-expanded','false');closeConnect()}
  openButton.onclick=function(event){event.preventDefault();event.stopPropagation();menu.classList.contains('open')?closeMenu():openMenu()};
  closeButton.onclick=function(event){event.preventDefault();closeMenu()};
  backdrop.onclick=closeMenu;
  connectButton.onclick=function(event){event.preventDefault();event.stopPropagation();const opening=!connectPanel.classList.contains('open');connectPanel.classList.toggle('open',opening);connectButton.classList.toggle('open',opening);connectButton.setAttribute('aria-expanded',String(opening));connectPanel.setAttribute('aria-hidden',String(!opening));if(!isMobile())backdrop.classList.toggle('open',opening)};
  menu.querySelectorAll('a').forEach(function(link){link.addEventListener('click',closeMenu)});
  document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMenu()});
  window.addEventListener('resize',function(){if(!isMobile())closeMenu()});
})();
