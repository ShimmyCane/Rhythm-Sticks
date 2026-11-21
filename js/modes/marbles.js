// Mode 8: Marbles. Tap or drag across the top to drop marbles. They fall through a field of pegs; each peg
// is a bell tuned to a note and glows when a marble strikes it. Drop a few, and a tune falls out of the physics.
// Two fingers change the mood of the whole thing (each one can be switched off in the gear panel):
//   slide up or down: speed (up is faster); slide left or right: mood (left minor and sad, right major and happy);
//   pull apart or pinch together: energy (how bouncy the marbles are). The first move you make picks which one.
(function () {
  'use strict';
  var M = RS.modes.marbles = { id: 'marbles', name: 'Marbles', icon: '🔮' };
  var S, pegs = [], marbles = [], rings = [], held = {}, hits = 0, lastDrop = 0;
  var COLS = [RS.pal.coral, RS.pal.sun, RS.pal.mint, RS.pal.sky, RS.pal.lilac, RS.pal.peach];
  var G = 1000, VMAX = 1500, MAJOR = [0, 2, 4, 7, 9], MINOR = [0, 3, 5, 7, 10];
  // The three two-finger controls. speed: 0.35 to 2.2 (1 is normal); mood: 0 minor, 0.5 your own notes, 1 major; energy: 0.5 to 1.5 bounce.
  var ctl = { speed: 1, mood: 0.5, energy: 0.8 };
  var pair = null, hudAt = -9;
  function on(key) { return RS.settings[key] !== 'off'; }

  function layout() {
    pegs = [];
    var rows = 6, cols = 7, top = S.h * 0.22, bottom = S.h * 0.86;
    var pr = Math.max(14, Math.min(S.w, S.h) * 0.032);
    for (var r = 0; r < rows; r++) {
      var y = top + (bottom - top) * (r / (rows - 1)), off = (r % 2) * 0.5, n = r % 2 ? cols - 1 : cols;
      for (var c = 0; c < n; c++) {
        var x = S.w * (0.09 + 0.82 * ((c + 0.5 + off) / cols));      // room between the walls and the end pegs, so marbles do not wedge
        pegs.push({ x: x, y: y, r: pr, glow: 0, step: 0, col: COLS[(r + c) % COLS.length] });
      }
    }
    tune();
  }
  // Low notes on the left, high on the right. Mood left of the middle uses a minor set, right of it a major set.
  function tune() {
    pegs.forEach(function (p) {
      var u = p.x / S.w;
      if (ctl.mood < 0.34 || ctl.mood > 0.66) {
        var sc = ctl.mood < 0.34 ? MINOR : MAJOR, n = sc.length * 2, i = Math.max(0, Math.min(n - 1, Math.floor(u * n)));
        p.midi = 55 + 12 * Math.floor(i / sc.length) + sc[i % sc.length];
      } else p.midi = RS.audio.midiFromUnit(u, 2, 55);
    });
  }
  M.start = function (stage) { S = stage; marbles = []; rings = []; held = {}; hits = 0; pair = null; layout(); };
  M.stop = function () { held = {}; marbles = []; pair = null; };
  M.resize = function () { layout(); };

  function drop(x) {
    if (marbles.length > 28) marbles.shift();
    marbles.push({ x: x, y: S.h * 0.05, vx: (Math.random() - 0.5) * 40, vy: 0, r: Math.max(9, Math.min(S.w, S.h) * 0.02), col: COLS[Math.floor(Math.random() * COLS.length)], life: 0 });
    RS.audio.pop(0.5, 420 + (x / S.w) * 500);                 // a little sound the moment you drop one
    lastDrop = performance.now();
  }
  function ids() { return Object.keys(held); }
  M.down = function (id, x, y) {
    held[id] = { x: x, y: y };
    if (ids().length >= 2) { startPair(); return; }              // a second finger makes controls, not a marble
    drop(x);
  };
  M.move = function (id, x, y) {
    if (!held[id]) return;
    held[id].x = x; held[id].y = y;
    if (pair) { pair.mvd[id] = 1; movePair(); return; }
    if (performance.now() - lastDrop > 150) drop(x);
  };
  M.up = function (id) { delete held[id]; if (ids().length < 2) pair = null; };

  function pairNow() {
    var a = held[ids()[0]], b = held[ids()[1]];
    return { mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
  }
  function startPair() { var p = pairNow(); pair = { mx: p.mx, my: p.my, d: p.d, sx: p.mx, sy: p.my, sd: p.d, axis: '', mvd: {} }; }
  function movePair() {
    var p = pairNow(), dx = p.mx - pair.mx, dy = p.my - pair.my, dd = p.d - pair.d;
    if (!pair.axis) {                                            // the first clear movement picks the control (net movement, since fingers report one at a time)
      if (Object.keys(pair.mvd).length < 2) return;             // wait until both fingers have reported
      var Dx = Math.abs(p.mx - pair.sx), Dy = Math.abs(p.my - pair.sy), Dd = Math.abs(p.d - pair.sd), big = Math.max(Dx, Dy, Dd);
      pair.mx = p.mx; pair.my = p.my; pair.d = p.d;
      if (big < 24) return;
      pair.axis = big === Dd ? 'energy' : big === Dy ? 'speed' : 'mood';
      return;
    }
    pair.mx = p.mx; pair.my = p.my; pair.d = p.d;
    var m = Math.min(S.w, S.h);
    if (pair.axis === 'speed' && on('mbSpeedCtl')) ctl.speed = Math.max(0.35, Math.min(2.2, ctl.speed * Math.exp(-dy * 0.004)));
    else if (pair.axis === 'mood' && on('mbMoodCtl')) { var before = ctl.mood; ctl.mood = Math.max(0, Math.min(1, ctl.mood + dx / (S.w * 0.5))); if (before !== ctl.mood) tune(); }
    else if (pair.axis === 'energy' && on('mbEnergyCtl')) ctl.energy = Math.max(0.5, Math.min(1.5, ctl.energy + dd / (m * 0.6)));
    else return;
    hudAt = performance.now() / 1000;
  }

  M.draw = function (g, w, h, dt) {
    var sp = RS.speed(), steps = 3, i, j, d = dt * sp * ctl.speed / steps, rest = ctl.energy, wallRest = Math.min(rest, 1) * 0.8;
    g.fillStyle = RS.pal.vanilla; g.fillRect(0, 0, w, h);
    // A soft hint of the drop zone along the top.
    g.fillStyle = 'rgba(255,224,138,0.35)'; g.fillRect(0, 0, w, h * 0.1);

    for (var s = 0; s < steps; s++) {
      for (i = marbles.length - 1; i >= 0; i--) {
        var m = marbles[i];
        var px0 = m.x, py0 = m.y;
        m.vy += G * d; m.x += m.vx * d; m.y += m.vy * d; m.life += d;
        if (m.x < m.r) { m.x = m.r; m.vx = Math.max(Math.abs(m.vx) * wallRest, 70); }       // a wall always gives a little push back
        if (m.x > w - m.r) { m.x = w - m.r; m.vx = -Math.max(Math.abs(m.vx) * wallRest, 70); }
        for (j = 0; j < pegs.length; j++) {
          var p = pegs[j], dx = m.x - p.x, dy = m.y - p.y, dist = Math.hypot(dx, dy), min = m.r + p.r;
          if (dist < min && dist > 0.001) {
            var nx = dx / dist, ny = dy / dist, vn = m.vx * nx + m.vy * ny;
            m.x = p.x + nx * min; m.y = p.y + ny * min;
            if (vn < 0) {
              m.vx -= (1 + rest) * vn * nx; m.vy -= (1 + rest) * vn * ny;
              m.vx += (Math.random() - 0.5) * 20;
              var vel = Math.min(1, -vn / 700);
              if (-vn > 60) {
                RS.audio.bell(RS.audio.mtof(p.midi), 0.35 + 0.65 * vel, 0.9);
                p.glow = 1; hits++;
                rings.push({ x: p.x, y: p.y, age: 0, col: p.col });
                if (rings.length > 40) rings.shift();
              }
            }
          }
        }
        var sv = Math.hypot(m.vx, m.vy); if (sv > VMAX) { m.vx *= VMAX / sv; m.vy *= VMAX / sv; }   // a very bouncy marble still settles
        // A marble that has hardly moved is stuck on a peg or a wall: nudge it, and let it go if it stays stuck.
        m.stuck = (Math.abs(m.x - px0) + Math.abs(m.y - py0) < 0.35) ? (m.stuck || 0) + d : 0;
        if (m.stuck > 0.25) { m.vx += (Math.random() - 0.5) * 260; m.vy -= 120; m.stuck = 0.1; m.nudges = (m.nudges || 0) + 1; }
        if (m.nudges > 6 || m.y > h + 40) { marbles.splice(i, 1); }
      }
    }

    // Pegs.
    pegs.forEach(function (p) {
      p.glow = Math.max(0, p.glow - dt * 2.2 * sp);
      var gl = p.glow;
      g.beginPath(); g.arc(p.x, p.y, p.r * (1 + gl * 0.25), 0, Math.PI * 2);
      g.fillStyle = gl > 0.02 ? p.col : 'rgba(255,255,255,0.55)';
      if (gl > 0.02) { g.shadowColor = p.col; g.shadowBlur = 28 * gl; }
      g.fill(); g.shadowBlur = 0;
      g.strokeStyle = RS.pal.ink; g.globalAlpha = 0.45 + 0.55 * gl; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
    });
    for (i = rings.length - 1; i >= 0; i--) {
      var r = rings[i]; r.age += dt * 1.8 * sp;
      if (r.age > 1) { rings.splice(i, 1); continue; }
      g.globalAlpha = 1 - r.age; g.strokeStyle = r.col; g.lineWidth = 4; g.shadowColor = r.col; g.shadowBlur = 14;
      g.beginPath(); g.arc(r.x, r.y, 20 + r.age * 70, 0, Math.PI * 2); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
    }
    // Marbles.
    marbles.forEach(function (m) {
      g.beginPath(); g.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      g.fillStyle = m.col; g.shadowColor = m.col; g.shadowBlur = 14; g.fill(); g.shadowBlur = 0;
      g.strokeStyle = RS.pal.ink; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.25, 0, Math.PI * 2); g.fill();
    });
    var hudA = Math.max(0, Math.min(1, 1 - (performance.now() / 1000 - hudAt - 1.2) / 0.8));
    if (pair || hudA > 0) drawHud(g, hudA || 1);
    Object.keys(held).forEach(function (id) {                     // a held finger shows where the next marble will fall
      g.strokeStyle = RS.pal.ink; g.lineWidth = 3; g.globalAlpha = 0.5; g.setLineDash([6, 8]);
      g.beginPath(); g.moveTo(held[id].x, h * 0.05); g.lineTo(held[id].x, h * 0.2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    });
  };
  // Three small gauges in the top bar while you change things: speed, mood, energy. No words.
  function drawHud(g, a) {
    var x0 = 24, y0 = 14, gw = 130, items = [
      { icon: ctl.speed > 1.25 ? '🐇' : ctl.speed < 0.8 ? '🐢' : '🚶', v: (ctl.speed - 0.35) / 1.85, show: on('mbSpeedCtl'), hot: pair && pair.axis === 'speed' },
      { icon: ctl.mood < 0.34 ? '😢' : ctl.mood > 0.66 ? '😄' : '🙂', v: ctl.mood, show: on('mbMoodCtl'), hot: pair && pair.axis === 'mood' },
      { icon: '⚡', v: (ctl.energy - 0.5), show: on('mbEnergyCtl'), hot: pair && pair.axis === 'energy' }];
    g.save(); g.globalAlpha = a; g.font = '30px system-ui, sans-serif'; g.textBaseline = 'middle';
    items.forEach(function (it) {
      if (!it.show) return;
      g.fillStyle = RS.pal.ink; g.fillText(it.icon, x0, y0 + 22);
      g.fillStyle = 'rgba(47,45,61,0.2)'; g.fillRect(x0 + 46, y0 + 14, gw, 16);
      g.fillStyle = it.hot ? RS.pal.coral : RS.pal.sage; g.fillRect(x0 + 46, y0 + 14, gw * Math.max(0.03, Math.min(1, it.v)), 16);
      g.strokeStyle = RS.pal.ink; g.lineWidth = 2.5; g.strokeRect(x0 + 46, y0 + 14, gw, 16);
      x0 += gw + 90;
    });
    g.restore();
  }
  M.info = function () { return { marbles: marbles.length, pegs: pegs.length, hits: hits, speed: Math.round(ctl.speed * 100) / 100, mood: Math.round(ctl.mood * 100) / 100, energy: Math.round(ctl.energy * 100) / 100, axis: pair ? pair.axis : '', firstPegX: pegs.length ? Math.round(pegs[0].x) : 0, midis: pegs.slice(0, 4).map(function (p) { return p.midi; }) }; };
  M._dropAt = function (x) { drop(x); };
})();
