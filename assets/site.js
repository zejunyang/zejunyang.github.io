(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (name, attrs, parent) => {
    const e = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  /* ── 卦：六位二进制，自下而上，1 阳 0 阴 ── */
  const NATURE = ['天', '泽', '火', '雷', '风', '水', '山', '地'];   // 乾 兑 离 震 巽 坎 艮 坤
  const NAMES = [                                                    // NAMES[下卦][上卦]
    ['乾', '夬', '大有', '大壮', '小畜', '需', '大畜', '泰'],
    ['履', '兑', '睽', '归妹', '中孚', '节', '损', '临'],
    ['同人', '革', '离', '丰', '家人', '既济', '贲', '明夷'],
    ['无妄', '随', '噬嗑', '震', '益', '屯', '颐', '复'],
    ['姤', '大过', '鼎', '恒', '巽', '井', '蛊', '升'],
    ['讼', '困', '未济', '解', '涣', '坎', '蒙', '师'],
    ['遁', '咸', '旅', '小过', '渐', '蹇', '艮', '谦'],
    ['否', '萃', '晋', '豫', '观', '比', '剥', '坤']
  ];
  const tri = s => 7 - parseInt(s, 2);
  function guaName(bits) {
    const lo = tri(bits.slice(0, 3)), up = tri(bits.slice(3));
    const name = NAMES[lo][up];
    return { name, full: lo === up ? name + '为' + NATURE[lo] : NATURE[up] + NATURE[lo] + name };
  }
  function drawGua(parent, bits, w, lh, gap) {
    const total = 6 * lh + 5 * gap, seg = w * 0.4;
    for (let i = 0; i < 6; i++) {
      const y = total / 2 - lh - i * (lh + gap);
      const row = svgEl('g', { class: 'yao' }, parent);
      if (bits[i] === '1') svgEl('rect', { x: -w / 2, y, width: w, height: lh }, row);
      else {
        svgEl('rect', { x: -w / 2, y, width: seg, height: lh }, row);
        svgEl('rect', { x: w / 2 - seg, y, width: seg, height: lh }, row);
      }
    }
  }
  function glyph(bits) {
    const s = svgEl('svg', { viewBox: '-13 -15 26 30', 'aria-hidden': 'true' });
    drawGua(s, bits, 24, 2.4, 2.6);
    return s;
  }

  /* ── 页面上的卦画 ── */
  document.querySelectorAll('[data-glyph]').forEach(el => el.prepend(glyph(el.dataset.glyph)));
  const posts = [...document.querySelectorAll('.post')].map(li => {
    const bits = li.dataset.gua, slot = li.querySelector('.post-gua');
    let b = slot.querySelector('b');
    if (!b) {
      b = document.createElement('b');
      b.textContent = guaName(bits).name;
      slot.appendChild(b);
    }
    slot.prepend(glyph(bits));
    return { id: li.id, bits, title: li.querySelector('h3').textContent.trim() };
  });

    if (document.getElementById('astrolabe')) {
/* ── 星盘 ── */
  const ringXiu = document.getElementById('ring-xiu');
  [...'角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸'].forEach((c, i) => {
    svgEl('text', { transform: `rotate(${i * 360 / 28}) translate(0 -282)` }, ringXiu).textContent = c;
  });
  const ringGua = document.getElementById('ring-gua');
  function addRing(from, count) {
    const end = Math.min(from + count, 64);
    for (let i = from; i < end; i++) {
      const bits = i.toString(2).padStart(6, '0');
      const g = svgEl('g', { transform: `rotate(${i * 5.625}) translate(0 -229)`, 'data-bits': bits }, ringGua);
      drawGua(g, bits, 13, 1.5, 1.4);
    }
    return end;
  }
  const center = document.getElementById('center');
  function setCenter(bits, hidden) {
    center.textContent = '';
    drawGua(center, bits, 124, 8, 13);
    if (hidden) center.querySelectorAll('.yao').forEach(y => y.classList.add('hide'));
  }
  function mark(bits) {
    const prev = ringGua.querySelector('.on');
    if (prev) prev.classList.remove('on');
    const node = ringGua.querySelector(`[data-bits="${bits}"]`);
    if (node) node.classList.add('on');
  }
  setCenter('000011');
  let built = addRing(0, 8);
  mark('000011');
  (function rest() {
    if (built >= 64) return;
    setTimeout(() => {
      built = addRing(built, 8);
      mark(bitsEl && bitsEl.textContent ? bitsEl.textContent : '000011');
      rest();
    }, 0);
  })();

  /* ── 起卦：观 → 思 → 行 → 省 ── */
  const btn = document.getElementById('cast'), trace = document.getElementById('trace');
  const nameEl = document.getElementById('guaName'), bitsEl = document.getElementById('guaBits');
  function log(phase, ...parts) {
    const li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span');
    b.textContent = phase;
    s.append(...parts);
    li.append(b, s);
    trace.appendChild(li);
  }
  const code = t => { const c = document.createElement('code'); c.textContent = t; return c; };
  const hamming = (a, b) => [...a].reduce((n, ch, i) => n + (ch !== b[i]), 0);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    trace.textContent = '';
    const rnd = new Uint8Array(7);
    crypto.getRandomValues(rnd);
    const bits = [...rnd.slice(0, 6)].map(v => v & 1).join('');

    log('观', '取六位随机数，自下而上，一位一爻');
    center.classList.add('casting');
    setCenter(bits, true);
    for (const row of center.querySelectorAll('.yao')) {
      await sleep(260);
      row.classList.remove('hide');
    }
    await sleep(600);

    const g = guaName(bits);
    nameEl.textContent = g.full;
    bitsEl.textContent = bits;
    mark(bits);
    log('思', `得 ${g.full} · `, code(bits));
    await sleep(800);

    let min = 7, best = [];
    posts.forEach(p => {
      const d = hamming(bits, p.bits);
      if (d < min) { min = d; best = [p]; } else if (d === min) best.push(p);
    });
    const pick = best[rnd[6] % best.length], pickName = guaName(pick.bits).name;
    log('行', min === 0
      ? `${posts.length} 篇文章里正好有「${pickName}」这一卦`
      : `${posts.length} 篇文章里最近的一卦是「${pickName}」，只差 ${min} 爻`);
    await sleep(800);

    const link = document.createElement('a');
    link.href = '#' + pick.id;
    link.textContent = `《${pick.title}》`;
    log('省', '不断吉凶，只荐一篇：', link);
    center.classList.remove('casting');
    btn.textContent = '再起一卦';
    btn.disabled = false;
  });

  }

  /* ── 星空：星官绕星盘缓缓旋转，连线上有信号经过 ── */
  if (!document.getElementById('sky')) return;

  const hero = document.querySelector('.hero'), cv = document.getElementById('sky');
  const ctx = cv.getContext('2d'), astro = document.getElementById('astrolabe');
  let W = 0, H = 0, px = 0, py = 0, stars = [], groups = [];
  function rng(seed) {
    return () => {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const TAU = Math.PI * 2;
  function layout() {
    const hr = hero.getBoundingClientRect(), ar = astro.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hr.width; H = hr.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    px = ar.left - hr.left + ar.width / 2;
    py = ar.top - hr.top + ar.height / 2;
    const inner = ar.width / 2 * 1.12;
    const R = Math.hypot(Math.max(px, W - px), Math.max(py, H - py));
    const rand = rng(64);
    stars = Array.from({ length: Math.round(W * H / 5200) }, () => ({
      r: R * Math.sqrt(rand()), a: rand() * TAU,
      s: rand() < .12 ? 1.6 : rand() * .9 + .4,
      o: rand() * .5 + .15, f: rand() * 1.2 + .3, p: rand() * TAU
    }));
    groups = Array.from({ length: 11 }, () => {
      const r = inner + rand() * (R - inner) * .85, a = rand() * TAU;
      const pts = [[r * Math.cos(a), r * Math.sin(a)]];
      let dir = rand() * TAU;
      const n = 4 + Math.floor(rand() * 4);
      for (let i = 1; i < n; i++) {
        dir += (rand() - .5) * 2.2;
        const step = 28 + rand() * 38, [x, y] = pts[i - 1];
        pts.push([x + Math.cos(dir) * step, y + Math.sin(dir) * step]);
      }
      return { pts, off: rand() * 20, sp: .35 + rand() * .3 };
    });
    if (reduce) draw(0);
  }
  function draw(ms) {
    const t = ms / 1000, rot = t * TAU / 1400, cos = Math.cos(rot), sin = Math.sin(rot);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#dedacb';
    for (const s of stars) {
      const x = px + s.r * Math.cos(s.a + rot), y = py + s.r * Math.sin(s.a + rot);
      if (x < -2 || x > W + 2 || y < -2 || y > H + 2) continue;
      ctx.globalAlpha = s.o * (.65 + .35 * Math.sin(t * s.f + s.p));
      ctx.fillRect(x, y, s.s, s.s);
    }
    ctx.lineWidth = .7;
    ctx.strokeStyle = '#dedacb';
    for (const g of groups) {
      const P = g.pts.map(([x, y]) => [px + x * cos - y * sin, py + x * sin + y * cos]);
      ctx.globalAlpha = .17;
      ctx.beginPath();
      P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
      for (const [x, y] of P) {
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, TAU);
        ctx.globalAlpha = 1; ctx.fillStyle = '#090e0d'; ctx.fill();
        ctx.globalAlpha = .5; ctx.stroke();
      }
      const span = P.length - 1, u = (t * g.sp + g.off) % (span + 6);
      if (!reduce && u < span) {
        const i = Math.floor(u), k = u - i;
        ctx.globalAlpha = .95; ctx.fillStyle = '#7db3a1';
        ctx.beginPath();
        ctx.arc(P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k, 1.7, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#dedacb';
    }
    ctx.globalAlpha = 1;
  }
  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(hero);
  new ResizeObserver(layout).observe(hero);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if (!reduce) {
    let last = 0;
    const frame = ms => {
      if (visible && !document.hidden && ms - last > 48) {
        last = ms;
        draw(ms);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
})();