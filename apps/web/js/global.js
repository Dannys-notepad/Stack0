// Cross marker: projects the cursor onto the nearest edge of the frame border.
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
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
    frame.classList.add('tracking');
  });

  frame.addEventListener('mouseleave', function(){
    frame.classList.remove('tracking');
    lastClientX = null;
    lastClientY = null;
    marker.style.left = '0px';
    marker.style.top = '0px';
  });

  window.addEventListener('scroll', function(){
    if(lastClientX === null) return;
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }, { passive:true });
})();

// Hamburger menu toggle
(function(){
  var wrap = document.getElementById('hamburgerWrap');
  var btn = document.getElementById('hamburgerBtn');
  if(!wrap || !btn) return;
  var mq = window.matchMedia('(max-width:700px)');

  function closeMenu(){
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu(){
    var isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  btn.addEventListener('click', function(e){
    if(!mq.matches){
      btn.blur();
      return;
    }
    e.stopPropagation();
    toggleMenu();
  });
  document.addEventListener('click', function(e){
    if(!wrap.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeMenu();
  });
})();

// Newsletter form interactive submission
(function(){
  var form = document.querySelector('.newsletter-form');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = form.querySelector('button');
    var original = btn.textContent;
    btn.textContent = 'Subscribed ✓';
    btn.disabled = true;
    setTimeout(function(){
      btn.textContent = original;
      btn.disabled = false;
      form.reset();
    }, 2200);
  });
})();

// Error page search redirect
(function(){
  var input = document.getElementById('errorSearchInput');
  if(!input) return;
  input.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && input.value.trim()){
      window.location.href = '/search?q=' + encodeURIComponent(input.value.trim());
    }
  });
})();

// 503 maintenance retry countdown timer
(function(){
  var DURATION = 60;
  var remaining = DURATION;
  var countEl = document.getElementById('retryCount');
  var fillEl = document.getElementById('retryBarFill');
  var retryBtn = document.getElementById('retryNowBtn');
  if(!countEl || !fillEl || !retryBtn) return;
  var timer = null;

  function tick(){
    remaining--;
    if(remaining <= 0){
      countEl.textContent = 'now';
      window.location.reload();
      return;
    }
    countEl.textContent = remaining + 's';
    fillEl.style.transform = 'scaleX(' + (remaining / DURATION) + ')';
    timer = setTimeout(tick, 1000);
  }
  timer = setTimeout(tick, 1000);

  retryBtn.addEventListener('click', function(){
    if(timer) clearTimeout(timer);
    retryBtn.textContent = 'Checking…';
    retryBtn.disabled = true;
    window.location.reload();
  });
})();

// Reading Progress bar for post pages
(function(){
  var bar = document.getElementById('readingProgress');
  if(!bar) return;
  function update(){
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
})();

// Table of Contents scroll-spy
(function(){
  var links = document.querySelectorAll('#tocList a');
  if(!links.length) return;
  var headings = Array.prototype.map.call(links, function(a){
    return document.getElementById(a.getAttribute('href').slice(1));
  }).filter(Boolean);
  if(!headings.length) return;

  function onScroll(){
    var pos = window.scrollY + 110;
    var activeIndex = 0;
    headings.forEach(function(h, i){
      if(h.offsetTop <= pos) activeIndex = i;
    });
    links.forEach(function(a, i){
      a.classList.toggle('active', i === activeIndex);
    });
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();
