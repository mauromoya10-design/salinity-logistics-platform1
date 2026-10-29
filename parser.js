/* Lector de órdenes SAP Business One (Saltwell AB) a partir de texto posicionado de pdf.js.
   items: [{x, y, w, str}] con y medido desde arriba de la página. */
(function (root) {
  'use strict';

  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  function parseNumber(s) {
    s = norm(s).replace(/[^\d.,-]/g, '');
    if (!s) return null;
    const lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    ene: 1, abr: 4, ago: 8, dic: 12, okt: 10, maj: 5 };
  function parseDate(s) {
    s = norm(s);
    let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = s.match(/(\d{1,2})[\s\-/.]+([A-Za-z]{3})[a-z]*[\s\-/.]+(\d{4})/);
    if (m && MONTHS[m[2].toLowerCase()]) return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    m = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
  }

  function linesFromItems(items, tol = 3) {
    const sorted = items.filter(i => norm(i.str)).slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const lines = [];
    for (const it of sorted) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - it.y) <= tol) last.items.push(it);
      else lines.push({ y: it.y, items: [it] });
    }
    for (const l of lines) {
      l.items.sort((a, b) => a.x - b.x);
      let txt = '', end = null;
      for (const it of l.items) {
        if (end !== null) txt += it.x - end > 12 ? '   ' : ' ';
        txt += norm(it.str);
        end = it.x + (it.w || 0);
      }
      l.text = txt;
    }
    return lines;
  }

  function parseSapOrder(items) {
    items = items.filter(i => norm(i.str)).map(i => ({ x: i.x, y: i.y, w: i.w || 0, str: norm(i.str) }));
    const find = (re, opts = {}) => items.find(i => (typeof re === 'string' ? i.str.toLowerCase() === re.toLowerCase() : re.test(i.str)) && (opts.maxY == null || i.y < opts.maxY) && (opts.minY == null || i.y > opts.minY));
    const sameY = (y, tol = 3) => items.filter(i => Math.abs(i.y - y) <= tol);
    const out = { docType: '', title: '', docNo: '', customerNo: '', arrivalDate: '', postingDate: '', shippingDate: '',
      deliveryAddress: [], customer: [], yourOrderNo: '', yourReference: '', ourReference: '', vatNo: '',
      paymentTerms: '', termsOfDelivery: '', transporter: '', lines: [], remarks: '', etdRemark: '', etaRemark: '', score: 0 };

    const title = find(/^(sales order|purchase order|order confirmation|orden de compra|nota de venta)$/i, { maxY: 120 });
    if (title) {
      out.title = title.str;
      const num = sameY(title.y).filter(i => i.x > title.x + title.w && /^[A-Z0-9-]{3,}$/i.test(i.str)).sort((a, b) => a.x - b.x)[0];
      if (num) { out.docNo = num.str; out.score += 3; }
    }

    const headerVal = label => {
      const l = find(label, { maxY: 150 });
      if (!l) return '';
      const v = items.filter(i => i.y > l.y + 4 && i.y < l.y + 26 && Math.abs(i.x - l.x) < 18).sort((a, b) => a.y - b.y)[0];
      return v ? v.str : '';
    };
    out.customerNo = headerVal('Customer no');
    out.arrivalDate = parseDate(headerVal('Arrival Date'));
    out.postingDate = parseDate(headerVal('Posting Date'));
    out.shippingDate = parseDate(headerVal('Shipping Date'));
    if (out.postingDate) out.score++;

    const KV_LABELS = ['Your order no.', 'Your reference', 'Our reference', 'VAT no', 'Payment Terms', 'Terms of Delivery', 'Transporter'];
    const firstKv = find('Your order no.');
    const kvTop = firstKv ? firstKv.y - 4 : 400;
    const labelItems = items.filter(i => KV_LABELS.some(k => k.toLowerCase() === i.str.toLowerCase()) && i.y < 400);
    const kv = label => {
      const l = labelItems.find(i => i.str.toLowerCase() === label.toLowerCase() && i.y >= kvTop - 2);
      if (!l) return '';
      const nextLabelX = Math.min(...labelItems.filter(o => Math.abs(o.y - l.y) <= 3 && o.x > l.x).map(o => o.x), 1e9);
      return sameY(l.y).filter(i => i.x > l.x + l.w + 3 && i.x < nextLabelX - 2).sort((a, b) => a.x - b.x).map(i => i.str).join(' ');
    };
    out.yourOrderNo = kv('Your order no.');
    out.yourReference = kv('Your reference');
    out.ourReference = kv('Our reference');
    out.vatNo = kv('VAT no');
    out.paymentTerms = kv('Payment Terms');
    out.termsOfDelivery = kv('Terms of Delivery');
    out.transporter = kv('Transporter');
    if (out.yourOrderNo) out.score++;

    const da = find('Delivery Address', { maxY: kvTop }), cu = find('Customer', { maxY: kvTop });
    const block = (label, xMin, xMax) => {
      if (!label) return [];
      const its = items.filter(i => i.y > label.y + 4 && i.y < kvTop && i.x >= xMin && i.x < xMax);
      return linesFromItems(its).map(l => l.text);
    };
    if (da || cu) {
      const split = cu && da ? cu.x - 5 : (cu ? cu.x - 5 : 1e9);
      out.deliveryAddress = block(da, da ? da.x - 5 : 0, split);
      out.customer = block(cu, cu ? cu.x - 5 : 0, 1e9);
    }

    // Tabla de ítems
    const hPos = find('Pos'), hItem = find('Item No');
    const footer = find(/^gross weight/i) || find(/^remarks:?$/i);
    if (hPos && hItem) {
      const hy = hPos.y;
      const headers = sameY(hy, 4).map(h => ({ key: h.str.toLowerCase(), x: h.x, r: h.x + h.w }));
      const endY = footer ? footer.y : 760;
      const rowStarts = items.filter(i => i.y > hy + 4 && i.y < endY && Math.abs(i.x - hPos.x) < 12 && /^\d+$/.test(i.str)).sort((a, b) => a.y - b.y);
      rowStarts.forEach((rs, idx) => {
        const nextY = idx + 1 < rowStarts.length ? rowStarts[idx + 1].y : endY;
        const row = { pos: rs.str, itemNo: '', description: '', weightKg: null, qty: null, unit: '', price: null, total: null };
        for (const it of sameY(rs.y)) {
          if (it === rs) continue;
          const numeric = /^[\d.,]+$/.test(it.str);
          let best = null, bd = 1e9;
          for (const h of headers) {
            const d = numeric && !h.key.startsWith('item') ? Math.abs((it.x + it.w) - h.r) : Math.abs(it.x - h.x);
            if (d < bd) { bd = d; best = h; }
          }
          if (!best) continue;
          if (best.key.startsWith('item')) row.itemNo = row.itemNo ? row.itemNo + ' ' + it.str : it.str;
          else if (best.key.startsWith('weight')) row.weightKg = parseNumber(it.str);
          else if (best.key.startsWith('quantity')) row.qty = parseNumber(it.str);
          else if (best.key.startsWith('unit')) row.unit = it.str;
          else if (best.key.startsWith('price')) row.price = parseNumber(it.str);
          else if (best.key.startsWith('total')) row.total = parseNumber(it.str);
        }
        const desc = linesFromItems(items.filter(i => i.y > rs.y + 3 && i.y < nextY && i.x >= hItem.x - 4 && i.x < (headers.find(h => h.key.startsWith('weight')) || { x: 1e9 }).x - 10))
          .map(l => l.text).filter(t => !/^your item no/i.test(t));
        row.description = desc[0] || '';
        if (row.itemNo) out.lines.push(row);
      });
      if (out.lines.length) out.score += 2;
    }

    const rem = find(/^remarks:?$/i);
    if (rem) {
      const stop = find(/^the general terms/i);
      const its = items.filter(i => i.y > rem.y + 3 && i.y < (stop ? stop.y - 2 : 760) && i.x < 300);
      const rl = linesFromItems(its).map(l => l.text);
      out.remarks = rl.join(' / ');
      for (const t of rl) {
        const m1 = t.match(/^ETD[:\s]+(.+)$/i); if (m1) out.etdRemark = parseDate(m1[1]);
        const m2 = t.match(/^ETA[:\s]+(.+)$/i); if (m2) out.etaRemark = parseDate(m2[1]);
      }
    }

    const custText = out.customer.join(' ').toLowerCase();
    out.docType = /saltwell\s+spa/.test(custText) ? 'intercompany' : 'customer';
    return out;
  }

  /* Divide líneas de dirección en {name, address, city, postal, country}. */
  function splitAddress(lines) {
    const L = lines.map(norm).filter(Boolean);
    const r = { name: '', address: '', city: '', postal: '', country: '' };
    if (!L.length) return r;
    r.country = L.length > 1 ? L[L.length - 1] : '';
    const body = L.slice(0, L.length > 1 ? -1 : undefined);
    const pcIdx = body.findIndex((l, i) => i > 0 && /\d/.test(l) && l.length <= 12);
    if (pcIdx > 0) { r.postal = body[pcIdx]; body.splice(pcIdx, 1); }
    r.name = body[0] || '';
    r.address = body[1] || '';
    r.city = body.slice(2).join(', ');
    return r;
  }


  /* ---------- Confirmación de booking de naviera ---------- */
  const CARRIERS = [['HAPAG', 'HAPAG LLOYD'], ['MAERSK', 'MAERSK'], ['MEDITERRANEAN SHIPPING', 'MSC'], ['MSC ', 'MSC'], ['COSCO', 'COSCO'], ['CMA CGM', 'CMA CGM'], ['WAN HAI', 'WAN HAI'], ['OCEAN NETWORK EXPRESS', 'ONE'], ['EVERGREEN', 'EVERGREEN'], ['ZIM ', 'ZIM'], ['HMM', 'HMM'], ['YANG MING', 'YANG MING'], ['OOCL', 'OOCL'], ['HAMBURG SUD', 'HAMBURG SUD']];
  function containerTypeFrom(code) {
    const c = norm(code).toUpperCase().replace(/[\s']/g, '');
    if (!c) return '';
    if (/^(45|4H|40HC|40HQ|40HIGH)/.test(c) || /HC|HQ|HIGH/.test(c)) return "40'"; // 40' HC se homologa a 40'
    if (/^(40|42|4G|4D)/.test(c)) return "40'";
    if (/^(20|22|2G|2D)/.test(c)) return "20'";
    return '';
  }
  function parseBooking(pages, fileName) {
    const items = [], all = [];
    pages.forEach((p, pi) => p.items.forEach(i => { const it = { x: i.x, y: i.y + pi * 2000, w: i.w || 0, str: norm(i.str) }; if (it.str) items.push(it); }));
    const lines = linesFromItems(items).map(l => l.text);
    const text = lines.join('\n');
    const out = { bookingRef: '', carrier: '', forwarder: '', vessel: '', voyage: '', etd: '', eta: '', pol: '', pod: '', equipment: [], containerType: '',
      stackingStart: '', stackingEnd: '', siCutoff: '', vgmCutoff: '', blNo: '', issued: '', score: 0 };
    const find = re => items.find(i => re.test(i.str));
    const col = (label, maxDy = 70) => {
      const l = find(label); if (!l) return [];
      const right = Math.min(...items.filter(o => Math.abs(o.y - l.y) <= 3 && o.x > l.x + 5).map(o => o.x), 1e9);
      return linesFromItems(items.filter(i => i.y > l.y + 4 && i.y < l.y + maxDy && i.x >= l.x - 5 && i.x < right - 3)).map(x => x.text);
    };
    const DATE = /(\d{1,2}[-\s/.][A-Za-z]{3}[-\s/.]\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{4})/;
    // N° de booking
    let m = text.match(/(?:N[úu]mero de reserva|Booking (?:No\.?|Number|Ref(?:erence)?\.?)|Booking N°|N° de reserva)\s*:?\s*((?=[A-Z0-9]*\d)[A-Z0-9]{6,})/i);
    if (m) out.bookingRef = m[1];
    if (!out.bookingRef) { const lb = find(/n[úu]mero de reserva|booking (no|number)/i); if (lb) { const v = items.filter(i => i.y > lb.y && i.y < lb.y + 30 && Math.abs(i.x - lb.x) < 25 && /^[A-Z0-9]{6,}$/.test(i.str))[0]; if (v) out.bookingRef = v.str; } }
    if (!out.bookingRef && fileName) { const f = String(fileName).match(/(\d{8,}|[A-Z]{3,4}\d{8,})/); if (f) out.bookingRef = f[1]; }
    // Naviera
    const head = lines.slice(0, 8).join(' ').toUpperCase() + ' ' + text.toUpperCase().slice(0, 4000);
    const car = CARRIERS.find(c => head.includes(c[0])); if (car) out.carrier = car[1];
    // Forwarder (quien reserva)
    const rec = col(/^(recibido de|received from|booked by|shipper)$/i, 40);
    if (rec[0]) out.forwarder = rec[0].split('   ')[0];
    // Origen / destino / nave (columnas)
    const parsePort = arr => {
      const rest = arr.filter(t => !DATE.test(t));
      if (!rest.length) return '';
      let p = rest[0];
      if (rest[1] && /^[A-Z .]{2,12}$/.test(rest[1]) && !/^(DPW|DP WORLD)/.test(rest[1]) && rest[1].split(' ').length <= 2 && rest[0].length > 15) p += ' ' + rest[1];
      return p.replace(/^[A-Z]{2}[A-Z0-9]{3}\s+/, '').trim();
    };
    const from = col(/^(desde|from)$/i, 60), to = col(/^(para|to)$/i, 60), ves = col(/^(buque|vessel|vessel\/voyage)$/i, 50);
    if (from.length) { const d = from.find(t => DATE.test(t)); if (d) out.etd = parseDate(d.match(DATE)[1]); out.pol = parsePort(from); }
    if (to.length) { const d = to.find(t => DATE.test(t)); if (d) out.eta = parseDate(d.match(DATE)[1]); out.pod = parsePort(to); }
    if (ves.length) out.vessel = ves[0].split('   ')[0];
    m = text.match(/Voy\.?\s*No\.?\s*:?\s*([A-Z0-9]{3,8})/i) || text.match(/(?:^|[^A-Z])Voyage\s*(?:No\.?)?\s*:?\s*([A-Z0-9]{3,8})/i); if (m) out.voyage = m[1];
    if (!out.vessel) { m = text.match(/(?:Vessel|Buque|Nave)\s*:?\s*([A-Z][A-Z .]{3,30})/); if (m) out.vessel = norm(m[1]); }
    if (!out.etd) { m = text.match(/(?:ETD|Departure|Zarpe)\s*:?\s*/i); if (m) { const d = text.slice(m.index, m.index + 60).match(DATE); if (d) out.etd = parseDate(d[1]); } }
    if (!out.eta) { m = text.match(/(?:ETA|Arrival|Arribo)\s*:?\s*/i); if (m) { const d = text.slice(m.index, m.index + 60).match(DATE); if (d) out.eta = parseDate(d[1]); } }
    // Equipos
    const eqRe = /(\d+)\s*x\s*(\d{2}[A-Z]{1,2}\d?|\d{2}'\s?(?:DV|HC|GP|HQ|ST)?)/gi;
    let e; const seen = new Set();
    while ((e = eqRe.exec(text))) { const k = e[1] + 'x' + e[2].toUpperCase(); if (seen.has(k)) continue; seen.add(k); out.equipment.push({ qty: +e[1], type: e[2].toUpperCase() }); }
    if (out.equipment[0]) out.containerType = containerTypeFrom(out.equipment[0].type);
    // Plazos
    const after = re => { const mm = text.match(re); if (!mm) return ''; const d = text.slice(mm.index, mm.index + 80).match(DATE); return d ? parseDate(d[1]) : ''; };
    out.stackingEnd = after(/(FCL delivery date|Cut[- ]?off (?:CY|FCL|port|terminal)|CY cut[- ]?off|Cierre (?:de )?stacking|Port cut[- ]?off|Last (?:possible )?delivery)/i);
    out.stackingStart = after(/(Earliest (?:container )?(?:delivery|receiving|return)|Stacking (?:start|opens?|from)|Inicio (?:de )?stacking|Apertura (?:de )?stacking|ERD|Early return)/i);
    out.siCutoff = after(/(Shipping instruction(?:s)? clos|SI cut[- ]?off|Documentation cut[- ]?off|Doc(?:s)? cut[- ]?off)/i);
    out.vgmCutoff = after(/VGM cut[- ]?off/i);
    m = text.match(/(?:No\.? de BL(?:\/SWB)?|B\/L No\.?|BL No\.?|BL\/SWB No\.?)\s*:?\s*([A-Z]{4}[A-Z0-9]{6,})/i); if (m) out.blNo = m[1];
    m = text.match(/(?:Fecha de emisi[oó]n|Issue date|Date of issue)\s*:?\s*/i); if (m) { const d = text.slice(m.index, m.index + 50).match(DATE); if (d) out.issued = parseDate(d[1]); }
    out.score = (out.bookingRef ? 3 : 0) + (out.vessel ? 1 : 0) + (out.etd ? 1 : 0) + (out.eta ? 1 : 0) + (out.equipment.length ? 1 : 0);
    out.text = text;
    return out;
  }


  /* ---------- Bill of Lading (draft / final) ---------- */
  const contKey = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  function parseBL(pages, fileName) {
    let items = [];
    pages.forEach((p, pi) => p.items.forEach(i => { const it = { x: i.x, y: i.y + pi * 2000, w: i.w || 0, str: norm(i.str) }; if (it.str) items.push(it); }));
    // marca de agua DRAFT: letras sueltas D R A F T en la misma columna
    const letters = items.filter(i => /^[DRAFT]$/.test(i.str));
    let watermark = false;
    for (const l of letters) {
      const same = letters.filter(o => Math.abs(o.x - l.x) < 3);
      const word = same.sort((a, b) => a.y - b.y).map(o => o.str).join('');
      if (word.includes('DRAFT')) { watermark = true; items = items.filter(i => !same.includes(i)); break; }
    }
    const lines = linesFromItems(items).map(l => l.text);
    const text = lines.join('\n');
    const out = { blNo: '', reference: '', kind: '', vessel: '', pol: '', pod: '', placeDelivery: '', onboardDate: '', issueDate: '', issuePlace: '', freight: '', notify: [],
      containers: [], grossTotal: null, score: 0 };
    const find = re => items.find(i => re.test(i.str));
    const col = (label, maxDy = 30) => {
      const l = find(label); if (!l) return [];
      const right = Math.min(...items.filter(o => Math.abs(o.y - l.y) <= 3 && o.x > l.x + 5).map(o => o.x), 1e9);
      return linesFromItems(items.filter(i => i.y > l.y + 4 && i.y < l.y + maxDy && i.x >= l.x - 8 && i.x < right - 3)).map(x => x.text);
    };
    let m = text.match(/B\s?\/?\s?L\s*No\.?\s*:?\s*([A-Z0-9][A-Z0-9/\-]{4,})/i); if (m) out.blNo = m[1];
    m = text.match(/Reference\s*No\.?\s*:?\s*(\S+)/i); if (m) out.reference = m[1];
    out.vessel = (col(/^vessel$/i)[0] || '').split('   ')[0];
    out.pol = (col(/^port of loading$/i)[0] || '').split('   ')[0];
    out.pod = (col(/^port of discharge$/i)[0] || '').split('   ')[0];
    out.placeDelivery = (col(/^place of delivery/i)[0] || '').split('   ')[0];
    out.freight = (col(/^freight payable at$/i)[0] || '').split('   ')[0];
    const notify = col(/^notify (address|party)$/i, 60); out.notify = notify.map(t => t.split('   ')[0]).slice(0, 4);
    m = text.match(/Shipped on board[\s\S]{0,120}?Date\s+(\d{1,2}[-\s][A-Za-z]+[-\s]\d{4})/i); if (m) out.onboardDate = parseDate(m[1]);
    const iss = col(/^place and date of issue$/i); if (iss[0]) { const d = iss[0].match(/(\d{1,2}[-\s][A-Za-z]+[-\s]\d{4})/); if (d) { out.issueDate = parseDate(d[1]); out.issuePlace = iss[0].slice(0, iss[0].indexOf(d[1])).trim(); } }
    if (/FREIGHT\s+COLLECT/i.test(text)) out.freightTerms = 'COLLECT'; else if (/FREIGHT\s+PREPAID/i.test(text)) out.freightTerms = 'PREPAID';
    // contenedores
    const cre = /Container\s*:?\s*([A-Z]{4})\s*([0-9]{6})\s*-?\s*([0-9])\s*\(([^)]*)\)\s*Seal\s*:?\s*([A-Z0-9\-]+)/gi;
    let c;
    while ((c = cre.exec(text))) {
      const key = contKey(c[1] + c[2] + c[3]);
      if (out.containers.find(x => x.key === key)) continue;
      out.containers.push({ key, containerNo: `${c[1]}${c[2]}-${c[3]}`, type: norm(c[4]), seal: c[5], po: '', so: '', bags: null, gross: null });
    }
    // datos por contenedor en la descripción de la mercadería
    const goodsStart = Math.max(0, text.search(/Marks and Nos/i));
    const goods = text.slice(goodsStart);
    const keysRe = out.containers.map(x => x.key);
    const compactGoods = goods; // buscar cada contenedor (con o sin espacio/guión)
    const positions = out.containers.map(x => {
      const re = new RegExp(x.key.slice(0, 4) + '\\s*' + x.key.slice(4, 10) + '\\s*-?\\s*' + x.key.slice(10), 'g');
      const idx = []; let mm; while ((mm = re.exec(compactGoods))) idx.push(mm.index);
      return { x, idx };
    });
    // usar la ocurrencia que tiene "PO" después (lista adjunta o cuerpo)
    const allIdx = positions.flatMap(p => p.idx.map(i => ({ i, x: p.x }))).sort((a, b) => a.i - b.i);
    allIdx.forEach((p, k) => {
      const seg = compactGoods.slice(p.i, k + 1 < allIdx.length ? allIdx[k + 1].i : p.i + 900);
      const po = seg.match(/\bPO(?:\s*REF)?\s*[:#.]?\s*(\d{4,})/i); if (po && !p.x.po) p.x.po = po[1];
      const so = seg.match(/SALES\s*OR?DER\s*REF\s*[:#.]?\s*(\d{4,})/i); if (so && !p.x.so) p.x.so = so[1];
      const bg = seg.match(/([\d.,]+)\s*BAGS/i); if (bg && p.x.bags == null) p.x.bags = parseNumber(bg[1]);
      const gw = seg.match(/TOTAL\s*GROSS\s*WEIGHT\s*:?\s*([\d.,]+)/i); if (gw && p.x.gross == null) p.x.gross = parseNumber(gw[1]);
      const sl = seg.match(/(?:SELLO|SEAL|S)\s*:\s*([A-Z0-9\-]+)/i); if (sl && !p.x.sealText) p.x.sealText = sl[1];
    });
    m = text.match(/([\d.,]+)\s*KG/i); if (m) out.grossTotal = parseNumber(m[1]);
    out.kind = watermark || /\bDRAFT\b/.test(text) ? 'draft' : (/final|non[- ]?neg|no negociable/i.test(fileName || '') || /NOT NEGOTIABLE|NON[- ]NEGOTIABLE/i.test(text) ? 'final' : (/draft/i.test(fileName || '') ? 'draft' : 'final'));
    out.watermark = watermark;
    out.score = (out.blNo ? 3 : 0) + (out.containers.length ? 2 : 0) + (out.vessel ? 1 : 0) + (out.pol ? 1 : 0);
    return out;
  }

  const api = { parseBL, contKey, parseBooking, containerTypeFrom, parseSapOrder, linesFromItems, parseNumber, parseDate, splitAddress, norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SapParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
