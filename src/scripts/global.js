// ============================================
// global.js
// Site-wide behavior: cross marker, hamburger,
// meteor spawner, newsletter form.
// Loaded on every page.
// ============================================

// ---------- Cross marker ----------
// Projects the cursor onto the nearest edge of the frame border.
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
  }, { passive: true });
})();

// ---------- Hamburger menu ----------
(function(){
  var wrap = document.getElementById('hamburgerWrap');
  var btn = document.getElementById('hamburgerBtn');
  if(!wrap || !btn) return;

  var mq = window.matchMedia('(max-width: 700px)');

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

// ---------- Meteor spawner ----------
// ---------- Meteor spawner ----------
(function(){
  var forceMeteors = new URLSearchParams(window.location.search).get('meteors') === 'on';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion && !forceMeteors) return;

  var MIN_DELAY = 6000;
  var MAX_DELAY = 22000;

  function rand(min, max){
    return Math.random() * (max - min) + min;
  }

  function spawnMeteor(){
    var el = document.createElement('div');
    el.className = 'meteor';

    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var leftToRight = Math.random() > 0.35;
    var angle = rand(5, 25) * (leftToRight ? 1 : -1);

    var startX = leftToRight ? -180 : vw + 180;
    var startY = rand(-vh * 0.1, vh * 1.1);

    var travel = vw + 400;
    var duration = rand(700, 1400);

    var scale = rand(0.7, 1.3);
    var length = rand(80, 200);

    el.style.width = length + 'px';
    el.style.transform =
      'translate3d(' + startX + 'px,' + startY + 'px,0) ' +
      'rotate(' + angle + 'deg) scale(' + scale + ')';
    el.style.opacity = '0';

    document.body.appendChild(el);
    void el.offsetWidth;

    var endX = leftToRight ? startX + travel : startX - travel;
    var endY = startY + Math.tan(angle * Math.PI / 180) * travel * (leftToRight ? 1 : -1);

    var anim = el.animate([
      { transform: el.style.transform, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { opacity: 1, offset: 0.75 },
      {
        transform:
          'translate3d(' + endX + 'px,' + endY + 'px,0) ' +
          'rotate(' + angle + 'deg) scale(' + scale + ')',
        opacity: 0
      }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      fill: 'forwards'
    });

    anim.onfinish = function(){ el.remove(); };

    setTimeout(spawnMeteor, rand(MIN_DELAY, MAX_DELAY));
  }

  setTimeout(spawnMeteor, rand(2000, 5000));
})();

// ---------- Newsletter form ----------
(function(){
  var form = document.querySelector('.newsletter-form');
  if(!form) return;

  var input = form.querySelector('input[type="email"]');
  var btn = form.querySelector('button');
  if(!input || !btn) return;

  var originalText = btn.textContent;

  form.addEventListener('submit', function(e){
    e.preventDefault();

    var email = input.value.trim();
    if(!email) return;

    btn.textContent = 'Subscribing…';
    btn.disabled = true;
    input.disabled = true;

    fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .then(function(res){
        if(!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function(){
        btn.textContent = 'Check your inbox';
        form.reset();
        setTimeout(function(){
          btn.textContent = originalText;
          btn.disabled = false;
          input.disabled = false;
        }, 4000);
      })
      .catch(function(){
        btn.textContent = 'Try again';
        setTimeout(function(){
          btn.textContent = originalText;
          btn.disabled = false;
          input.disabled = false;
        }, 3000);
      });
  });
})();