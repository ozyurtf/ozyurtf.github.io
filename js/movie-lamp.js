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
        '  border: 1.6px solid #727272;',
        '  border-radius: 2px;',
        '}',
        // Drawn as an SVG line (not a CSS div) so its stroke renders with the
        // exact same weight as the lamp body and pull-rope.
        '.lamp-rod {',
        '  position: absolute; top: 0;',
        '  overflow: visible;',
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
        // The canister head tilts on the knuckle. Its rotation is driven in JS
        // (see tiltTo) rather than a CSS transition, so the beam can be redrawn
        // on every frame and stay glued to the lens as the head sweeps.
        '.lamp-head {',
        '  position: absolute;',
        '  transform-origin: 0 0;',
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
        '     fill="none" stroke="#727272" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">',
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

    var rod = document.createElementNS(NS, 'svg');
    rod.setAttribute('class', 'lamp-rod');
    rod.innerHTML = '<line x1="2" y1="0" x2="2" y2="0" stroke="#727272" ' +
        'stroke-width="1.6" stroke-linecap="round"/>';
    var rodLine = rod.querySelector('line');
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
        rod.style.left = (pivot.x - 2) + 'px';
        rod.setAttribute('width', 4);
        rod.setAttribute('height', pivot.y);
        rod.setAttribute('viewBox', '0 0 4 ' + pivot.y);
        rodLine.setAttribute('y2', pivot.y);
        plate.style.left = (pivot.x - 21) + 'px';
        // Chain joins the underside of the base, just right of the rod.
        pull.style.left = (pivot.x + 6) + 'px';
        pull.style.top = '11px';
        svg.style.width = window.innerWidth + 'px';
        svg.style.height = window.innerHeight + 'px';
        svg.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
    }

    // Live head aim angle (radians, before the -90deg baseline). Baseline
    // hangs straight down = +90deg. The head rotation and the beam are both
    // driven from this single value so they can never drift apart.
    var headAngle = Math.PI / 2;
    var anim = null;            // in-flight rAF id for the tilt animation
    var aimTarget = null;       // snapshot of the card the beam is painting onto

    function applyHead(ang) {
        head.style.transform = 'rotate(' + (ang * 180 / Math.PI - 90) + 'deg)';
    }

    // Paint the beam for card target `t` with the head at the live angle `ang`,
    // so the beam mouth stays glued to the lens while the head sweeps. The far
    // edge lands on the card's right-hand corners.
    function drawBeam(t, ang) {
        var ux = Math.cos(ang), uy = Math.sin(ang);
        var lx = pivot.x + LENS_DIST * ux, ly = pivot.y + LENS_DIST * uy;
        // Cone spreads from the full lens opening (perpendicular to the aim)
        // out to the card's right-hand corners.
        var px = -uy * LENS_RADIUS, py = ux * LENS_RADIUS;
        cone.setAttribute('points',
            (lx + px) + ',' + (ly + py) + ' ' +
            t.r.right + ',' + t.r.top + ' ' +
            t.r.right + ',' + t.r.bottom + ' ' +
            (lx - px) + ',' + (ly - py));
        // Falloff runs from the lens (bright) to the card (faint).
        beamGrad.setAttribute('x1', lx); beamGrad.setAttribute('y1', ly);
        beamGrad.setAttribute('x2', t.r.right); beamGrad.setAttribute('y2', t.midY);
        // Soft pool over the card.
        pool.setAttribute('cx', (t.r.left + t.r.right) / 2);
        pool.setAttribute('cy', t.midY);
        pool.setAttribute('rx', t.r.width / 2 + 14);
        pool.setAttribute('ry', t.r.height / 2 + 10);
        // Recolour everything to the card's colour.
        for (var i = 0; i < stops.length; i++) stops[i].setAttribute('stop-color', t.c);
        lens.setAttribute('fill', t.c);
    }

    // Swing the head from its current angle to `ang` over one easing curve,
    // redrawing the beam (when a card target `t` is given) on every frame so
    // light and lamp move as one. `instant` snaps with no animation, used when
    // tracking scroll/resize where any lag would read as a disconnect.
    function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
    function tiltTo(ang, t, instant) {
        if (anim) { cancelAnimationFrame(anim); anim = null; }
        if (instant) {
            headAngle = ang;
            applyHead(ang);
            if (t) drawBeam(t, ang);
            return;
        }
        var from = headAngle;
        var delta = ang - from;                       // take the short way round
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        var start = null, DUR = 350;
        function frame(now) {
            if (start === null) start = now;
            var p = Math.min(1, (now - start) / DUR);
            var cur = from + delta * easeOut(p);
            headAngle = cur;
            applyHead(cur);
            if (t) drawBeam(t, cur);
            anim = p < 1 ? requestAnimationFrame(frame) : null;
        }
        anim = requestAnimationFrame(frame);
    }

    function aim(li, instant) {
        var r = li.getBoundingClientRect();
        var c = window.getComputedStyle(li).backgroundColor;
        if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') c = ACCENT;
        var midY = (r.top + r.bottom) / 2;
        aimTarget = { r: r, c: c, midY: midY };
        var ang = Math.atan2(midY - pivot.y, r.right - pivot.x);
        tiltTo(ang, aimTarget, instant);
    }

    function idle() {
        aimTarget = null;
        tiltTo(Math.atan2(220, -200), null, false);
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
            if (anim) { cancelAnimationFrame(anim); anim = null; }
            headAngle = Math.PI / 2;                   // baseline
            applyHead(headAngle);                      // hang straight down
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
            else if (current) aim(current, true);
            else idle();
        });
        window.addEventListener('scroll', function () {
            if (current && !isOff()) aim(current, true);
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
