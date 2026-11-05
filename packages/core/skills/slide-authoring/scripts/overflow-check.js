// Paste into a browser evaluate call on a page opened at /s/<id>/preview?p=N&step=n
// once [data-osd-preview="ready"] is present. Returns the visible text that sticks out
// of the 1920×1080 canvas, in canvas pixels: [left, top, right, bottom]. Expected: [].
// Text first gets clipped by its overflow-hidden ancestors (ellipsis rows, code cards),
// except ones as large as the canvas, which would hide exactly what this looks for.
// Text inside a <Camera> is reported with camera: true: a framing crop may be intended,
// so judge those on a screenshot. Anything else is a defect.
() => {
  // The editor and present mode also carry frozen thumbnails; the preview has only its own canvas.
  const root =
    document.querySelector('[data-osd-canvas]:not([data-osd-freeze-motion])') ??
    document.querySelector('[data-osd-canvas]');
  if (!root) return [{ text: 'NO CANVAS', rect: [0, 0, 0, 0] }];
  const box = root.getBoundingClientRect();
  const k = box.width / 1920;
  const visible = (el) => {
    for (let e = el; e && e !== root; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.02)
        return false;
    }
    return true;
  };
  const clipBy = (el, r) => {
    let [l, t, ri, b] = [r.left, r.top, r.right, r.bottom];
    for (let e = el; e && e !== root; e = e.parentElement) {
      if (getComputedStyle(e).overflow === 'visible') continue;
      const c = e.getBoundingClientRect();
      if (c.width >= box.width - 1 && c.height >= box.height - 1) continue;
      [l, t, ri, b] = [
        Math.max(l, c.left),
        Math.max(t, c.top),
        Math.min(ri, c.right),
        Math.min(b, c.bottom),
      ];
    }
    return ri > l && b > t ? [l, t, ri, b] : null;
  };
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim();
    if (!text || !visible(n.parentElement)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width === 0 || r.height === 0) continue;
      const v = clipBy(n.parentElement, r);
      if (!v) continue;
      const c = [
        (v[0] - box.left) / k,
        (v[1] - box.top) / k,
        (v[2] - box.left) / k,
        (v[3] - box.top) / k,
      ];
      if (c[0] < -0.5 || c[1] < -0.5 || c[2] > 1920.5 || c[3] > 1080.5) {
        out.push({
          text: text.slice(0, 60),
          rect: c.map(Math.round),
          camera: !!n.parentElement.closest('[data-osd-camera]'),
        });
        break;
      }
    }
  }
  return out;
};
