// CoRide System Architecture — navigation + animations

// ── Screen Navigation ──
function goScreen(name) {
  document.querySelectorAll('.detail-screen').forEach(function(s) { s.classList.remove('show'); });
  var target = document.getElementById('screen-' + name);
  if (target) target.classList.add('show');
}

// ── Card hover lift ──
document.querySelectorAll('.jc-card').forEach(function(card) {
  card.addEventListener('mouseenter', function() { this.style.transform = 'translateY(-2px)'; });
  card.addEventListener('mouseleave', function() { this.style.transform = 'translateY(0)'; });
});

// ── Layer tag pulse ──
var tags = document.querySelectorAll('#screen-main .layer-tag');
var tagIdx = 0;
setInterval(function() {
  tags.forEach(function(t) { t.style.opacity = '1'; });
  if (tags[tagIdx]) tags[tagIdx].style.opacity = '0.6';
  tagIdx = (tagIdx + 1) % tags.length;
}, 2000);

// ── Metrics animate on detail screen ──
var factorFills = document.querySelectorAll('.fb-fill');
setTimeout(function() {
  factorFills.forEach(function(f, i) {
    setTimeout(function() {
      var w = f.style.width;
      f.style.width = '0%';
      setTimeout(function() { f.style.width = w; }, 50);
    }, i * 100);
  });
}, 500);
