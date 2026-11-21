// Mode 5: Two fingers. The shape your fingers make is the music. There is no split screen.
//   1 finger drawing: a line plays a melody along its height; draw a closed loop (a circle) and it becomes one long, ringing note.
//   2 fingers: how far apart they are sets one held note.
//   3 fingers: a triangle, a three-note chord.
//   4 fingers: a square, a steady four-beat pulse.
//   Fingers that land after the first group (put down two more, anywhere): how far apart that second pair is sets the loudness,
//   closer is softer and further is louder. The loudness stays where you leave it.
// Trails stay on screen and fade. The whole screen takes its colour from the note, across about three octaves.
(function () {
  'use strict';
  var M = RS.modes.span = { id: 'span', name: 'Two fingers', icon: '✌️' };
  var GROUP = 0.28;                                   // seconds: fingers that land within this window of the first one are the shape
  var TRAIL_LIFE = 3.5, MAXPTS = 220, CHORD = [1, 1.2599, 1.4983];
  var S, ptr = {}, gT0 = 0, vol = 0.6, shape = '', voices = [], freq = 220, env0 = 0;
  var beatAt = 0, beatN = 0, trails = [], rings = [], sparks = [], hue = 200, bright = 0.5;

  M.start = function (stage) {
    S = stage; ptr = {}; gT0 = 0; vol = 0.6; shape = ''; voices = []; freq = 220; env0 = 0;
    beatAt = 0; beatN = 0; trails = []; rings = []; sparks = []; hue = 200; bright = 0.5;
  };
  M.stop = function () { stopVoices(0.4); ptr = {}; };
  M.stopNote = function () { stopVoices(0.5); };
  function stopVoices(r) { voices.forEach(function (v) { if (v) v.release(r || 0.6); }); voices = []; shape = ''; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  M.down = function (id, x, y) {
    var now = performance.now() / 1000;
    if (!Object.keys(ptr).length) gT0 = now;
    ptr[id] = { x: x, y: y, t0: now, grp: (now - gT0) <= GROUP, trail: [{ x: x, y: y, t: now, h: hue }] };
  };
  M.move = function (id, x, y) {
    var p = ptr[id]; if (!p) return;
    p.x = x; p.y = y;
    var tr = p.trail, l = tr[tr.length - 1];
    if (Math.hypot(x - l.x, y - l.y) > 4) { tr.push({ x: x, y: y, t: performance.now() / 1000, h: hue }); if (tr.length > MAXPTS) tr.shift(); }
  };
  M.up = function (id) {
    var p = ptr[id]; if (!p) return;
    delete ptr[id];
    if (p.trail.length > 1) { trails.push(p.trail); if (trails.length > 30) trails.shift(); }
    if (shape === 'line' && p.grp && Object.keys(ptr).length === 0 && closedLoop(p.trail)) ringNote(p.trail);
  };

  // A stroke that goes round and comes back near where it began is a circle.
  function closedLoop(pts) {
    if (pts.length < 12) return false;
    var cx = 0, cy = 0, i;
    pts.forEach(function (p) { cx += p.x; cy += p.y; });
    cx /= pts.length; cy /= pts.length;
    var sum = 0, net = 0, prev = null, rmin = 1e9, rmax = 0;
    pts.forEach(function (p) {
      var a = Math.atan2(p.y - cy, p.x - cx), r = Math.hypot(p.x - cx, p.y - cy);
      rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
      if (prev !== null) { var d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; sum += Math.abs(d); net += d; }
      prev = a;
    });
    var gap = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
    return rmax > 30 && rmin > rmax * 0.35 && Math.abs(net) > 1.6 * Math.PI && Math.abs(net) > 0.75 * sum && gap < rmax * 1.2;
  }
  function pitchOfUnit(u) {
    u = clamp(u, 0, 1);
    if (RS.settings.glide === 'glide') return 130.81 * Math.pow(2, u * 3);              // C3 up three octaves, smooth
    return RS.audio.mtof(RS.audio.midiFromUnit(u, 3, 48));                              // steps on the chosen scale
  }
  function rootFromSize(d) { return pitchOfUnit((d - 30) / (Math.min(S.w, S.h) * 0.85)); }
  function hueOf(f) { return ((Math.log(f / 130) / Math.log(2)) / 3) * 300; }

  // One long note for a circle: it rings for a few seconds and the ring glows where it was drawn.
  function ringNote(pts) {
    var cx = 0, cy = 0, r = 0;
    pts.forEach(function (p) { cx += p.x; cy += p.y; });
    cx /= pts.length; cy /= pts.length;
    pts.forEach(function (p) { r += Math.hypot(p.x - cx, p.y - cy); });
    r /= pts.length;
    var f = pitchOfUnit(1 - (cy - S.h * 0.08) / (S.h * 0.84)), v = RS.audio.voice(f, { type: 'sine', gain: 0.0001, attack: 0.2 });
    if (v) { v.setGain(vol * 0.4, 0.15); setTimeout(function () { v.release(2.5); }, 3200); }
    RS.audio.bell(f * 2, vol * 0.5, 2.5);
    rings.push({ x: cx, y: cy, r: r, t: performance.now() / 1000, h: hueOf(f) });
    if (rings.length > 6) rings.shift();
  }

  // The fingers that make the shape, and the later ones that set the loudness.
  function groupsNow() {
    var ids = Object.keys(ptr).sort(function (a, b) { return ptr[a].t0 - ptr[b].t0; });
    var grp = ids.filter(function (id) { return ptr[id].grp; }), ext = ids.filter(function (id) { return !ptr[id].grp; });
    if (grp.length === 1 && ext.length === 1) grp.push(ext.shift());                  // a slow second finger still makes two fingers
    if (!grp.length) { grp = ext; ext = []; }
    return { grp: grp.slice(0, 4).map(function (id) { return ptr[id]; }), ext: ext.map(function (id) { return ptr[id]; }) };
  }
  function newVoice(f, type) { return RS.audio.voice(f, { type: type || 'triangle', gain: 0.0001, attack: 0.02 }); }

  M.draw = function (g, w, h, dt) {
    var now = performance.now() / 1000, sp = RS.speed(), i, G = groupsNow(), pts = G.grp, ex = G.ext, want = '';
    if (pts.length) want = pts.length === 1 ? 'line' : pts.length === 2 ? 'span' : pts.length === 3 ? 'triangle' : 'square';
    if (want !== shape) { stopVoices(want ? 0.25 : 0.6); shape = want; env0 = now; beatN = 0; beatAt = now - 1; }

    // ---- the loudness: a second pair of fingers ----
    if (ex.length >= 2) vol = clamp(0.05 + (Math.hypot(ex[0].x - ex[1].x, ex[0].y - ex[1].y) - 40) / (Math.min(w, h) * 0.5) * 0.95, 0.05, 1);

    // ---- the sound ----
    var cx = 0, cy = 0, size = 0;
    if (pts.length) {
      pts.forEach(function (p) { cx += p.x; cy += p.y; });
      cx /= pts.length; cy /= pts.length;
      pts.forEach(function (p) { size += Math.hypot(p.x - cx, p.y - cy); });
      size = size / pts.length * 2;
    }
    if (want === 'line') {
      freq = pitchOfUnit(1 - (pts[0].y - h * 0.08) / (h * 0.84));
      if (!voices.length) voices = [newVoice(freq, 'triangle')];
      if (voices[0]) { voices[0].setFreq(freq, 0.04); voices[0].setGain(vol * 0.4, 0.03); }
    } else if (want === 'span') {
      freq = rootFromSize(size);
      if (!voices.length) voices = [newVoice(freq, 'triangle'), newVoice(freq * 2, 'sine')];
      var level = vol * (0.3 + 0.7 * Math.exp(-(now - env0) / 1.2));
      if (voices[0]) { voices[0].setFreq(freq, 0.04); voices[0].setGain(level * 0.45, 0.02); }
      if (voices[1]) { voices[1].setFreq(freq * 2, 0.04); voices[1].setGain(level * 0.12, 0.02); }
    } else if (want === 'triangle') {
      freq = rootFromSize(size);
      if (!voices.length) voices = CHORD.map(function (r) { return newVoice(freq * r, 'triangle'); });
      voices.forEach(function (v, k) { if (v) { v.setFreq(freq * CHORD[k], 0.05); v.setGain(vol * 0.2, 0.03); } });
    } else if (want === 'square') {
      freq = rootFromSize(size);
      var period = 0.5 / sp;
      if (now - beatAt >= period) {                                                  // a steady count of four: one, two, three, four
        beatAt = now - beatAt > period * 2 ? now : beatAt + period;
        var k4 = beatN % 4;
        if (k4 === 0) RS.audio.kick(0.55 * vol);
        RS.audio.bell(freq * (k4 === 0 ? 1 : 2), vol * [0.9, 0.5, 0.65, 0.5][k4], 0.55);
        beatN++;
      }
    }

    // ---- colour: the whole screen follows the note and the loudness ----
    var th = voices.length || (want === 'square') ? hueOf(freq) : hue, tb = want ? 0.35 + 0.6 * vol : 0.45;
    var dh = ((th - hue + 540) % 360) - 180;
    hue = (hue + dh * Math.min(1, dt * 8) + 360) % 360;
    bright += (tb - bright) * Math.min(1, dt * 6);
    var L = 90 - 10 * bright, act = !!want;
    var gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, 'hsl(' + hue + ',' + (act ? 75 : 40) + '%,' + L + '%)');
    gr.addColorStop(1, 'hsl(' + ((hue + 40) % 360) + ',' + (act ? 70 : 35) + '%,' + (L + 3) + '%)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    var col = 'hsl(' + hue + ',90%,58%)';

    // ---- trails: they stay a while, then fade ----
    g.lineCap = 'round'; g.lineJoin = 'round';
    var live = Object.keys(ptr).map(function (id) { return ptr[id].trail; });
    trails = trails.filter(function (tr) { return now - tr[tr.length - 1].t < TRAIL_LIFE; });
    trails.concat(live).forEach(function (tr) {
      for (i = 1; i < tr.length; i++) {
        var a = 1 - (now - tr[i].t) / TRAIL_LIFE;
        if (a <= 0) continue;
        g.globalAlpha = a * 0.85; g.strokeStyle = 'hsl(' + tr[i].h + ',90%,55%)'; g.lineWidth = 3 + 9 * a;
        g.beginPath(); g.moveTo(tr[i - 1].x, tr[i - 1].y); g.lineTo(tr[i].x, tr[i].y); g.stroke();
      }
    });
    g.globalAlpha = 1;

    // ---- circle notes: a ring that glows where it was drawn ----
    rings = rings.filter(function (r) { return now - r.t < 6; });
    rings.forEach(function (r) {
      var age = (now - r.t) / 6, a = Math.max(0, 1 - age), c2 = 'hsl(' + r.h + ',90%,58%)';
      g.globalAlpha = a; g.strokeStyle = c2; g.shadowColor = c2; g.shadowBlur = 24; g.lineWidth = 10 + Math.sin(now * 3) * 2;
      g.beginPath(); g.arc(r.x, r.y, r.r * (1 + age * 0.25), 0, Math.PI * 2); g.stroke();
      g.shadowBlur = 0; g.strokeStyle = RS.pal.ink; g.lineWidth = 3; g.beginPath(); g.arc(r.x, r.y, r.r * (1 + age * 0.25) + 9, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    });

    // ---- the shape under your fingers ----
    function glowPath(list, closed) {
      g.beginPath(); list.forEach(function (p, k) { if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); if (closed) g.closePath();
    }
    if (want === 'span') {
      g.strokeStyle = RS.pal.ink; g.lineWidth = 12; glowPath(pts, false); g.stroke();
      g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 26; g.lineWidth = 6; glowPath(pts, false); g.stroke(); g.shadowBlur = 0;
      for (var s = 0; s < 3; s++) {
        var u = Math.random();
        sparks.push({ x: pts[0].x + (pts[1].x - pts[0].x) * u, y: pts[0].y + (pts[1].y - pts[0].y) * u,
          vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220, life: 1, hue: hue + Math.random() * 40 });
      }
    } else if (want === 'triangle' || want === 'square') {
      var poly = pts.slice().sort(function (a, b) { return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx); });
      g.fillStyle = col; g.globalAlpha = 0.28; glowPath(poly, true); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = RS.pal.ink; g.lineWidth = 12; glowPath(poly, true); g.stroke();
      g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 26; g.lineWidth = 6; glowPath(poly, true); g.stroke(); g.shadowBlur = 0;
      if (want === 'square') {                                                       // the corner that just sounded flashes, going round
        var f = Math.max(0, 1 - (now - beatAt) / 0.4), hit = poly[(beatN + 3) % 4];
        g.globalAlpha = f; g.fillStyle = RS.pal.paper; g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 24;
        g.beginPath(); g.arc(hit.x, hit.y, 30 + 40 * (1 - f), 0, Math.PI * 2); g.fill(); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
      }
    }

    // ---- the loudness pair: a ring that swells with the volume ----
    if (ex.length >= 2) {
      var mx = (ex[0].x + ex[1].x) / 2, my = (ex[0].y + ex[1].y) / 2;
      g.strokeStyle = RS.pal.ink; g.lineWidth = 4; g.setLineDash([5, 8]); g.beginPath(); g.moveTo(ex[0].x, ex[0].y); g.lineTo(ex[1].x, ex[1].y); g.stroke(); g.setLineDash([]);
      g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 16; g.lineWidth = 6;
      g.beginPath(); g.arc(mx, my, 14 + vol * 40, 0, Math.PI * 2); g.stroke(); g.shadowBlur = 0;
    }

    for (i = sparks.length - 1; i >= 0; i--) {
      var q = sparks[i]; q.life -= dt * 1.6 * sp;
      if (q.life <= 0) { sparks.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      g.globalAlpha = q.life; g.fillStyle = 'hsl(' + q.hue + ',95%,68%)'; g.shadowColor = g.fillStyle; g.shadowBlur = 12;
      g.beginPath(); g.arc(q.x, q.y, 3 + q.life * 5, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; g.globalAlpha = 1;
    }
    if (sparks.length > 250) sparks.splice(0, sparks.length - 250);

    // Fingers take the colour of the note.
    Object.keys(ptr).forEach(function (id) {
      g.strokeStyle = RS.pal.ink; g.lineWidth = 4; g.fillStyle = 'hsl(' + hue + ',90%,82%)';
      g.beginPath(); g.arc(ptr[id].x, ptr[id].y, ptr[id].grp ? 20 : 15, 0, Math.PI * 2); g.fill(); g.stroke();
    });
  };
  M.info = function () {
    return { held: voices.length > 0, shape: shape, freq: Math.round(freq), vol: Math.round(vol * 100) / 100, amp: Math.round(vol * 100) / 100,
      fingers: Object.keys(ptr).length, trails: trails.length, rings: rings.length, beats: beatN, hue: Math.round(hue) };
  };
})();
