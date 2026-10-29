/* Progressive image previews and exclusive video playback. No tracking or dependencies. */
(function () {
    'use strict';

    var copy = {
        en: { title: 'Screenshot preview', close: 'Close', expand: 'Enlarge image', note: 'Screenshot · controls inside the image are not interactive.' },
        ko: { title: '스크린샷 미리보기', close: '닫기', expand: '이미지 확대', note: '스크린샷 · 이미지 속 버튼은 작동하지 않습니다.' },
        ja: { title: 'スクリーンショット', close: '閉じる', expand: '画像を拡大', note: 'スクリーンショット内のボタンは操作できません。' },
        'zh-hans': { title: '截图预览', close: '关闭', expand: '放大图片', note: '截图中的按钮无法操作。' },
        'zh-hant': { title: '截圖預覽', close: '關閉', expand: '放大圖片', note: '截圖中的按鈕無法操作。' }
    };

    function init() {
        var locale = document.documentElement.lang.toLowerCase();
        var labels = copy[locale] || copy.en;
        var links = Array.from(document.querySelectorAll('a[href]')).filter(function (link) {
            return link.querySelector('img') && !link.hasAttribute('download') &&
                /\.(?:png|jpe?g|webp)(?:[?#]|$)/i.test(link.getAttribute('href'));
        });
        var viewer;
        var close;
        var image;
        var caption;
        var opener;
        var previousOverflow;

        function pauseVideos(except) {
            document.querySelectorAll('video').forEach(function (video) {
                if (video !== except && !video.paused) { video.pause(); }
            });
        }
        // Capture includes videos created later by the hero's play button.
        document.addEventListener('play', function (event) {
            if (event.target.tagName === 'VIDEO') { pauseVideos(event.target); }
        }, true);

        if (!links.length || typeof HTMLDialogElement === 'undefined') { return; }
        viewer = document.createElement('dialog');
        if (typeof viewer.showModal !== 'function') { return; }
        viewer.className = 'media-viewer';
        viewer.setAttribute('aria-labelledby', 'media-viewer-title');
        viewer.setAttribute('aria-describedby', 'media-viewer-note');
        var header = document.createElement('div');
        header.className = 'media-viewer-header';
        var title = document.createElement('h2');
        title.id = 'media-viewer-title';
        title.textContent = labels.title;
        close = document.createElement('button');
        close.type = 'button';
        close.className = 'media-viewer-close';
        close.textContent = labels.close + ' ×';
        close.setAttribute('aria-label', labels.close);
        close.autofocus = true;
        header.append(title, close);
        image = document.createElement('img');
        image.className = 'media-viewer-image';
        caption = document.createElement('p');
        caption.className = 'media-viewer-caption';
        var note = document.createElement('p');
        note.id = 'media-viewer-note';
        note.className = 'media-viewer-note';
        note.textContent = labels.note;
        viewer.append(header, image, caption, note);
        document.body.appendChild(viewer);

        function dismiss() { viewer.close(); }
        close.addEventListener('click', dismiss);
        // Escape uses the native dialog cancel behaviour and its focus trap.
        viewer.addEventListener('close', function () {
            document.body.style.overflow = previousOverflow;
            image.removeAttribute('src');
            if (opener && opener.isConnected) { opener.focus({ preventScroll: true }); }
        });
        var startedOutside = false;
        function outside(event) {
            var rect = viewer.getBoundingClientRect();
            return event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right ||
                event.clientY < rect.top || event.clientY > rect.bottom);
        }
        viewer.addEventListener('pointerdown', function (event) { startedOutside = outside(event); });
        viewer.addEventListener('click', function (event) {
            if (startedOutside && outside(event)) { dismiss(); }
            startedOutside = false;
        });
        links.forEach(function (link) {
            var thumbnail = link.querySelector('img');
            link.classList.add('image-preview-link');
            link.setAttribute('aria-haspopup', 'dialog');
            link.setAttribute('aria-label', labels.expand + ': ' + thumbnail.alt);
            var badge = document.createElement('span');
            badge.className = 'image-preview-badge';
            badge.setAttribute('aria-hidden', 'true');
            badge.textContent = labels.expand + ' ⤢';
            link.appendChild(badge);
            link.addEventListener('click', function (event) {
                // Keep the normal link as a no-JS fallback and for new-tab gestures.
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
                event.preventDefault();
                document.dispatchEvent(new Event('viewlingo:before-image-preview'));
                opener = link;
                var figure = link.closest('figure');
                var description = figure && figure.querySelector('figcaption');
                image.src = link.href;
                image.alt = thumbnail.alt;
                caption.textContent = description ? description.textContent : thumbnail.alt;
                previousOverflow = document.body.style.overflow;
                pauseVideos();
                viewer.showModal();
                document.body.style.overflow = 'hidden';
                close.focus();
            });
        });
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
}());
