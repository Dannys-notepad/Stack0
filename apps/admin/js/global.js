// Cross marker alignment guide
(function(){
  var frame = document.querySelector('.page-frame');
  var marker = document.getElementById('crossMarker');
  var topBar = document.querySelector('.top-bar');
  if(!frame || !marker) return;
  var raf = null;
  var lastClientX = null, lastClientY = null;

  function project(x, y, w, h){
    var dTop = y, dBottom = h - y, dLeft = x, dRight = w - x;
    var min = Math.min(dTop, dBottom, dLeft, dRight);
    if(min === dTop) return [Math.min(Math.max(x,0),w), 0];
    if(min === dBottom) return [Math.min(Math.max(x,0),w), h];
    if(min === dLeft) return [0, Math.min(Math.max(y,0),h)];
    return [w, Math.min(Math.max(y,0),h)];
  }

  function update(){
    var rect = frame.getBoundingClientRect();
    var barBottom = topBar ? topBar.getBoundingClientRect().bottom : 0;
    var effTop = Math.max(rect.top, barBottom);
    var offsetY = effTop - rect.top;
    var effW = rect.width;
    var effH = Math.max(0, rect.bottom - effTop);

    var x = lastClientX === null ? 0 : lastClientX - rect.left;
    var y = lastClientY === null ? 0 : lastClientY - effTop;
    var p = project(x, y, effW, effH);

    marker.style.left = p[0] + 'px';
    marker.style.top = (offsetY + p[1]) + 'px';
  }

  frame.addEventListener('mousemove', function(e){
    lastClientX = e.clientX; lastClientY = e.clientY;
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
    frame.classList.add('tracking');
  });

  frame.addEventListener('mouseleave', function(){
    frame.classList.remove('tracking');
    lastClientX = null; lastClientY = null;
    marker.style.left = '0px'; marker.style.top = '0px';
  });

  window.addEventListener('scroll', function(){
    if(lastClientX === null) return;
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }, { passive:true });
})();

// Hamburger navigation menu
(function(){
  var wrap = document.getElementById('hamburgerWrap');
  var btn = document.getElementById('hamburgerBtn');
  if(!wrap || !btn) return;
  var mq = window.matchMedia('(max-width:700px)');

  function closeMenu(){ wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  function toggleMenu(){
    var isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  btn.addEventListener('click', function(e){
    if(!mq.matches){ btn.blur(); return; }
    e.stopPropagation();
    toggleMenu();
  });
  document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });
})();
