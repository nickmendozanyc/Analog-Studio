  // ---------------- Fermann PL-8 C power conditioners: one on top of every rack, with pull-out rack lights ----------------
  // Click a unit: its two lamps slide out of the top and light the rack below (or slide back in, and the rack goes dark).
  // Drag up / down or scroll on it: the dimmer. The voltmeter reads the mains; the amp bar the load in that rack.
  const FM = { st: [0, 1, 2, 3].map(() => ({ on: true, dim: 0.85 })), t: 0, v: [120, 120, 120, 120] };
  try { const sv = JSON.parse(localStorage.getItem('as-furman') || 'null'); if (Array.isArray(sv)) sv.forEach((o, i) => { if (o && FM.st[i]) Object.assign(FM.st[i], o); }); } catch (e) { /* storage unavailable */ }
  const fmSave = () => { try { localStorage.setItem('as-furman', JSON.stringify(FM.st)); } catch (e) { /* ignore */ } };
  function fmApply(i) {
    const S = FM.st[i];
    for (const el of document.querySelectorAll(`.fm-lamps[data-fm="${i}"], .fm-light[data-fm="${i}"]`)) { el.dataset.on = S.on ? '1' : '0'; el.style.setProperty('--dim', S.dim.toFixed(2)); }
    c1Lamp(`fm${i}-lt`, S.on);
    for (const g of c1All(`fm${i}-dim`)) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(g.getAttribute('transform') || ''); if (m) g.setAttribute('transform', `rotate(${(-140 + S.dim * 280).toFixed(1)} ${m[1]} ${m[2]})`); }
  }
  document.querySelectorAll('.fm-hot').forEach((el) => {
    const i = +el.dataset.fm; let y0 = null, d0 = 0, moved = false;
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); el.setPointerCapture(e.pointerId); y0 = e.clientY; d0 = FM.st[i].dim; moved = false; });
    el.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = y0 - e.clientY; if (Math.abs(dy) > 4) moved = true; if (moved) { FM.st[i].dim = Math.max(0.15, Math.min(1, d0 + dy / 200)); if (!FM.st[i].on) FM.st[i].on = true; fmApply(i); } });
    el.addEventListener('pointerup', () => { if (y0 == null) return; y0 = null; if (!moved) FM.st[i].on = !FM.st[i].on; fmApply(i); fmSave(); });
    el.addEventListener('wheel', (e) => { e.preventDefault(); FM.st[i].dim = Math.max(0.15, Math.min(1, FM.st[i].dim - Math.sign(e.deltaY) * 0.05)); FM.st[i].on = true; fmApply(i); fmSave(); }, { passive: false });
  });
  function fmTick() {
    if (++FM.t % 30) return;   // twice a second
    for (let i = 0; i < 4; i++) {
      FM.v[i] += (119.5 + Math.random() * 2 - FM.v[i]) * 0.3;
      sgTxt(`.fm${i}-v`, String(Math.round(FM.v[i])));
      const amps = (i === 0 ? 3.1 + (EL.on ? 1.2 : 0) : 0.2) + (FM.st[i].on ? 0.15 * FM.st[i].dim : 0) + Math.random() * 0.2;   // the outboard rack draws the most
      for (let k = 0; k < 8; k++) c1Lamp(`fm${i}-a${k}`, amps > k * 1.5 + 0.1);
    }
  }
  [0, 1, 2, 3].forEach(fmApply);
