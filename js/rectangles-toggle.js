// © 2026 Furkan Ozyurt. All Rights Reserved.
// Unauthorized copying, reuse, or distribution of this code is prohibited.
//
// rectangles-toggle.js
// Adds an elegant top-right button that enables/disables the colored hover
// rectangles across the site. The choice is saved in localStorage so it is
// consistent on every page.
(function () {
    var STORAGE_KEY = 'rectangles';
    var root = document.documentElement;

    // Apply the saved preference as early as possible.
    var enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    if (!enabled) {
        root.classList.add('rects-off');
    }

    // Styles for the toggle button, plus the rules that neutralise every hover
    // rectangle when the site is in the "off" state.
    var style = document.createElement('style');
    style.textContent = [
        '.rect-toggle {',
        // Positioned (top/left) by JS so it lines up with the first text line
        // and the right edge of the text column. Absolute so it scrolls with
        // the page instead of floating over the content.
        '  position: absolute;',
        '  z-index: 1000;',
        '  display: inline-flex;',
        '  padding: 0;',
        '  border: none;',
        '  background: none;',
        '  cursor: pointer;',
        '}',
        '.rect-toggle .rect-swatch {',
        '  width: 13px;',
        '  height: 13px;',
        '  border-radius: 2px;',
        '  border: 1px solid #555;',
        '  background: linear-gradient(135deg, #8fbef4 0 33%, #fe7070 33% 66%, #77e93a 66% 100%);',
        '  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease;',
        '}',
        // Hovering the toggle button gives its swatch the same thick black
        // outline and hard offset shadow as the hover rectangles it controls.
        '.rect-toggle:hover .rect-swatch {',
        '  border-color: #000;',
        '  box-shadow: 0 0 0 1px #000, -5px 5px 0 0 #000;',
        '}',
        'html.rects-off .rect-toggle .rect-swatch {',
        '  background: transparent;',
        '}',
        // Give every hover rectangle a thicker black outline and a hard
        // (no-blur) offset shadow, so a solid black rectangle appears to sit
        // behind it like a cast shadow. The 1px spread ring thickens the
        // outline and the offset block is the shadow; using box-shadow for
        // both means there is no layout shift on hover.
        '.nav a:hover,',
        'nav a:hover,',
        'p:hover,',
        'li.has-desc:hover,',
        '.topics a:hover {',
        '  border-color: #000;',
        '  box-shadow: 0 0 0 1px #000, -5px 5px 0 0 #000;',
        '}',
        // The project title links live inside `li.has-desc`, which already
        // draws its own rectangle on hover. Keep them plain so we do not get a
        // rectangle-inside-a-rectangle.
        'li.has-desc a:hover {',
        '  border-color: transparent;',
        '  box-shadow: none;',
        '}',
        // Disable every hover rectangle when turned off. Both `.nav a`
        // (inner pages) and `nav a` (home page) are covered.
        'html.rects-off .nav a:hover,',
        'html.rects-off nav a:hover,',
        'html.rects-off p:hover,',
        'html.rects-off li.has-desc:hover,',
        'html.rects-off .topics a:hover {',
        '  border-color: transparent;',
        '  background-color: transparent;',
        '  box-shadow: none;',
        '}',
        // Keep the orange emphasis on projects when rectangles are off.
        'html.rects-off li.has-desc:hover .highlight {',
        '  color: #f0820e;',
        '}'
    ].join('\n');
    document.head.appendChild(style);

    function buildButton() {
        var btn = document.createElement('button');
        btn.className = 'rect-toggle';
        btn.type = 'button';

        var swatch = document.createElement('span');
        swatch.className = 'rect-swatch';

        btn.appendChild(swatch);

        function sync() {
            var on = !root.classList.contains('rects-off');
            btn.setAttribute('aria-pressed', String(on));
            btn.title = on ? 'Rectangles on — click to disable' : 'Rectangles off — click to enable';
        }

        btn.addEventListener('click', function () {
            var nowOff = root.classList.toggle('rects-off');
            localStorage.setItem(STORAGE_KEY, nowOff ? 'off' : 'on');
            sync();
        });

        sync();
        document.body.appendChild(btn);

        // Anchor the swatch to the first text line (the page title on the home
        // page, the nav row elsewhere) and to the right edge of that element.
        function position() {
            var anchor = document.querySelector('h1, .nav, nav');
            if (!anchor) {
                btn.style.top = '2rem';
                btn.style.left = 'auto';
                btn.style.right = '2rem';
                return;
            }
            var rect = anchor.getBoundingClientRect();
            var cs = window.getComputedStyle(anchor);
            var lineHeight = parseFloat(cs.lineHeight);
            if (!lineHeight) {
                lineHeight = parseFloat(cs.fontSize) * 1.5;
            }
            // Centre the swatch on the element's first line.
            var lineCentre = rect.top + window.scrollY + Math.min(lineHeight, rect.height) / 2;
            btn.style.top = (lineCentre - btn.offsetHeight / 2) + 'px';
            btn.style.left = (rect.right + window.scrollX - btn.offsetWidth) + 'px';
            btn.style.right = 'auto';
        }

        position();
        window.addEventListener('resize', position);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildButton);
    } else {
        buildButton();
    }
})();
