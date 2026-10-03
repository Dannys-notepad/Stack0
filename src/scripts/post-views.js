// ============================================
// post-views.js
// Increments the view count for the current post
// and updates the displayed number.
// Loaded only by PostLayout.
// ============================================

(function(){
  var el = document.getElementById('postViewCount');
  if(!el) return;

  var slug = el.getAttribute('data-views-slug');
  if(!slug) return;

  fetch('/api/views/increment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: slug })
  })
    .then(function(res){
      if(!res.ok) throw new Error('Failed to increment');
      return res.json();
    })
    .then(function(data){
      if(typeof data.count === 'number'){
        el.textContent = formatCount(data.count);
      }
    })
    .catch(function(){
      // Silent fail: leave the element empty or with its existing value.
    });

  function formatCount(n){
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
})();