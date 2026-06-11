// © 2026 Furkan Ozyurt. All Rights Reserved.
// Unauthorized copying, reuse, or distribution of this code is prohibited.
//
// movie-lamp.js
// A ceiling-mounted spotlight in the top-right of the Projects page: a canopy
// and rod drop from the ceiling to a tilting canister head. When the cursor is
// over a project description the head tilts to aim at it and casts a soft beam
// whose two edges land exactly on the rectangle's top-right and bottom-right
// corners. The beam is a light multiply wash of the rectangle's own colour, so
// it tints without hiding the rectangle's black outline and hard shadow.
// When the hover rectangles are toggled off, the lamp stays but goes inactive:
// it hangs straight down with the lens dark and no beam.
(function () {
    var NS = 'http://www.w3.org/2000/svg';
    var FALLBACK = '#fe7070';   // the Projects hover colour
    var OFF_LENS = '#d6d6d6';   // lens colour when the lamp is switched off
    var KNUCKLE_Y = 64;         // where the rod meets the head (viewport y)
    var LENS_DIST = 40;         // knuckle (arch apex) -> lens exit, along the aim
    var LENS_RADIUS = 9;        // half-width of the lens opening (the beam mouth)
    var LINE = '#727272';          // line-art stroke colour (matches the page)

    // ---- Styles ----------------------------------------------------------
    var style = document.createElement('style');
    style.textContent = [
        '.movie-lamp {',
        '  position: fixed;',
        '  inset: 0;',
        '  z-index: 60;',
        '  pointer-events: none;',
        '}',
        // Ceiling bar + rod, drawn as clean line-art to match the page.
        '.lamp-plate {',
        '  position: absolute; top: 0;',
        '  width: 42px; height: 12px;',
        '  box-sizing: border-box;',
        '  background: #fff;',
        '  border: 2px solid #727272;',
        '  border-radius: 2px;',
        '}',
        '.lamp-rod {',
        '  position: absolute; top: 0;',
        '  width: 2px;',
        '  background: #727272;',
        '}',
        // Pull-chain: hangs from the lamp joint; pull it to toggle rectangles.
        '.lamp-pull {',
        '  position: absolute;',
        '  transform-origin: 50% 0;',   // anchored at the top (the base)
        '  pointer-events: auto; cursor: pointer;',
        '}',
        '.lamp-pull:hover { filter: brightness(0.9); }',
        // Pull stretches the cord downward; its top stays fixed at the base.
        '.lamp-pull.pulling { animation: lamp-yank .45s ease; }',
        '@keyframes lamp-yank {',
        '  0% { transform: scaleY(1); }',
        '  35% { transform: scaleY(1.14); }',
        '  100% { transform: scaleY(1); }',
        '}',
        // The beam. Light multiply wash: tints white, leaves black alone.
        '.lamp-beam-svg {',
        '  position: absolute; left: 0; top: 0;',
        '  opacity: 0;',
        '  mix-blend-mode: multiply;',
        '  transition: opacity .2s ease;',
        '}',
        // Soft theatrical light: intensity comes from the gradients inside,
        // multiply keeps any black shadow/outline untouched.
        '.movie-lamp.lit .lamp-beam-svg { opacity: 1; }',
        // The canister head, tilting on the knuckle.
        '.lamp-head {',
        '  position: absolute;',
        '  transform-origin: 0 0;',
        '  transition: transform .35s cubic-bezier(.34,.1,.2,1);',
        '}',
        '.lamp-head svg { position: absolute; left: -20px; top: -4px; }',
        // The pull-rope replaces the swatch toggle on pages that have a lamp.
        '.rect-toggle { display: none !important; }',
        '@media (max-width: 900px) { .movie-lamp { display: none; } }'
    ].join('\n');
    document.head.appendChild(style);

    // ---- Lamp head: line-art capsule, hangs down (apex 20,4 / lens exit 20,44)
    var lampSVG = [
        '<svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" ',
        '     fill="none" stroke="#727272" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">',
        // arch top, straight sides, flat bottom
        '  <path d="M11 44 L11 14 A 9 10 0 0 1 29 14 L29 44 Z" fill="#ffffff"/>',
        // glowing lens section (recoloured at runtime)
        '  <rect class="lamp-lens" x="12" y="38.4" width="16" height="4.8" rx="1" fill="#fe7070" stroke="none"/>',
        // lens divider line
        '  <line x1="11" y1="38" x2="29" y2="38"/>',
        '</svg>'
    ].join('');

    // ---- DOM -------------------------------------------------------------
    // Soft light: a feathered cone with falloff, and a
    // soft pool where the light lands on the card. All recoloured at runtime.
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lamp-beam-svg');
    svg.innerHTML = [
        '<defs>',
        '  <linearGradient id="ml-beam" gradientUnits="userSpaceOnUse">',
        '    <stop offset="0" stop-color="#fe7070" stop-opacity="0.42"/>',
        '    <stop offset="1" stop-color="#fe7070" stop-opacity="0.08"/>',
        '  </linearGradient>',
        '  <radialGradient id="ml-pool">',
        '    <stop offset="0" stop-color="#fe7070" stop-opacity="0.30"/>',
        '    <stop offset="1" stop-color="#fe7070" stop-opacity="0"/>',
        '  </radialGradient>',
        '  <filter id="ml-soft" x="-35%" y="-35%" width="170%" height="170%">',
        '    <feGaussianBlur stdDeviation="5"/>',
        '  </filter>',
        '</defs>',
        '<g filter="url(#ml-soft)">',
        '  <polygon class="ml-cone" points="0,0 0,0 0,0" fill="url(#ml-beam)"/>',
        '</g>',
        '<ellipse class="ml-pool" fill="url(#ml-pool)"/>'
    ].join('');
    var cone = svg.querySelector('.ml-cone');
    var pool = svg.querySelector('.ml-pool');
    var beamGrad = svg.querySelector('#ml-beam');
    var stops = svg.querySelectorAll('stop');

    var rod = document.createElement('div');
    rod.className = 'lamp-rod';
    var plate = document.createElement('div');
    plate.className = 'lamp-plate';

    // A slim line-art pull-cord that matches the page (outline + white fill).
    // The cord starts at the very top so it stays joined to the base.
    var chainSVG = [
        '<svg width="12" height="50" viewBox="0 0 12 50" xmlns="http://www.w3.org/2000/svg" ',
        '     fill="none" stroke="#727272" stroke-width="1.6" stroke-linecap="round">',
        '  <rect width="12" height="50" fill="#fff" fill-opacity="0" stroke="none" pointer-events="all"/>',
        '  <line x1="6" y1="0" x2="6" y2="40"/>',                     // cord
        '  <ellipse cx="6" cy="44" rx="3" ry="4" fill="#d0d0d0"/>',   // handle (gray)
        '</svg>'
    ].join('');

    var pull = document.createElement('div');
    pull.className = 'lamp-pull';
    pull.setAttribute('tabindex', '0');
    pull.setAttribute('role', 'button');
    pull.title = 'Pull to turn the hover rectangles on or off';
    pull.innerHTML = chainSVG;

    var head = document.createElement('div');
    head.className = 'lamp-head';
    head.innerHTML = lampSVG;
    var lens = head.querySelector('.lamp-lens');

    var lamp = document.createElement('div');
    lamp.className = 'movie-lamp';
    lamp.appendChild(svg);
    lamp.appendChild(rod);
    lamp.appendChild(plate);
    lamp.appendChild(head);
    lamp.appendChild(pull);

    // ---- Geometry --------------------------------------------------------
    // Knuckle (rod/head joint) in viewport coordinates: mounted top-right.
    var pivot = { x: 0, y: KNUCKLE_Y };

    function placePivot() {
        var col = document.querySelector('.nav, nav') || document.body;
        var right = col.getBoundingClientRect().right;
        pivot.x = Math.max(right + 90, window.innerWidth - 86);
        pivot.y = KNUCKLE_Y;
        head.style.left = pivot.x + 'px';
        head.style.top = pivot.y + 'px';
        rod.style.left = (pivot.x - 1) + 'px';
        rod.style.height = pivot.y + 'px';
        plate.style.left = (pivot.x - 21) + 'px';
        // Chain joins the underside of the base, just right of the rod.
        pull.style.left = (pivot.x + 6) + 'px';
        pull.style.top = '11px';
        svg.style.width = window.innerWidth + 'px';
        svg.style.height = window.innerHeight + 'px';
        svg.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
    }

    // Tilt the head so its lens points at (tx,ty). Baseline hangs straight
    // down, so subtract 90deg. Returns the lens centre plus the aim unit
    // vector, so the beam can spread from the full lens opening.
    function tiltTo(tx, ty) {
        var ang = Math.atan2(ty - pivot.y, tx - pivot.x);
        head.style.transform = 'rotate(' + (ang * 180 / Math.PI - 90) + 'deg)';
        var ux = Math.cos(ang), uy = Math.sin(ang);
        return { x: pivot.x + LENS_DIST * ux, y: pivot.y + LENS_DIST * uy, ux: ux, uy: uy };
    }

    function aim(li) {
        var r = li.getBoundingClientRect();
        var c = window.getComputedStyle(li).backgroundColor;
        if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') c = ACCENT;

        var a = tiltTo(r.right, (r.top + r.bottom) / 2);
        var midY = (r.top + r.bottom) / 2;
        // Cone spreads from the full lens opening (perpendicular to the aim)
        // out to the card's right-hand corners.
        var px = -a.uy * LENS_RADIUS, py = a.ux * LENS_RADIUS;
        cone.setAttribute('points',
            (a.x + px) + ',' + (a.y + py) + ' ' +
            r.right + ',' + r.top + ' ' +
            r.right + ',' + r.bottom + ' ' +
            (a.x - px) + ',' + (a.y - py));
        // Falloff runs from the lens (bright) to the card (faint).
        beamGrad.setAttribute('x1', a.x); beamGrad.setAttribute('y1', a.y);
        beamGrad.setAttribute('x2', r.right); beamGrad.setAttribute('y2', midY);
        // Soft pool over the card.
        pool.setAttribute('cx', (r.left + r.right) / 2);
        pool.setAttribute('cy', midY);
        pool.setAttribute('rx', r.width / 2 + 14);
        pool.setAttribute('ry', r.height / 2 + 10);
        // Recolour everything to the card's colour.
        for (var i = 0; i < stops.length; i++) stops[i].setAttribute('stop-color', c);
        lens.setAttribute('fill', c);
    }

    function idle() {
        tiltTo(pivot.x - 200, pivot.y + 220);
    }

    // The page's hover-rectangle colour (red on Projects, blue on Home, green
    // on Drawings), read from the stylesheet so the resting lens matches.
    var ACCENT = FALLBACK;
    function readAccent() {
        var base = targetSelector();
        var test;
        if (base === 'li.has-desc') test = function (s) { return s.indexOf('has-desc') !== -1; };
        else if (base === '.topics a') test = function (s) { return s.indexOf('topics a') !== -1; };
        else test = function (s) { return /(^|[\s,])p:hover/.test(s); };
        for (var s = 0; s < document.styleSheets.length; s++) {
            var rules;
            try { rules = document.styleSheets[s].cssRules; } catch (e) { continue; }
            for (var i = 0; rules && i < rules.length; i++) {
                var sel = rules[i].selectorText || '';
                if (sel.indexOf(':hover') === -1 || !test(sel)) continue;
                var bg = rules[i].style && rules[i].style.backgroundColor;
                if (bg) return bg;
            }
        }
        return FALLBACK;
    }

    // ---- Active / inactive (follows the rectangles toggle) ---------------
    function isOff() {
        return document.documentElement.classList.contains('rects-off');
    }

    function syncActive() {
        if (isOff()) {
            current = null;
            lamp.classList.remove('lit');
            head.style.transform = 'rotate(0deg)';   // hang straight down
            lens.setAttribute('fill', OFF_LENS);      // lens dark / closed
        } else {
            lens.setAttribute('fill', ACCENT);
            idle();
        }
    }

    // ---- Interaction -----------------------------------------------------
    var current = null;

    // Whatever carries the hover rectangle on this page: project descriptions
    // on Projects, the option links on Drawings, or the bio on Home.
    function targetSelector() {
        if (document.querySelector('li.has-desc')) return 'li.has-desc';
        if (document.querySelector('.topics a')) return '.topics a';
        return 'p';
    }

    // Everything the beam can aim at: the page's main target plus the nav
    // option links (Projects / Drawings / Home), each of which carries its own
    // coloured hover rectangle. aim() reads each element's own hover colour, so
    // the beam lands on a nav option tinted that option's colour.
    function aimNodes() {
        var sel = targetSelector() + ', .nav a, nav a';
        return document.querySelectorAll(sel);
    }

    function attach() {
        aimNodes().forEach(function (li) {
            li.addEventListener('mouseenter', function () {
                if (isOff()) return;
                current = li;
                lamp.classList.add('lit');
                aim(li);
            });
            li.addEventListener('mouseleave', function () {
                if (current === li) {
                    current = null;
                    lamp.classList.remove('lit');
                }
            });
        });
    }

    // Pulling the rope flips the same state the old swatch toggle used.
    function yankRope() {
        var off = document.documentElement.classList.toggle('rects-off');
        try { localStorage.setItem('rectangles', off ? 'off' : 'on'); } catch (e) {}
        pull.classList.remove('pulling');
        void pull.offsetWidth;           // restart the animation
        pull.classList.add('pulling');
    }

    function start() {
        document.body.appendChild(lamp);
        placePivot();
        attach();
        // Pages with no hover targets (e.g. the image gallery) show the lamp
        // as a fixture only: no light, and a neutral unlit lens.
        ACCENT = document.querySelector(targetSelector()) ? readAccent() : '#cfcfcf';
        syncActive();

        pull.addEventListener('click', yankRope);
        pull.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); yankRope(); }
        });
        pull.addEventListener('animationend', function () {
            pull.classList.remove('pulling');
        });

        // Re-aim / re-rest when the rectangles toggle flips.
        new MutationObserver(syncActive).observe(document.documentElement, {
            attributes: true, attributeFilter: ['class']
        });
        window.addEventListener('resize', function () {
            placePivot();
            if (isOff()) syncActive();
            else if (current) aim(current);
            else idle();
        });
        window.addEventListener('scroll', function () {
            if (current && !isOff()) aim(current);
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
