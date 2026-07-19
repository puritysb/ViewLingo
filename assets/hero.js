/* 히어로 미디어 — 클릭 시 포스터를 영상으로 교체한다.
 * 영상은 클릭 전까지 요청하지 않는다(preload 없음). */
(function () {
  'use strict';

  function init() {
    var frames = document.querySelectorAll('[data-hero-media]');
    for (var i = 0; i < frames.length; i++) wire(frames[i]);
  }

  function wire(btn) {
    btn.addEventListener('click', function () {
      var src = btn.getAttribute('data-video');
      var fallback = btn.getAttribute('data-video-fallback');
      if (!src || btn.dataset.playing === '1') return;
      btn.dataset.playing = '1';

      var v = document.createElement('video');
      v.setAttribute('controls', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('autoplay', '');
      v.setAttribute('preload', 'auto');
      var poster = btn.querySelector('img');
      if (poster) v.setAttribute('poster', poster.getAttribute('src'));

      var s1 = document.createElement('source');
      s1.src = src; s1.type = 'video/mp4';
      v.appendChild(s1);
      if (fallback) {
        var s2 = document.createElement('source');
        s2.src = fallback; s2.type = 'video/quicktime';
        v.appendChild(s2);
      }

      btn.innerHTML = '';
      btn.appendChild(v);
      btn.style.cursor = 'default';
      // 버튼이 영상 컨트롤을 가리지 않도록 역할을 해제한다
      btn.removeAttribute('aria-label');
      // 실제 클릭은 사용자 제스처이므로 소리와 함께 재생된다.
      // 브라우저 정책으로 막히면 음소거로라도 재생해 화면이 멈춰 보이지 않게 한다.
      var play = v.play();
      if (play && play.catch) {
        play.catch(function () {
          v.muted = true;
          var retry = v.play();
          if (retry && retry.catch) retry.catch(function () { /* 컨트롤로 재생 */ });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
