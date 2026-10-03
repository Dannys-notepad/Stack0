// ============================================
// views.js
// Fetches view counts in one request and fills
// them into any element with [data-views-slug].
// ============================================

(function(){
  var elements = document.querySelectorAll('[data-views-slug]');
  if(!elements.length) return;

  fetch('/api/views/all')
    .then(function(res){
      if(!res.ok) throw new Error('Failed to fetch');
      return res.json();
    })
    .then(function(counts){
      elements.forEach(function(el){
        var slug = el.getAttribute('data-views-slug');
        var n = counts[slug];
        if(typeof n === 'number'){
          el.textContent = formatCount(n);
        } else {
          el.textContent = '0';
        }
      });
    })
    .catch(function(){
      // Silent fail: leave the element with its placeholder.
    });

  function formatCount(n){
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
})();