/* ViewLingo — 인터랙티브 뷰파인더 데모
 *
 * 실제 번역을 수행하지 않는다. 번역문은 사전 작성되어 아래 DATA 에 들어 있다.
 * 앱의 상호작용(영역을 드래그하면 그 안의 텍스트 위에 번역이 겹쳐진다)을
 * 브라우저에서 재현하는 시뮬레이션이며, UI 에 그 사실을 명시한다.
 *
 * 네트워크 호출 없음 — 제품의 오프라인·온디바이스 원칙과 동일하게 동작한다.
 */
(function () {
  'use strict';

  // 방문자 언어 → [원문 언어, 오버레이 언어]
  // 일본어 방문자에게는 한국어를 원문으로 보여준다.
  var PAIRS = {
    en: ['ja', 'en'],
    ko: ['ja', 'ko'],
    'zh-hans': ['ja', 'zh-hans'],
    'zh-hant': ['ja', 'zh-hant'],
    ja: ['ko', 'ja']
  };

  var LABEL = {
    ja: '日本語', ko: '한국어', en: 'English',
    'zh-hans': '简体中文', 'zh-hant': '繁體中文'
  };

  var UI = {
    en: {
      hint: 'Drag across the article to translate', reset: 'Reset',
      note: 'This is a simulation, not the app.',
      diffTitle: 'How the real app differs',
      diffs: [
        'Translations here are written in advance. The app translates any text, on-device, with Apple\u2019s translation engine.',
        'The app works over any window on your Mac \u2014 browsers, PDFs, video, apps \u2014 not just this one article.',
        'Live Mode keeps re-translating as the screen changes, which a static page cannot show.',
        'Timing here shows the recognition phase, measured at just under a second for a screen of text. Fresh translations then arrive in batches and can take several seconds the first time; text the app has seen before appears almost instantly.'
      ]
    },
    ko: {
      hint: '기사 위를 드래그해 보세요', reset: '다시 하기',
      note: '이 화면은 시뮬레이션이며 실제 앱이 아닙니다.',
      diffTitle: '실제 앱과 다른 점',
      diffs: [
        '여기 번역문은 미리 작성해 둔 것입니다. 실제 앱은 Apple 번역 엔진으로 어떤 텍스트든 기기 안에서 번역합니다.',
        '실제 앱은 이 기사뿐 아니라 Mac의 모든 창에서 동작합니다 \u2014 브라우저, PDF, 영상, 앱.',
        'Live 모드는 화면이 바뀔 때마다 계속 다시 번역합니다. 정적인 웹페이지로는 재현할 수 없습니다.',
        '여기 표시 속도는 문자 인식 단계의 실측치(한 화면 기준 1초 미만)입니다. 처음 보는 텍스트의 번역은 이후 배치 단위로 도착하며 몇 초가 걸릴 수 있고, 한 번 번역한 텍스트는 거의 즉시 나타납니다.'
      ]
    },
    ja: {
      hint: '記事の上をドラッグしてみてください', reset: 'リセット',
      note: 'これはシミュレーションであり、実際のアプリではありません。',
      diffTitle: '実際のアプリとの違い',
      diffs: [
        'ここの訳文はあらかじめ用意したものです。実際のアプリは Apple の翻訳エンジンで、どんなテキストも端末内で翻訳します。',
        '実際のアプリはこの記事だけでなく、Mac 上のあらゆるウインドウで動作します \u2014 ブラウザ、PDF、動画、アプリ。',
        'Live モードは画面が変わるたびに翻訳し直します。静的なページでは再現できません。',
        'ここの表示速度は文字認識段階の実測値（1 画面で 1 秒弱）です。初めてのテキストの翻訳はその後バッチ単位で届き、数秒かかることがあります。一度翻訳したテキストはほぼ即座に表示されます。'
      ]
    },
    'zh-hans': {
      hint: '在文章上拖动试试', reset: '重置',
      note: '这是模拟演示，并非实际应用。',
      diffTitle: '与实际应用的区别',
      diffs: [
        '此处译文为预先写好的内容。实际应用使用 Apple 翻译引擎，在设备端翻译任意文本。',
        '实际应用可用于 Mac 上的任意窗口 \u2014 浏览器、PDF、视频、各类应用 \u2014 不限于这篇文章。',
        'Live 模式会随画面变化持续重新翻译，静态网页无法呈现。',
        '此处速度为文字识别阶段的实测值（一屏文字不到 1 秒）。首次翻译的文本随后按批次显示，可能需要几秒；应用翻译过的文本几乎立即显示。'
      ]
    },
    'zh-hant': {
      hint: '在文章上拖曳試試', reset: '重設',
      note: '這是模擬示範，並非實際應用程式。',
      diffTitle: '與實際應用程式的差異',
      diffs: [
        '此處譯文為預先寫好的內容。實際應用程式使用 Apple 翻譯引擎，在裝置端翻譯任意文字。',
        '實際應用程式可用於 Mac 上的任意視窗 \u2014 瀏覽器、PDF、影片、各類應用程式 \u2014 不限於這篇文章。',
        'Live 模式會隨畫面變化持續重新翻譯，靜態網頁無法呈現。',
        '此處速度為文字辨識階段的實測值（一畫面文字不到 1 秒）。首次翻譯的文字隨後按批次顯示，可能需要幾秒；應用程式翻譯過的文字幾乎立即顯示。'
      ]
    }
  };

  // 원문(source) 과 각 대상 언어의 번역문. 인덱스가 서로 대응한다.
  var DATA = {
    ja: {
      kind: ['headline', 'meta', 'body', 'body', 'body', 'meta'],
      url: 'news.example.jp/transit/2026',
      source: [
        '東京メトロ、来春から全車両に多言語案内表示を導入',
        '2026年7月18日 12:34 · 社会',
        '東京メトロは、訪日外国人の増加に対応するため、来年春から全車両のディスプレイに多言語案内を表示すると発表した。',
        '対応言語は英語、中国語、韓国語の三言語で、駅名や乗り換え情報に加え、遅延の理由も表示される。',
        '同社の担当者は「言葉の壁を感じずに移動できる環境を整えたい」と話している。',
        '関連記事 · 交通 · インバウンド'
      ],
      en: [
        'Tokyo Metro to add multilingual displays to all trains next spring',
        'July 18, 2026 12:34 · Society',
        'Tokyo Metro announced it will show multilingual guidance on displays in all trains from next spring, responding to the rise in visitors from abroad.',
        'The displays will support English, Chinese and Korean, covering station names, transfer information and the reasons for delays.',
        'A company representative said they want to build an environment where people can travel without feeling a language barrier.',
        'Related · Transit · Inbound travel'
      ],
      ko: [
        '도쿄메트로, 내년 봄부터 전 차량에 다국어 안내 표시 도입',
        '2026년 7월 18일 12:34 · 사회',
        '도쿄메트로는 방일 외국인 증가에 대응하기 위해 내년 봄부터 전 차량 디스플레이에 다국어 안내를 표시한다고 발표했다.',
        '지원 언어는 영어, 중국어, 한국어 세 가지로 역명과 환승 정보에 더해 지연 사유도 표시된다.',
        '회사 관계자는 "언어의 벽을 느끼지 않고 이동할 수 있는 환경을 만들고 싶다"고 말했다.',
        '관련 기사 · 교통 · 인바운드'
      ],
      'zh-hans': [
        '东京地铁将于明年春季在全部车厢引入多语言引导显示',
        '2026年7月18日 12:34 · 社会',
        '东京地铁宣布，为应对访日外国游客增加，将从明年春季起在全部车厢的显示屏上提供多语言引导。',
        '支持英语、汉语和韩语三种语言，除站名和换乘信息外，还会显示延误原因。',
        '该公司负责人表示，希望营造一个不会感到语言障碍的出行环境。',
        '相关报道 · 交通 · 入境游'
      ],
      'zh-hant': [
        '東京地鐵將於明年春季在全部車廂導入多語言導引顯示',
        '2026年7月18日 12:34 · 社會',
        '東京地鐵宣布，為因應訪日外國旅客增加，將自明年春季起在全部車廂的顯示器上提供多語言導引。',
        '支援英語、漢語與韓語三種語言，除站名與轉乘資訊外，也會顯示延誤原因。',
        '該公司負責人表示，希望營造一個不會感到語言隔閡的乘車環境。',
        '相關報導 · 交通 · 入境旅遊'
      ]
    },
    ko: {
      kind: ['headline', 'meta', 'body', 'body', 'body', 'meta'],
      url: 'news.example.kr/transit/2026',
      source: [
        '서울교통공사, 내년 봄부터 전 차량에 다국어 안내 표시 도입',
        '2026년 7월 18일 12:34 · 사회',
        '서울교통공사는 외국인 관광객 증가에 대응하기 위해 내년 봄부터 전 차량 디스플레이에 다국어 안내를 표시한다고 밝혔다.',
        '지원 언어는 영어, 일본어, 중국어 세 가지로 역명과 환승 정보에 더해 지연 사유도 표시된다.',
        '공사 관계자는 "언어의 벽 없이 이동할 수 있는 환경을 만들고 싶다"고 말했다.',
        '관련 기사 · 교통 · 관광'
      ],
      ja: [
        'ソウル交通公社、来春から全車両に多言語案内表示を導入',
        '2026年7月18日 12:34 · 社会',
        'ソウル交通公社は、外国人観光客の増加に対応するため、来年春から全車両のディスプレイに多言語案内を表示すると発表した。',
        '対応言語は英語、日本語、中国語の三言語で、駅名や乗り換え情報に加え、遅延の理由も表示される。',
        '同公社の担当者は「言葉の壁を感じずに移動できる環境を整えたい」と話している。',
        '関連記事 · 交通 · 観光'
      ]
    }
  };

  function detectLocale(root) {
    var explicit = root.getAttribute('data-locale');
    if (explicit && PAIRS[explicit]) return explicit;
    var path = location.pathname;
    var m = path.match(/\/(ko|ja|zh-hans|zh-hant)\//);
    return m ? m[1] : 'en';
  }

  function build(root) {
    var locale = detectLocale(root);
    var pair = PAIRS[locale];
    var srcLang = pair[0], dstLang = pair[1];
    var data = DATA[srcLang];
    var translations = data[dstLang];
    var ui = UI[locale] || UI.en;

    if (!translations) return; // 조합이 없으면 데모를 렌더하지 않는다

    root.classList.add('vl-demo');   // CSS 변수(--vl-viewfinder)와 레이아웃이 여기 걸린다
    root.innerHTML = '';

    // 도구줄
    var bar = el('div', 'vl-demo__toolbar');
    var langs = el('div', 'vl-demo__langs');
    langs.appendChild(el('span', 'vl-demo__pill', LABEL[srcLang]));
    langs.appendChild(el('span', 'vl-demo__arrow', '→'));
    langs.appendChild(el('span', 'vl-demo__pill', LABEL[dstLang]));
    bar.appendChild(langs);
    var reset = el('button', 'vl-demo__reset', ui.reset);
    reset.type = 'button';
    bar.appendChild(reset);
    root.appendChild(bar);

    // 화면
    var screen = el('div', 'vl-demo__screen');
    var chrome = el('div', 'vl-demo__chrome');
    chrome.appendChild(el('span', 'vl-demo__dot'));
    chrome.appendChild(el('span', 'vl-demo__dot'));
    chrome.appendChild(el('span', 'vl-demo__dot'));
    chrome.appendChild(el('span', 'vl-demo__url', data.url));
    screen.appendChild(chrome);

    var content = el('div', 'vl-demo__content');
    var segs = [];
    data.source.forEach(function (text, i) {
      var s = el('span', 'vl-seg vl-seg--' + data.kind[i], text);
      s.setAttribute('data-i', String(i));
      content.appendChild(s);
      segs.push(s);
    });
    screen.appendChild(content);

    var rect = el('div', 'vl-demo__rect');
    screen.appendChild(rect);
    var hint = el('div', 'vl-demo__hint', ui.hint);
    screen.appendChild(hint);
    root.appendChild(screen);

    var note = el('p', 'vl-demo__note');
    var strong = el('strong', null, ui.note);
    note.appendChild(strong);
    root.appendChild(note);

    var diff = el('div', 'vl-demo__diff');
    diff.appendChild(el('strong', null, ui.diffTitle));
    var ul = document.createElement('ul');
    ui.diffs.forEach(function (d) { ul.appendChild(el('li', null, d)); });
    diff.appendChild(ul);
    root.appendChild(diff);

    wire(root, screen, content, rect, segs, translations);
    reset.addEventListener('click', function () {
      clearOverlays(screen);
      root.classList.remove('vl-demo--used');
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clearOverlays(scope) {
    var old = scope.querySelectorAll('.vl-overlay');
    for (var i = 0; i < old.length; i++) old[i].remove();
  }

  function wire(root, screen, content, rect, segs, translations) {
    var dragging = false, x0 = 0, y0 = 0;

    function local(ev) {
      var b = screen.getBoundingClientRect();
      var p = ev.touches ? ev.touches[0] : ev;
      return { x: p.clientX - b.left, y: p.clientY - b.top };
    }

    function start(ev) {
      if (ev.button != null && ev.button !== 0) return;
      var p = local(ev);
      dragging = true; x0 = p.x; y0 = p.y;
      clearOverlays(screen);
      rect.style.display = 'block';
      place(rect, x0, y0, 0, 0);
      root.classList.add('vl-demo--used');
    }

    function move(ev) {
      if (!dragging) return;
      if (ev.cancelable) ev.preventDefault();
      var p = local(ev);
      place(rect, Math.min(x0, p.x), Math.min(y0, p.y), Math.abs(p.x - x0), Math.abs(p.y - y0));
    }

    function end() {
      if (!dragging) return;
      dragging = false;
      var r = {
        left: rect.offsetLeft, top: rect.offsetTop,
        right: rect.offsetLeft + rect.offsetWidth,
        bottom: rect.offsetTop + rect.offsetHeight
      };
      if (r.right - r.left < 24 || r.bottom - r.top < 16) { rect.style.display = 'none'; return; }
      rect.classList.add('vl-demo__rect--locked');  // 앱처럼 뷰파인더가 남는다
      reveal(screen, segs, translations, r);
    }

    screen.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    screen.addEventListener('touchstart', start, { passive: true });
    screen.addEventListener('touchmove', move, { passive: false });
    screen.addEventListener('touchend', end);
  }

  function place(node, l, t, w, h) {
    node.style.left = l + 'px'; node.style.top = t + 'px';
    node.style.width = w + 'px'; node.style.height = h + 'px';
  }

  /* 앱의 파이프라인을 시간차로 재현한다.
     캡처 직후 스켈레톤이 뜨고, OCR·번역이 끝나면 텍스트가 채워진다. */
  function reveal(screen, segs, translations, r) {
    var sb = screen.getBoundingClientRect();
    var pending = [];

    segs.forEach(function (seg, i) {
      var b = seg.getBoundingClientRect();
      var box = {
        left: b.left - sb.left, top: b.top - sb.top,
        right: b.right - sb.left, bottom: b.bottom - sb.top
      };
      // 뷰파인더와 겹치는 부분만 대상 — 앱은 캡처된 영역만 OCR 한다
      var ix0 = Math.max(box.left, r.left), iy0 = Math.max(box.top, r.top);
      var ix1 = Math.min(box.right, r.right), iy1 = Math.min(box.bottom, r.bottom);
      if (ix1 - ix0 < 6 || iy1 - iy0 < 5) return;

      var o = el('div', 'vl-overlay vl-overlay--pending');
      o.style.left = box.left + 'px';
      o.style.top = box.top + 'px';
      o.style.width = (box.right - box.left) + 'px';
      o.style.minHeight = (box.bottom - box.top) + 'px';
      o.style.fontSize = fitFontSize(seg, translations[i]);
      // 뷰파인더 밖으로 나가는 부분은 잘라낸다
      o.style.clipPath = 'inset(' +
        Math.max(0, iy0 - box.top) + 'px ' +
        Math.max(0, box.right - ix1) + 'px ' +
        Math.max(0, box.bottom - iy1) + 'px ' +
        Math.max(0, ix0 - box.left) + 'px)';
      screen.appendChild(o);
      pending.push({ node: o, text: translations[i] });
    });

    if (!pending.length) return;

    // 실측 기반 타이밍. 앱의 PerformanceLogger 기록(수동 캡처, 24세그먼트/395자)에서:
    //   OCR 780ms + 렌더링 17ms = 전체 약 1050ms
    // OCR 이 대부분을 차지하므로 스켈레톤이 그만큼 유지된 뒤 번역이 채워진다.
    // 실제 속도는 Mac 사양·텍스트 양·번역 캐시 적중 여부에 따라 달라진다.
    var OCR_MS = 780;
    pending.forEach(function (item, n) {
      setTimeout(function () {
        item.node.textContent = item.text;
        item.node.classList.remove('vl-overlay--pending');
        item.node.classList.add('vl-overlay--filled');
      }, OCR_MS + n * 80);
    });
  }

  /* 앱의 적응형 폰트 축소를 단순화해 재현한다.
     번역문이 원문보다 길면 상자에 맞게 줄인다. */
  function fitFontSize(seg, text) {
    var base = parseFloat(getComputedStyle(seg).fontSize);
    var srcLen = seg.textContent.length || 1;
    var ratio = srcLen / Math.max(text.length, 1);
    // 축소 하한을 두고, 남는 길이는 줄바꿈으로 흡수한다 (앱의 height expansion 과 동일한 취지)
    var size = base * Math.min(1, Math.max(0.72, ratio * 1.25));
    return size.toFixed(1) + 'px';
  }

  function init() {
    var nodes = document.querySelectorAll('[data-vl-demo]');
    for (var i = 0; i < nodes.length; i++) build(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
