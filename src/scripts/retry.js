// ============================================
// retry.js
// 503 page only: countdown + auto-reload + manual retry.
// ============================================

(function(){
  var DURATION = 60;
  var remaining = DURATION;

  var countEl = document.getElementById('retryCount');
  var fillEl = document.getElementById('retryBarFill');
  var retryBtn = document.getElementById('retryNowBtn');

  if(!countEl || !fillEl || !retryBtn) return;

  function tick(){
    remaining--;
    if(remaining <= 0){
      countEl.textContent = 'now';
      window.location.reload();
      return;
    }
    countEl.textContent = remaining + 's';
    fillEl.style.transform = 'scaleX(' + (remaining / DURATION) + ')';
    setTimeout(tick, 1000);
  }

  setTimeout(tick, 1000);

  retryBtn.addEventListener('click', function(){
    retryBtn.textContent = 'Checking…';
    retryBtn.disabled = true;
    window.location.reload();
  });
})();