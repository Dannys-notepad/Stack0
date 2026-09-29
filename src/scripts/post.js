// ============================================
// post.js
// Post-page only: reading progress bar and
// table-of-contents scroll-spy.
// Loaded only by PostLayout.astro.
// ============================================

// ---------- Reading progress bar ----------
(function(){
  var bar = document.getElementById('readingProgress');
  if(!bar) return;

  function update(){
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if(scrollable <= 0){
      bar.style.opacity = '0';
      bar.style.width = '0%';
      return;
    }
    bar.style.opacity = '1';
    var pct = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Table of contents scroll-spy ----------
(function(){
  var links = document.querySelectorAll('#tocList a');
  if(!links.length) return;

  var headings = Array.prototype.map.call(links, function(a){
    return document.getElementById(a.getAttribute('href').slice(1));
  }).filter(Boolean);

  if(!headings.length) return;

  // Read the sticky bar height from CSS so this doesn't drift
  // when the top bar's padding changes.
  function getStickyOffset(){
    var topBar = document.querySelector('.top-bar');
    if(!topBar) return 110;
    return topBar.getBoundingClientRect().height + 24;
  }

  function onScroll(){
    var offset = getStickyOffset();
    var pos = window.scrollY + offset;
    var activeIndex = 0;

    headings.forEach(function(h, i){
      // getBoundingClientRect is relative to the viewport, so
      // add scrollY to convert it to a document-relative position.
      // More reliable than offsetTop when ancestors have position:relative.
      var top = h.getBoundingClientRect().top + window.scrollY;
      if(top <= pos) activeIndex = i;
    });

    links.forEach(function(a, i){
      a.classList.toggle('active', i === activeIndex);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

// ---------- Copy link button ----------
(function(){
  var btn = document.querySelector('.share-copy');
  if(!btn) return;

  btn.addEventListener('click', function(){
    var url = btn.getAttribute('data-copy-url');
    if(!url || !navigator.clipboard) return;

    navigator.clipboard.writeText(url).then(function(){
      var original = btn.getAttribute('aria-label');
      btn.setAttribute('aria-label', 'Copied');
      setTimeout(function(){
        btn.setAttribute('aria-label', original);
      }, 1500);
    });
  });
})();