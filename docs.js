/* Generación de documentos PDF (Draft PL, Proforma, Packing List, ISF, Booking) con jsPDF.
   Reproduce el formato de las hojas del Excel Ventas_Contenedores. */
(function () {
  'use strict';

  // Helvetica de jsPDF sólo cubre WinAnsi: reemplazamos caracteres fuera de ese rango.
  const MAP = { 'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ł': 'l', 'Ł': 'L', 'ő': 'o', 'ű': 'u', 'č': 'c', 'Č': 'C', 'ř': 'r', 'ž': 'z', 'š': 's', 'ć': 'c', '’': "'", '‘': "'", '“': '"', '”': '"', '—': '-', '–': '-', ' ': ' ' };
  const T = v => String(v == null ? '' : v).replace(/[^\x00-\xff]/g, c => MAP[c] || (c.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\xff]/g, '?')));

  const fmt = (n, d = 2) => (n == null || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtDate = s => {
    if (!s) return '';
    const [y, m, d] = s.split('-').map(Number);
    return `${m}/${d}/${y}`;
  };

  const INK = [30, 30, 30], MUTED = [90, 90, 90], LINE = [120, 120, 120];
  const L = 12, R = 198; // márgenes

  function newDoc() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.setTextColor(...INK);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    return doc;
  }
  function txt(doc, s, x, y, o = {}) {
    doc.setFont('helvetica', o.bold ? 'bold' : (o.italic ? 'italic' : 'normal'));
    if (o.boldItalic) doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(o.size || 8);
    doc.setTextColor(...(o.color || INK));
    const opts = {};
    if (o.align) opts.align = o.align;
    if (o.maxWidth) opts.maxWidth = o.maxWidth;
    doc.text(T(s), x, y, opts);
  }
  function header(doc, title, number, year) {
    const B = window.BRAND;
    doc.addImage(B.logo, 'PNG', L, 8, 60, 60 / B.logoRatio, 'logo', 'FAST');
    txt(doc, `${title} N° ${number}`, 96, 20, { bold: true, size: 13 });
    if (year) txt(doc, `Year ${year}`, 172, 20, { bold: true, size: 13 });
  }
  function parties(doc, y, cols) {
    // cols: [{title, lines:[]}, ...] en x = 12, 62, 120
    const xs = [L, 62, 120];
    cols.forEach((c, i) => {
      txt(doc, c.title, xs[i], y, { bold: true, size: 7.5 });
      c.lines.filter(v => v !== null && v !== undefined).forEach((ln, j) => txt(doc, ln, xs[i], y + 4.2 + j * 3.6, { size: 7, color: j === 0 && i > 0 ? INK : INK, maxWidth: i === 2 ? 76 : 48 }));
    });
  }
  function shipperLines(S) {
    return [S.shipperName, S.shipperAddress, S.shipperCity, S.shipperCountry, S.shipperRut, S.shipperEmail];
  }
  function consigneeLines(S) {
    return [S.consigneeName, S.consigneeAddress, S.consigneeCity, S.consigneeCountry];
  }
  function customerLines(c, name) {
    if (!c) return [name || ''];
    return [c.name, c.address, [c.city, c.postal].filter(Boolean).join(' '), c.country];
  }
  function refs(doc, y, sh) {
    txt(doc, `Sales order Ref: ${sh.soRef || ''}`, L, y, { bold: true, size: 7.5 });
    txt(doc, `Customer Ref: ${sh.customerRef || ''}`, L, y + 4.2, { bold: true, size: 7.5 });
    txt(doc, `PO Ref: ${sh.poRef || ''}`, L, y + 8.4, { bold: true, size: 7.5 });
  }
  function rightPair(doc, y, label, value) {
    txt(doc, label, 150, y, { bold: true, size: 7.5, align: 'right' });
    txt(doc, value || '', 151.5, y, { bold: true, size: 7.5 });
  }

  /* Tabla principal de ítems. cols: [{label, w, align, get}] */
  function itemsTable(doc, y, cols, rows, minBodyH) {
    const x0 = L, W = R - L;
    const hH = 5;
    // encabezado: primera fila (labels de cantidades) a la derecha, segunda fila Item / Description
    doc.setLineWidth(0.25);
    doc.rect(x0, y, W, hH * 2);
    let x = x0;
    cols.forEach((c, i) => {
      if (i >= 2) {
        doc.line(x, y, x, y + hH);
        txt(doc, c.label, x + c.w - 1.2, y + 3.5, { size: 6.8, align: 'right' });
      }
      x += c.w;
    });
    doc.line(x0 + cols[0].w + cols[1].w, y + hH, R, y + hH);
    doc.line(x0, y + hH, x0 + cols[0].w + cols[1].w, y + hH);
    txt(doc, cols[0].label, x0 + 1, y + hH + 3.5, { bold: true, size: 7 });
    txt(doc, cols[1].label, x0 + cols[0].w + 1, y + hH + 3.5, { bold: true, size: 7 });
    let by = y + hH * 2;
    const bodyStart = by;
    rows.forEach(r => {
      by += 4.2;
      let cx = x0;
      cols.forEach((c, i) => {
        const v = c.get(r);
        if (c.align === 'right') txt(doc, v, cx + c.w - 1.2, by, { size: 7, align: 'right' });
        else if (c.align === 'center') txt(doc, v, cx + c.w / 2, by, { size: 7, align: 'center' });
        else txt(doc, v, cx + 1, by, { size: 7, bold: i === 0, maxWidth: c.w - 2 });
        cx += c.w;
      });
      if (r._batch !== undefined) {
        by += 3.8;
        txt(doc, `Batch N°: ${r._batch || ''}`, x0 + 1, by, { size: 6.5, color: MUTED, maxWidth: W - 2 });
      }
      by += 1.2;
    });
    const end = Math.max(by + 3, bodyStart + (minBodyH || 34));
    doc.rect(x0, bodyStart, W, end - bodyStart);
    return end;
  }

  function boxRows(doc, yTop, rows, xLabelRight, xBox, wBox) {
    // filas etiqueta (alineada a la derecha) + caja con valor
    let y = yTop;
    rows.forEach(r => {
      const h = 4.6;
      doc.rect(xBox - 46, y, 46 + wBox, h);
      doc.line(xBox, y, xBox, y + h);
      txt(doc, r[0], xBox - 1, y + 3.3, { size: 7, align: 'right', bold: !!r[2] });
      txt(doc, r[1], xBox + wBox - 1, y + 3.3, { size: 7, align: 'right', bold: !!r[2] });
      y += h;
    });
    return y;
  }

  function packagesBox(doc, y, t, palletWeight, extraRows) {
    const x = 120, w1 = 27, w2 = 16, w3 = 14;
    doc.rect(x, y, w1, 9.2);
    txt(doc, 'Total Packages:', x + w1 / 2, y + 5.6, { size: 7, align: 'center' });
    doc.rect(x + w1, y, w2, 4.6); doc.rect(x + w1, y + 4.6, w2, 4.6);
    doc.rect(x + w1 + w2, y, w3, 4.6); doc.rect(x + w1 + w2, y + 4.6, w3, 4.6);
    txt(doc, fmt(t.pallets, t.pallets % 1 ? 1 : 0), x + w1 + w2 / 2, y + 3.3, { size: 7, align: 'center' });
    txt(doc, fmt(t.bags, 0), x + w1 + w2 / 2, y + 7.9, { size: 7, align: 'center' });
    txt(doc, 'Pallets', x + w1 + w2 + 1, y + 3.3, { size: 7 });
    txt(doc, 'Bags', x + w1 + w2 + 1, y + 7.9, { size: 7 });
    let yy = y + 9.2;
    (extraRows || []).concat([['Pallets Weight (kg)', fmt(palletWeight, 1)]]).forEach(r => {
      doc.rect(x, yy, w1, 4.6); doc.rect(x + w1, yy, w2, 4.6);
      txt(doc, r[0], x + w1 - 1, yy + 3.3, { size: 7, align: 'right' });
      txt(doc, r[1], x + w1 + w2 / 2, yy + 3.3, { size: 7, align: 'center' });
      yy += 4.6;
    });
    return yy;
  }

  function footer(doc, y, S, useSignature) {
    const lines = [S.shipperName, S.footerAddress1, S.footerAddress2, S.shipperCountryTitle || 'Chile', `VAT N°: ${S.vatNo || ''}`];
    lines.forEach((l, i) => txt(doc, l, L, y + i * 4, { size: 7.5 }));
    const B = window.BRAND;
    if (useSignature && S.showSignature !== false) doc.addImage(B.signature, 'PNG', 132, y - 13, 26, 26 / B.sigRatio, 'sig', 'FAST');
    doc.setLineWidth(0.3);
    doc.line(122, y + 10.5, 170, y + 10.5);
    txt(doc, S.signatoryName, 146, y + 13.5, { boldItalic: true, size: 7.5, align: 'center' });
    txt(doc, S.signatoryTitle, 146, y + 17.5, { boldItalic: true, size: 7.5, align: 'center' });
  }

  function packingDoc(kind, ctx) {
    const { sh, S, customer, t, palletWeight } = ctx;
    const doc = newDoc();
    const isFinal = kind === 'pl';
    header(doc, isFinal ? 'Packing List' : 'Draft  Packing List', sh.n, sh.year);
    parties(doc, 40, [
      { title: 'Shipper', lines: shipperLines(S) },
      { title: 'Consignee', lines: consigneeLines(S) },
      { title: 'Notify / Delivery address', lines: customerLines(customer, sh.finalCustomer) }
    ]);
    let y = 74;
    refs(doc, y, sh);
    rightPair(doc, y, 'Port of loading:', sh.pol);
    rightPair(doc, y + 4.2, 'Port of discharge:', sh.pod);
    y += 14;
    if (isFinal) {
      txt(doc, `Vessel°:  ${sh.vessel || ''}`, 92, y, { bold: true, size: 9, align: 'right' });
      txt(doc, `BL N°:  ${sh.blNo || ''}`, 150, y, { bold: true, size: 9 });
      y += 4.6;
    }
    txt(doc, `Container N°:  ${sh.containerNo || '-'}`, 92, y, { bold: true, size: 9, align: 'right' });
    txt(doc, `Seal N°:  ${sh.sealNo || '-'}`, 150, y, { bold: true, size: 9 });
    txt(doc, `Type: ${sh.containerType || ''}`, R, y, { bold: true, size: 9, align: 'right' });
    y += 2;
    const rows = (sh.items || []).map(it => Object.assign({}, it, { _batch: it.batch || '' }));
    const end = itemsTable(doc, y, [
      { label: 'Item', w: 30, get: r => r.item },
      { label: 'Item Description', w: 82, get: r => r.description },
      { label: 'Quantity (bags)', w: 26, align: 'center', get: r => fmt(r.qty, 0) },
      { label: 'Total kg / bag', w: 24, align: 'center', get: r => fmt(r.kgPerBag, 2) },
      { label: 'Total Weight (kg)', w: 24, align: 'right', get: r => fmt((r.qty || 0) * (r.kgPerBag || 0), 2) }
    ], rows, 40);
    const totRows = [
      ['Total Weight (kg):', fmt(t.net)],
      ['Total pallets weight (kg):', fmt(t.palletsKg)],
      ['Gross Weight (kg):', fmt(t.gross)],
      ['Tare of container (kg):', sh.tare ? fmt(sh.tare) : '-']
    ];
    if (isFinal) totRows.push(['Verified Gross Mass (VGM) (kg):', fmt(t.vgm), true]);
    const yTot = boxRows(doc, end + 1, totRows, 0, 174, 24);
    let ly = yTot + 4;
    txt(doc, `Delivery Terms: ${sh.deliveryTerms || ''}`, L, ly, { bold: true, size: 7.5 });
    txt(doc, `Booking reference: ${sh.bookingRef || ''}`, L, ly + 4.4, { bold: true, size: 7.5 });
    txt(doc, `Pallet Dimensions: ${sh.pallet || ''}`, L, ly + 8.8, { bold: true, size: 7.5 });
    txt(doc, `Country of Origin: ${S.origin || 'Chile'}`, L, ly + 13.2, { bold: true, size: 7.5 });
    packagesBox(doc, ly + 1, t, palletWeight);
    const fy = ly + 30;
    footer(doc, fy, S, true);
    if (isFinal) {
      const by = fy + 25;
      doc.setLineWidth(0.3);
      doc.rect(L, by, R - L - 50, 26);
      const decl = [
        `The exporter of the products covered by this document (Export reference N° ${S.exportRef || ''})`,
        'declares that, except where otherwise clearly indicated, these products are of Chilean',
        'Preferential origin.'
      ];
      decl.forEach((l, i) => txt(doc, l, L + 1.5, by + 4.5 + i * 4, { bold: true, size: 7.5 }));
      txt(doc, '(Name of the exporter)', L + 1.5, by + 18, { size: 7 });
      txt(doc, '(Place and date)', 72, by + 18, { size: 7 });
      txt(doc, S.shipperName, L + 1.5, by + 22.5, { size: 7.5 });
      txt(doc, `${S.originPlace || 'Chile'},  ${fmtDate(ctx.today)}`, 72, by + 22.5, { size: 7.5 });
    }
    return doc;
  }

  function proformaDoc(ctx) {
    const { sh, S, customer, t, palletWeight } = ctx;
    const doc = newDoc();
    header(doc, 'Proforma Invoice', sh.n, sh.year);
    parties(doc, 40, [
      { title: 'Shipper', lines: shipperLines(S) },
      { title: 'Customer', lines: consigneeLines(S) },
      { title: 'Delivery address / Ship to', lines: customerLines(customer, sh.finalCustomer) }
    ]);
    let y = 74;
    refs(doc, y, sh);
    rightPair(doc, y, 'ETD:', fmtDate(sh.etd));
    rightPair(doc, y + 4.2, 'ETA:', fmtDate(sh.eta));
    rightPair(doc, y + 8.4, 'Port of loading:', sh.pol);
    rightPair(doc, y + 12.6, 'Port of discharge:', sh.pod);
    y += 18.5;
    txt(doc, `Container Type: ${sh.containerType || ''}`, R, y, { bold: true, size: 9, align: 'right' });
    y += 2;
    const cur = S.currency || 'USD';
    const end = itemsTable(doc, y, [
      { label: 'Item', w: 30, get: r => r.item },
      { label: 'Item Description', w: 82, get: r => r.description },
      { label: 'Quantity (bags)', w: 26, align: 'center', get: r => fmt(r.qty, 0) },
      { label: `Unit Price ${cur}`, w: 24, align: 'center', get: r => fmt(r.price, 2) },
      { label: 'Total Amount', w: 24, align: 'right', get: r => fmt(Math.round((r.qty || 0) * (r.price || 0)), 2) }
    ], sh.items || [], 30);
    let yb = boxRows(doc, end + 1, [['Total $', fmt(t.amount), true]], 0, 174, 24);
    yb = boxRows(doc, yb + 4, [['Currency', cur]], 0, 174, 24);
    let ly = yb + 7;
    const left = [
      `Delivery Terms: ${sh.deliveryTerms || ''}`,
      `Booking reference: ${sh.bookingRef || ''}`,
      `Pallet Dimensions: ${sh.pallet || ''}`,
      `Country of Origin: ${S.origin || 'Chile'}`,
      `Modalidad de Venta: ${sh.salesMode || ''}`,
      `Forma de pago: ${sh.paymentTerms || ''}`
    ];
    left.forEach((l, i) => txt(doc, l, L, ly + i * 4.4, { bold: true, size: 7.5 }));
    packagesBox(doc, yb + 3, t, palletWeight, [['Total (kg):', fmt(t.net)]]);
    footer(doc, ly + 36, S, true);
    return doc;
  }

  function isfDoc(ctx) {
    const { sh, S, customer } = ctx;
    const doc = newDoc();
    const B = window.BRAND;
    doc.addImage(B.logo, 'PNG', L, 8, 60, 60 / B.logoRatio, 'logo', 'FAST');
    txt(doc, `ISF Form N° ${sh.n}`, 120, 24, { bold: true, size: 13 });
    let y = 44;
    refs(doc, y, sh);
    rightPair(doc, y, 'Container N°:', sh.containerNo);
    rightPair(doc, y + 4.2, 'ETD:', fmtDate(sh.etd));
    rightPair(doc, y + 8.4, 'ETA:', fmtDate(sh.eta));
    y += 16;
    const cAddr = customer ? [customer.address, customer.city, customer.postal, customer.country].filter(Boolean).join(', ') : '';
    const cName = customer ? customer.name : (sh.finalCustomer || '');
    const mfr = [S.isfManufacturerName || S.shipperName, S.isfManufacturerAddress];
    const rows = [
      ['1', 'Manufacturer Name', 'Name and address of manufacturer', mfr],
      ['2', 'Seller Name', 'Shipper and/or Selling Agency Name and address', [S.consigneeName, S.isfSellerAddress]],
      ['3', 'Buyer Name', 'Name and address of entity the goods are sold (Mostly Importers)', [cName, cAddr]],
      ['4', 'Ship to address', 'Name and address of the first deliver-to party scheduled to physically receive the goods after the goods have been released from customs custody', [cName, cAddr]],
      ['5', 'Container Stuffing Location', 'Name and address(es) of the physical location(s) where the goods were stuffed into the container. For LCL: Shipper Name and address. For LCL: Forwarder CFS Warehouse', mfr],
      ['6', 'Consolidator Stuffing Location', 'Name and address of the party who stuffed the container or arranged for the stuffing of the container. For FCL: Shipper Name & Address. For LCL: Name & address of Consolidating Forwarder.', mfr],
      ['7', 'Importer of Record Number', 'IRS or CAS Number of Importer', [S.isfImporterNumber]],
      ['8', 'Consignee Number', 'IRS # of Ultimate Consignee', [S.consigneeName, S.isfSellerAddress]],
      ['9', 'Country of Origin', 'Origin of Goods', [S.origin || 'Chile']],
      ['10', 'USHTS Number', 'US Schedule B or USHTS Number', [S.isfHts]],
      ['A', 'ISF Bond Filer', 'IRS# of ISF Filer', [S.isfFiler]],
      ['B', 'Bill of Lading Number', 'For FCL: AMS Master B/L#   For LCL: AMS House B/L#', [sh.blNo]]
    ];
    const xs = [L, L + 10, L + 50, L + 116], ws = [10, 40, 66, R - L - 116];
    doc.setFillColor(232, 240, 236);
    doc.rect(L, y, R - L, 7, 'F');
    doc.rect(L, y, R - L, 7);
    ['Item', 'Data Element', 'Description', 'Information'].forEach((h, i) => txt(doc, h, xs[i] + 1.5, y + 4.8, { bold: true, size: 9 }));
    y += 7;
    doc.setFontSize(7);
    rows.forEach(r => {
      const descLines = doc.splitTextToSize(T(r[2]), ws[2] - 3);
      const infoLines = r[3].filter(Boolean).flatMap(v => doc.splitTextToSize(T(v), ws[3] - 3));
      const elLines = doc.splitTextToSize(T(r[1]), ws[1] - 3);
      const h = Math.max(7, 3.3 * Math.max(descLines.length, infoLines.length, elLines.length) + 3);
      doc.rect(L, y, R - L, h);
      for (let i = 1; i < 4; i++) doc.line(xs[i], y, xs[i], y + h);
      txt(doc, r[0], xs[0] + ws[0] / 2, y + 4.5, { size: 8, align: 'center' });
      elLines.forEach((l, i) => txt(doc, l, xs[1] + 1.5, y + 4.3 + i * 3.3, { size: 7.5, bold: true }));
      descLines.forEach((l, i) => txt(doc, l, xs[2] + 1.5, y + 4.3 + i * 3.3, { size: 7, color: MUTED }));
      infoLines.forEach((l, i) => txt(doc, l, xs[3] + 1.5, y + 4.3 + i * 3.3, { size: 7.5 }));
      y += h;
    });
    return doc;
  }

  function bookingDoc(ctx) {
    const { list, S } = ctx; // list: [{sh, customer, t}]
    const doc = newDoc();
    const B = window.BRAND;
    doc.addImage(B.logo, 'PNG', L, 8, 60, 60 / B.logoRatio, 'logo', 'FAST');
    txt(doc, 'BOOKING REQUEST', R, 20, { bold: true, size: 13, align: 'right' });
    txt(doc, `${S.shipperName} · ${fmtDate(ctx.today)}`, R, 25, { size: 8, align: 'right', color: MUTED });
    let y = 40;
    list.forEach(({ sh, customer, t }, idx) => {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFillColor(232, 240, 236);
      doc.rect(L, y, R - L, 6.5, 'F');
      txt(doc, `Container ${idx + 1} of ${list.length}  ·  N° ${sh.n}/${sh.year}`, L + 2, y + 4.4, { bold: true, size: 8.5 });
      y += 10;
      const pairs = [
        ['Sales Order Ref', sh.soRef], ['ETD', fmtDate(sh.etd)],
        ['Customer Ref', sh.customerRef], ['ETA', fmtDate(sh.eta)],
        ['PO Ref (SWAB)', sh.poRef], ['Port of Loading', sh.pol],
        ['Booking Reference', sh.bookingRef], ['Port of Discharge', sh.pod],
        ['Delivery Terms CL', sh.deliveryTerms], ['Type Container', sh.containerType],
        ['Delivery Terms Destino Final', sh.destIncoterm], ['Modalidad Venta', sh.salesMode],
        ['Forma de Pago', sh.paymentTerms], ['Forwarder', sh.forwarder]
      ];
      for (let i = 0; i < pairs.length; i += 2) {
        [0, 1].forEach(k => {
          const p = pairs[i + k]; if (!p) return;
          const x = k ? 110 : L;
          txt(doc, p[0], x, y, { size: 7, color: MUTED });
          txt(doc, p[1] || '-', x + 40, y, { size: 7.5, bold: true, maxWidth: 46 });
        });
        y += 4.6;
      }
      y += 2;
      txt(doc, 'Customer / Consignee', L, y, { bold: true, size: 8 });
      customerLines(customer, sh.finalCustomer).forEach((l, i) => txt(doc, l, L, y + 4 + i * 3.6, { size: 7.5 }));
      y += 4 + 4 * 3.6 + 2;
      const end = itemsTable(doc, y, [
        { label: 'Item', w: 26, get: r => r.item },
        { label: 'Item Description', w: 70, get: r => r.description },
        { label: 'Qty (bags)', w: 22, align: 'center', get: r => fmt(r.qty, 0) },
        { label: 'KG x Bag', w: 20, align: 'center', get: r => fmt(r.kgPerBag, 2) },
        { label: 'Total Weight (kg)', w: 24, align: 'right', get: r => fmt((r.qty || 0) * (r.kgPerBag || 0), 2) },
        { label: 'Gross (kg)', w: 24, align: 'right', get: r => fmt(r._gross, 2) }
      ], (sh.items || []).map(it => Object.assign({}, it, { _gross: (it.qty || 0) * (it.kgPerBag || 0) + (it.bagsPerPallet ? (it.qty / it.bagsPerPallet) * (ctx.palletWeightOf(sh) || 0) : 0) })), 10);
      boxRows(doc, end + 1, [['TOTAL WEIGHT (kg)', fmt(t.net) + '  /  ' + fmt(t.gross), true]], 0, 158, 40);
      y = end + 14;
    });
    return doc;
  }

  window.Docs = {
    build(kind, ctx) {
      if (kind === 'draft' || kind === 'pl') return packingDoc(kind, ctx);
      if (kind === 'proforma') return proformaDoc(ctx);
      if (kind === 'isf') return isfDoc(ctx);
      if (kind === 'booking') return bookingDoc(ctx);
      throw new Error('Tipo de documento desconocido: ' + kind);
    },
    T, fmt, fmtDate
  };
})();
