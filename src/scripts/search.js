// ============================================
// search.js
// Search page only: filter posts by tag and query,
// render matches with highlighting.
// Reads data from the #searchData JSON script tag.
// Loaded only by search.astro.
// ============================================

(function(){
  var dataEl = document.getElementById('searchData');
  var POSTS = dataEl ? JSON.parse(dataEl.textContent) : [];

  var input = document.getElementById('searchInput');
  var list = document.getElementById('resultsList');
  var meta = document.getElementById('resultsMeta');
  var empty = document.getElementById('emptyState');
  var filters = document.getElementById('searchFilters');

  if(!input || !list || !meta || !empty || !filters) return;

  var activeTag = 'all';

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function highlight(text, q){
    if(!q) return escapeHtml(text);
    var escaped = escapeHtml(text);
    var escapedQ = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(
      new RegExp('(' + escapedQ + ')', 'ig'),
      '<mark class="search-hit">$1</mark>'
    );
  }

  function render(){
    var q = input.value.trim().toLowerCase();

    var matches = POSTS.filter(function(p){
      var tagOk = activeTag === 'all' || p.category === activeTag;
      var textOk = !q || (
        p.title.toLowerCase().indexOf(q) !== -1 ||
        p.desc.toLowerCase().indexOf(q) !== -1 ||
        (p.tags || []).some(function(t){ return t.toLowerCase().indexOf(q) !== -1; })
      );
      return tagOk && textOk;
    });

    list.innerHTML = matches.map(function(p){
      return '<article class="post">' +
        '<div class="post-meta">' +
          '<span>' + escapeHtml(p.date) + '</span>' +
          '<span class="dot">·</span>' +
          '<span class="tag">' + escapeHtml(p.category) + '</span>' +
        '</div>' +
        '<a class="post-title" href="' + escapeHtml(p.href) + '">' +
          highlight(p.title, q) +
        '</a>' +
        '<p class="post-desc">' + highlight(p.desc, q) + '</p>' +
      '</article>';
    }).join('');

    if(matches.length === 0){
      empty.style.display = 'block';
      meta.textContent = '';
    } else {
      empty.style.display = 'none';
      meta.textContent = matches.length +
        (matches.length === 1 ? ' result' : ' results') +
        (q ? ' for "' + q + '"' : '');
    }
  }

  input.addEventListener('input', render);

  filters.addEventListener('click', function(e){
    var chip = e.target.closest('.search-filter-chip');
    if(!chip) return;
    filters.querySelectorAll('.search-filter-chip').forEach(function(c){
      c.classList.remove('active');
    });
    chip.classList.add('active');
    activeTag = chip.getAttribute('data-tag');
    render();
  });

  document.addEventListener('keydown', function(e){
    if(e.key === '/' && document.activeElement !== input){
      e.preventDefault();
      input.focus();
    }
  });

  render();
})();