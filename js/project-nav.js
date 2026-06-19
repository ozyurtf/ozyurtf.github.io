// © 2026 Furkan Ozyurt. All Rights Reserved.
// Unauthorized copying, reuse, or distribution of this code is prohibited.
//
// project-nav.js
// Each project page is a thin wrapper that embeds an external site in a
// full-viewport iframe, which left no way back to the rest of the site except
// the browser's back button. This adds the same Home / Projects / Drawings
// tabs as the main site, in the same spot (2rem from the top and left, with
// the matching colored hover rectangle and its black shade). The page is
// locked to the viewport as a flex column so it never scrolls — the tabs are
// the top row and the iframe fills the rest and scrolls itself — so the nav
// always stays at the top. All wrappers live at /projects/<name>/, so the
// links are constant.
(function () {
    var style = document.createElement('style');
    style.textContent = [
        // Lock the document to the viewport: no page scroll, so the tabs can
        // never scroll away. The iframe (the next flex row) scrolls internally.
        'html, body { height: 100%; }',
        'body { margin: 0; overflow: hidden; display: flex; flex-direction: column; background: #fff; }',
        // The tabs sit at 2rem from the top and left — exactly like the nav on
        // the Projects/Drawings pages (body padding 2rem, tabs nudged -10px) —
        // with no surrounding line, so they read as part of the page, not a bar.
        '.pnav {',
        '  flex: 0 0 auto; display: flex; align-items: center;',
        '  padding: 2rem 2rem 0.85rem calc(2rem - 10px);',
        '  font-family: Avenir, "Avenir Next", "Nunito Sans", -apple-system,',
        '    BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
        '}',
        '.pnav a {',
        '  color: #1a1a1a; text-decoration: none; font-size: 0.85rem;',
        '  line-height: 1; margin-right: 1.5rem; padding: 4px 9px;',
        '  border: 1px solid transparent; border-radius: 2px;',
        '}',
        // Same hover rectangle as the rest of the site: a black outline and a
        // hard offset black "shade" behind the colored tab.
        '.pnav a:hover {',
        '  border-color: #000;',
        '  box-shadow: 0 0 0 1px #000, -4px 4px 0 0 #000;',
        '}',
        '.pnav a.pnav-home:hover { background-color: #8fbef4; }',
        '.pnav a.pnav-projects:hover { background-color: #fe7070; }',
        '.pnav a.pnav-drawings:hover { background-color: #77e93a; }',
        '.pnav a.active { text-decoration: underline; }',
        '.pnav a.active:hover { text-decoration: none; }',
        'iframe { flex: 1 1 auto; width: 100%; min-height: 0; border: 0; display: block; }'
    ].join('\n');
    document.head.appendChild(style);

    function build() {
        if (document.querySelector('.pnav')) return;

        var nav = document.createElement('nav');
        nav.className = 'pnav';
        nav.innerHTML =
            '<a href="../../" class="pnav-home">Home</a>' +
            '<a href="../" class="pnav-projects active">Projects</a>' +
            '<a href="../../drawings/" class="pnav-drawings">Drawings</a>';
        document.body.insertBefore(nav, document.body.firstChild);

        // Apply the locked flex-column layout inline too, so it wins regardless
        // of the wrapper's own stylesheet.
        document.documentElement.style.height = '100%';
        var b = document.body.style;
        b.height = '100%'; b.margin = '0'; b.overflow = 'hidden';
        b.display = 'flex'; b.flexDirection = 'column';

        var frame = document.querySelector('iframe');
        if (frame) {
            frame.style.flex = '1 1 auto';
            frame.style.width = '100%';
            frame.style.minHeight = '0';
            frame.style.height = 'auto';
            frame.style.border = '0';
            frame.style.display = 'block';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
