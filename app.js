/* Saltwell Embarques — aplicación de gestión de embarques. */
(function () {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
  const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '' : Number(n).toLocaleString(window.I18N.locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const fmtD = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}-${m}-${y.slice(2)}`; };
  const daysFrom = s => s ? Math.round((new Date(s + 'T12:00:00') - new Date(todayISO() + 'T12:00:00')) / 864e5) : null;
  const normName = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const clone = o => JSON.parse(JSON.stringify(o));
  const shipId = (year, n) => `${year}-${n}`;

  function toast(msg, ms = 3200) {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  // ---------- Valores por defecto ----------
  const DEFAULT_SETTINGS = {
    shipperName: 'Saltwell SpA', shipperAddress: 'Avenida Ferrocarril Poniente 941', shipperCity: 'Lampa, Santiago', shipperCountry: 'CHILE',
    shipperRut: 'RUT 77006631-K', shipperEmail: 'mauricio@saltwellsalt.com',
    consigneeName: 'Saltwell AB', consigneeAddress: 'Nellickevägen 22', consigneeCity: '412 63 GÖTEBORG', consigneeCountry: 'SWEDEN',
    footerAddress1: 'La Vilana ML A- 9 LT ML- 3', footerAddress2: 'Valle Grande, Lampa, Santiago', shipperCountryTitle: 'Chile', vatNo: '77006631-K',
    signatoryName: 'Mauricio Moya B.', signatoryTitle: 'Administrative Manager', showSignature: true,
    exportRef: '77.006.631-K', origin: 'Chile', originPlace: 'Chile', currency: 'USD',
    isfManufacturerName: 'Saltwell SpA', isfManufacturerAddress: 'Ferrocarril Poniente #941, Bodega E-1, Valle Grande, Lampa, Santiago, Chile',
    isfSellerAddress: 'Nellickevägen 22, 412 63 GÖTEBORG, Sweden', isfImporterNumber: 'FDA N° 14500316282', isfHts: '2501.00', isfFiler: '77006631K',
    bookingIntro: 'Espero que estés bien, por favor tu ayuda con el booking del siguiente contenedor a la brevedad posible, la carga está lista para despacho.',
    bookingIntroPlural: 'Espero que estés bien, por favor tu ayuda con el booking de los siguientes contenedores a la brevedad posible, la carga está lista para despacho.',
    bookingSign: 'Saludos,\nMauricio Moya B.\nSaltwell SpA',
    usaCountries: 'USA, UNITED STATES',
    internalCc: 'Cindy@saltwellsalt.com; operations@saltwellsalt.com; Robin@saltwellsalt.com',
    customsName: 'Yessenia', customsTo: 'ypardo@comerint.cl',
    customsCcRules: 'Valparaiso: valparaiso@comerint.cl; BMORALES@comerint.cl\nSan Antonio: rnilo@comerint.cl; sai@comerint.cl',
    customsIntro: 'Adjunto booking, Draft Packing List y Proforma Invoice del siguiente embarque para su gestión.\nPor favor proceder con el pago del gate out.\nQuedo atento a cualquier consulta.'
  };
  const DEFAULT_MASTERS = {
    customers: [], items: [], pallets: [], forwarders: [], carriers: [], pols: ['San Antonio', 'Valparaiso'], pods: [],
    containerTypes: ["40'", "20'"], deliveryTerms: ['FOB', 'CIF', 'CFR', 'FCA', 'EXW'],
    statuses: ['Por Reservar', 'Booking solicitado', 'Reservado', 'Done', 'N/A'],
    salesModes: ['a Firme'], paymentTerms: ['cobranza 30 días fecha factura'], logistics: ['Cobrado', 'Cobrado AGA', 'Cobrado+Flete', 'Flete', 'N/A'],
    destIncoterms: ['DDP Incoterms 2020', 'DAP Incoterms 2020', 'FOB Incoterms 2020', 'FCA Incoterms 2020'], blStatuses: ['Draft', 'Final']
  };

  const FIELDS = [
    // [key, etiqueta, tipo, lista maestra]
    ['soRef', 'SWAB Sales Order Ref', 'text'], ['customerRef', 'Customer Ref', 'text'], ['poRef', 'SWAB PO Ref', 'text'],
    ['orderDate', 'Fecha orden', 'date'], ['finalCustomer', 'Cliente final', 'customer'],
    ['salesMode', 'Modalidad venta', 'list', 'salesModes'], ['paymentTerms', 'Forma de pago', 'list', 'paymentTerms'],
    ['deliveryTerms', 'Delivery Terms (CL)', 'list', 'deliveryTerms'], ['destIncoterm', 'Incoterm en destino', 'list', 'destIncoterms'],
    ['invoiceNo', 'N° Invoice', 'text'], ['status', 'Status', 'list', 'statuses'], ['logistics', 'Logística nacional', 'list', 'logistics'],
    ['forwarder', 'Forwarder', 'forwarder'], ['bookingRef', 'Booking reference', 'text'], ['carrier', 'Carrier', 'list', 'carriers'],
    ['vessel', 'Vessel', 'text'], ['pol', 'Port of loading', 'list', 'pols'], ['pod', 'Port of discharge', 'list', 'pods'],
    ['etd', 'ETD', 'date'], ['eta', 'ETA', 'date'], ['stackingStart', 'Inicio stacking', 'date'], ['stackingEnd', 'Cierre stacking', 'date'],
    ['deliveryDate', 'Fecha entrega a puerto', 'date'], ['blNo', 'N° BL / HBL', 'text'], ['blStatus', 'Estado BL', 'list', 'blStatuses'], ['mblNo', 'N° MBL (naviera)', 'text'],
    ['containerType', 'Tipo contenedor', 'list', 'containerTypes'], ['containerNo', 'Container N°', 'text'], ['sealNo', 'Seal N°', 'text'],
    ['tare', 'Tara (kg)', 'number'], ['pallet', 'Pallet', 'pallet']
  ];
  const FIELD_LABEL = Object.fromEntries(FIELDS.map(f => [f[0], f[1]]));
  FIELD_LABEL.items = 'Ítems'; FIELD_LABEL.remarks = 'Remarks';
  const BOOKING_FIELDS = ['forwarder', 'bookingRef', 'carrier', 'vessel', 'pol', 'pod', 'etd', 'eta', 'stackingStart', 'stackingEnd', 'deliveryDate'];

  // ---------- Estado ----------
  const S = {
    db: null, user: null, sample: null, assets: null, downloads: null,
    me: null, canWrite: true, ready: false, offline: false,
    ships: new Map(), masters: clone(DEFAULT_MASTERS), settings: clone(DEFAULT_SETTINGS),
    route: 'inicio', param: null,
    list: { q: '', status: 'activos', customer: '', year: 'all', group: false, sel: new Set(), filters: [], sort: { key: 'n', dir: 'desc' }, cols: null, showFilters: false, showCols: false },
    bkList: { sort: { key: 'etd', dir: 'desc' } }, blList: { sort: { key: 'onboardDate', dir: 'desc' } }, prefs: {}, bls: new Map(), blImports: [], blEdit: null,
    rep: { year: String(new Date().getFullYear()), from: '', to: '', customer: '', status: '', dateField: 'etd', pod: '', sort: { key: 'n', dir: 'desc' } },
    edit: null, // { id, draft, dirty, isNew }
    imports: [], masterTab: 'customers', names: {}, bookings: new Map(), bkImports: [], bkEdit: null
  };

  // ---------- Cálculos ----------
  function palletWeightOf(sh) {
    const p = S.masters.pallets.find(p => p.name === sh.pallet);
    return p ? num(p.weight) : 0;
  }
  function totals(sh) {
    const pw = palletWeightOf(sh);
    const t = { bags: 0, pallets: 0, net: 0, amount: 0 };
    for (const it of sh.items || []) {
      const q = num(it.qty);
      t.bags += q;
      t.pallets += num(it.bagsPerPallet) ? q / num(it.bagsPerPallet) : 0;
      t.net += q * num(it.kgPerBag);
      t.amount += Math.round(q * num(it.price));
    }
    t.palletsKg = pw * t.pallets;
    t.gross = t.net + t.palletsKg;
    t.vgm = t.gross + num(sh.tare);
    t.palletWeight = pw;
    return t;
  }
  const customerOf = sh => S.masters.customers.find(c => c.name === sh.finalCustomer) || null;
  const isUSA = sh => {
    const c = customerOf(sh); const list = String(S.settings.usaCountries || 'USA').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    return !!c && list.includes(String(c.country || '').trim().toUpperCase());
  };
  function phase(sh) {
    const st = sh.status || '';
    if (st === 'N/A') return 'na';
    if (st === 'Done') {
      const e = daysFrom(sh.eta), d = daysFrom(sh.etd);
      if (d !== null && d > 0) return 'res';
      if (e !== null && e >= 0) return 'transit';
      return 'done';
    }
    if (st === 'Reservado') return 'res';
    if (st === 'Booking solicitado') return 'sol';
    return 'por';
  }
  const PHASE = { por: ['Por reservar', 's-por'], sol: ['Booking solicitado', 's-sol'], res: ['Reservado', 's-res'], transit: ['En tránsito', 's-transit'], done: ['Entregado', 's-done'], na: ['N/A', ''] };
  const pill = sh => { const ph = phase(sh); const p = PHASE[ph]; const lbl = ph === 'res' && sh.status === 'Done' ? 'Despachado, por zarpar' : p[0]; return `<span class="pill ${p[1]}" title="Status: ${esc(sh.status)}">${lbl}</span>`; };
  const shipsArr = () => Array.from(S.ships.values()).sort((a, b) => (b.year - a.year) || (b.n - a.n));
  const nextN = year => 1 + Math.max(0, ...shipsArr().filter(s => s.year === year).map(s => s.n));

  function emptyShip(year, n) {
    return { n, year, soRef: '', customerRef: '', poRef: '', orderDate: todayISO(), forwarder: '', bookingRef: '', etd: '', eta: '', pol: '', pod: '',
      salesMode: S.masters.salesModes[0] || '', paymentTerms: S.masters.paymentTerms[0] || '', finalCustomer: '', deliveryTerms: 'FOB',
      containerType: "40'", containerNo: '', sealNo: '', tare: 0, pallet: (S.masters.pallets[0] || {}).name || '', blNo: '', carrier: '', vessel: '',
      stackingStart: '', stackingEnd: '', deliveryDate: '', invoiceNo: '', status: 'Por Reservar', logistics: '', destIncoterm: '', remarks: '',
      items: [], attachments: [], log: [] };
  }
  function defaultsFromCustomer(sh, name) {
    const prev = shipsArr().find(s => s.finalCustomer === name && s !== sh);
    if (!prev) return {};
    const out = {};
    ['forwarder', 'pol', 'pod', 'containerType', 'pallet', 'salesMode', 'paymentTerms', 'deliveryTerms', 'destIncoterm'].forEach(k => { if (prev[k]) out[k] = prev[k]; });
    out._prevItems = prev.items || [];
    return out;
  }
  function itemFromMaster(code, qty) {
    const m = S.masters.items.find(i => String(i.code) === String(code));
    return { item: String(code), description: m ? m.description : '', qty: num(qty), bagsPerPallet: m ? num(m.bagsPerPallet) : 42, kgPerBag: m ? num(m.kgPerBag) : 0, price: m ? num(m.price) : 0, batch: '' };
  }

  // ---------- Base de datos ----------
  async function writeShip(sh, msg) {
    if (!S.db) throw new Error('Sin conexión a la base de datos');
    const id = shipId(sh.year, sh.n);
    const body = clone(sh);
    body.updatedAt = new Date().toISOString();
    body.updatedBy = S.me || '';
    if (msg) {
      body.log = [{ at: body.updatedAt, by: S.me || '', msg }].concat(body.log || []).slice(0, 40);
    }
    await S.db.doc('shipments/' + id).set(body);
    S.ships.set(id, body);
    return id;
  }
  async function createShip(sh, msg) {
    // asegura un N° libre en el año
    for (let tries = 0; tries < 5; tries++) {
      const id = shipId(sh.year, sh.n);
      const snap = await S.db.doc('shipments/' + id).get();
      if (!snap.exists && !S.ships.has(id)) break;
      sh.n = nextN(sh.year) + tries;
    }
    sh.createdAt = new Date().toISOString();
    return writeShip(sh, msg || 'Embarque creado');
  }
  async function saveMasters() { await S.db.doc('config/masters').set(clone(S.masters)); }
  async function saveSettings() { await S.db.doc('config/settings').set(clone(S.settings)); }

  // ---------- Inicio ----------
  async function init() {
    $('#brandLogo').src = window.BRAND.logo;
    if (window.decorateIcons) window.decorateIcons(document.getElementById('nav'));
    window.I18N.set(initialLang());
    try { S.prefs = JSON.parse(localStorage.getItem('sw_prefs') || '{}') || {}; } catch (e) { S.prefs = {}; }
    S.prefs.views = S.prefs.views || []; applyPrefs();
    window.addEventListener('hashchange', route);
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', e => { if (e.target.id === 'aiForm') { e.preventDefault(); const i = $('#aiInput'); const v = i.value.trim(); i.value = ''; aiAsk(v); } });
    setupDrop();
    route();
    if (!window.claude || !window.claude.use) { S.offline = true; S.ready = true; render(); return; }
    const [db, user, sample, assets, downloads] = await Promise.all(['db', 'user', 'sample', 'assets', 'downloads'].map(n => window.claude.use(n).catch(() => null)));
    Object.assign(S, { db, user, sample, assets, downloads });
    if (user) {
      try { S.me = await user.id(); } catch (e) { S.me = null; }
      try { const c = await user.can('data.write'); if (c === false) S.canWrite = false; } catch (e) { /* sin info */ }
      try { const me = await user.me(); if (me && me.name) $('#whoami').textContent = me.name; } catch (e) { /* nada */ }
    }
    if (!db) { S.offline = true; S.ready = true; render(); return; }
    seedIfEmpty();
    loadLangPref();
    let gotShips = false, gotMasters = false;
    db.collection('shipments').onSnapshot(snap => {
      S.ships = new Map(snap.docs.map(d => [d.id, d.data()]));
      gotShips = true; S.ready = gotShips && gotMasters; refresh();
    }, err => { toast('Error al leer embarques: ' + err.message); });
    db.doc('config/masters').onSnapshot(snap => {
      S.masters = Object.assign(clone(DEFAULT_MASTERS), snap.exists ? clone(snap.data()) : {});
      gotMasters = true; S.ready = gotShips && gotMasters; refresh();
    }, () => { gotMasters = true; });
    db.collection('bls').onSnapshot(snap => {
      S.bls = new Map(snap.docs.map(d => [d.id, d.data()]));
      if (S.route === 'bl') S.blEdit = null;
      refresh();
    }, () => {});
    db.collection('bookings').onSnapshot(snap => {
      S.bookings = new Map(snap.docs.map(d => [d.id, d.data()]));
      if (S.route === 'bookings' || (S.route === 'booking' && !(S.bkEdit && S.bkEdit.dirty))) { if (S.route === 'booking') S.bkEdit = null; }
      refresh();
    }, () => {});
    db.doc('config/settings').onSnapshot(snap => {
      S.settings = Object.assign(clone(DEFAULT_SETTINGS), snap.exists ? clone(snap.data()) : {});
    });
  }

  // Carga inicial (una sola vez) de los datos del Excel Ventas_Contenedores, sólo por el dueño y sólo si la base está vacía.
  async function seedIfEmpty() {
    try {
      if (!S.user || !S.user.isOwner || !S.user.isOwner()) return;
      const flag = await S.db.doc('config/seed').get();
      if (flag.exists) return;
      const m = await S.db.doc('config/masters').get();
      const r = await fetch('seed.json');
      if (!r.ok) return;
      const seed = await r.json();
      S.seeding = { done: 0, total: Object.keys(seed.ships).length }; render();
      if (!m.exists) await S.db.doc('config/masters').set(seed.masters);
      const existing = await S.db.collection('shipments').get();
      const have = new Set(existing.docs.map(d => d.id));
      for (const [id, sh] of Object.entries(seed.ships)) {
        if (!have.has(id)) {
          sh.items = sh.items || []; sh.log = [{ at: new Date().toISOString(), by: S.me || '', msg: 'Importado desde Ventas_Contenedores.xlsx' }];
          await S.db.doc('shipments/' + id).set(sh);
        }
        S.seeding.done++;
        if (S.seeding.done % 10 === 0) render();
      }
      await S.db.doc('config/seed').set({ at: new Date().toISOString(), count: S.seeding.total });
      S.seeding = null; toast('Datos del Excel cargados'); render();
    } catch (e) {
      S.seeding = null; toast('La carga inicial se interrumpió (' + (e.message || e.code) + '). Se reintentará al volver a abrir la página.', 7000); render();
    }
  }

  let refreshTimer = null;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      $('#navCount').textContent = S.ships.size ? S.ships.size : '';
      $('#navBk').textContent = S.bookings.size ? S.bookings.size : '';
      $('#navBl').textContent = S.bls.size ? S.bls.size : '';
      // No re-renderizar formularios con cambios sin guardar
      if (S.edit && S.edit.dirty && (S.route === 'embarque' || S.route === 'nuevo')) {
        const cur = S.ships.get(S.edit.id);
        if (cur && S.edit.base && cur.updatedAt && cur.updatedAt !== S.edit.base && !S.edit.warned) {
          S.edit.warned = true; toast('Otra persona actualizó este embarque. Guarda o descarta tus cambios para ver la versión nueva.', 6000);
        }
        return;
      }
      if (['maestros', 'ajustes'].includes(S.route) && S.formDirty) return;
      render();
    }, 60);
  }

  function route() {
    closeModal();
    const h = (location.hash || '#inicio').slice(1);
    if (S.edit && S.edit.dirty && !h.startsWith('e-' + S.edit.id) && S.edit.id !== h) {
      // navegación con cambios sin guardar
      const target = h;
      history.replaceState(null, '', '#' + (S.edit.isNew ? 'nuevo' : 'e-' + S.edit.id));
      confirmDialog('Hay cambios sin guardar en este embarque. ¿Descartarlos?', 'Descartar cambios', () => { S.edit = null; location.hash = '#' + target; });
      return;
    }
    const m = h.match(/^e-(\d{4})-(\d+)$/);
    if (m) { S.route = 'embarque'; S.param = shipId(m[1], m[2]); }
    else if (h.startsWith('bk-')) { S.route = 'booking'; S.param = h.slice(3); }
    else if (h.startsWith('bl-')) { S.route = 'bl'; S.param = h.slice(3); }
    else if (['inicio', 'embarques', 'importar', 'bookings', 'bls', 'controles', 'reportes', 'maestros', 'ajustes', 'nuevo'].includes(h)) { S.route = h; S.param = null; }
    else { S.route = 'inicio'; }
    if (S.route !== 'embarque' && S.route !== 'nuevo') S.edit = null;
    if (S.route !== 'booking') S.bkEdit = null;
    if (S.route !== 'bl') S.blEdit = null;
    S.formDirty = false;
    $$('nav.side a').forEach(a => a.classList.toggle('on', a.dataset.nav === (S.route === 'embarque' || S.route === 'nuevo' ? 'embarques' : S.route === 'booking' ? 'bookings' : S.route === 'bl' ? 'bls' : S.route)));
    render();
    $('#main').scrollTop = 0;
  }

  let rendering = false;
  function render() {
    if (rendering) { setTimeout(render, 0); return; }
    rendering = true;
    try { renderInner(); } finally { rendering = false; }
  }
  function renderInner() {
    const main = $('#main');
    if (S.offline) { main.innerHTML = `<div class="wrap">${offlineView()}</div>`; return; }
    if (!S.ready) { main.innerHTML = '<div class="wrap"><p class="muted">Cargando embarques…</p></div>'; return; }
    const views = { inicio: viewHome, embarques: viewList, importar: viewImport, bookings: viewBookings, booking: viewBookingDetail, bls: viewBLs, bl: viewBLDetail, controles: viewControls, reportes: viewReports, maestros: viewMasters, ajustes: viewSettings, embarque: viewShip, nuevo: viewShip };
    const ro = !S.canWrite ? '<div class="banner info">Tienes acceso de lectura. Para crear o editar embarques, pide al dueño de la página que te comparta con permiso de edición.</div>' : '';
    const seedB = S.seeding ? `<div class="banner info">Cargando los embarques del Excel… ${S.seeding.done} de ${S.seeding.total}. No cierres la página.</div>` : '';
    const fbd = $('#aiRoot details'); if (fbd && S.ai) S.ai.fbOpen = fbd.open;
    const lg = $('#aiLog'), keepScroll = lg ? lg.scrollTop : null, aiVal = ($('#aiInput') || {}).value || '', fbVal = ($('#fbText') || {}).value || '';
    main.innerHTML = `<div class="wrap">${ro}${seedB}${(views[S.route] || viewHome)()}${S.route === 'bookings' || S.route === 'booking' ? bookingDatalists() : ''}</div>`;
    $('#aiRoot').innerHTML = aiPanel();
    if (window.decorateIcons) { window.decorateIcons(main); window.decorateIcons($('#aiRoot')); }
    const lg2 = $('#aiLog'); if (lg2) lg2.scrollTop = keepScroll != null && !(S.ai && S.ai.busy) ? keepScroll : lg2.scrollHeight;
    if ($('#aiInput')) $('#aiInput').value = aiVal; if ($('#fbText')) $('#fbText').value = fbVal;
    const nav = $('#navCtl'); if (nav) { const n = runControls().filter(c => c.sev === 'alta').length; nav.textContent = n || ''; }
    if (S.route === 'reportes') drawReportCharts();
    if (S.route === 'inicio') resolveNames();
  }

  function offlineView() {
    return `<div class="head"><div><h1>Saltwell Embarques</h1><div class="sub">Gestión de embarques, órdenes y documentos de exportación</div></div></div>
      <div class="banner">Esta página guarda los embarques en una base de datos compartida que sólo funciona al abrirla dentro de Claude con tu cuenta. Ábrela desde el enlace del artefacto en claude.ai.</div>`;
  }

  // ---------- Vista: Inicio ----------
  function viewHome() {
    const all = shipsArr();
    const year = new Date().getFullYear();
    const by = p => all.filter(s => phase(s) === p);
    const por = by('por'), sol = by('sol'), res = by('res'), tr = by('transit');
    const ytd = all.filter(s => s.year === year && s.status !== 'N/A');
    const tons = ytd.reduce((a, s) => a + totals(s).net, 0) / 1000;
    const soon = all.filter(s => s.etd && daysFrom(s.etd) >= -3 && daysFrom(s.etd) <= 30 && s.status !== 'N/A' && phase(s) !== 'transit').sort((a, b) => a.etd.localeCompare(b.etd));
    const ctrlAll = runControls();
    const alerts = ctrlAll.filter(c => c.sev !== 'baja').map(c => [c.ship, c.msg, c.sev]);
    const arrivals = tr.slice().sort((a, b) => (a.eta || '').localeCompare(b.eta || '')).slice(0, 8);
    const recent = all.filter(s => s.updatedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
    return `
    <div class="head"><div><h1>Embarques</h1><div class="sub">${esc(fmtLong(todayISO()))} · ${all.length} contenedores registrados</div></div>
      <div class="row"><a class="btn" href="#importar">Importar SO/PO</a><a class="btn primary" href="#nuevo">Nuevo embarque</a></div></div>
    <div class="tiles">
      <a class="tile amber" href="#embarques" data-goto-status="por">${ICON('booking', 22)}<b>${por.length}</b><span>Por reservar</span></a>
      <a class="tile blue" href="#embarques" data-goto-status="sol">${ICON('mail', 22)}<b>${sol.length}</b><span>Booking solicitado</span></a>
      <a class="tile teal" href="#embarques" data-goto-status="res">${ICON('anchor', 22)}<b>${res.length}</b><span>Reservados por zarpar</span></a>
      <a class="tile green" href="#embarques" data-goto-status="transit">${ICON('ship', 22)}<b>${tr.length}</b><span>En tránsito</span></a>
      <div class="tile">${ICON('container', 22)}<b>${ytd.length}</b><span>Contenedores ${year} · ${fmt(tons, 0)} t</span></div>
    </div>
    <div class="grid g2">
      <section class="card"><div class="row" style="justify-content:space-between"><h2>Próximos zarpes (30 días)</h2><span class="muted">${soon.length}</span></div>
        ${soon.length ? `<div class="tablewrap"><table><thead><tr><th>ETD</th><th>N°</th><th>Cliente</th><th>POD</th><th>Booking</th><th>Estado</th></tr></thead><tbody>
        ${soon.slice(0, 12).map(s => `<tr class="click" data-open="${shipId(s.year, s.n)}"><td class="mono">${fmtD(s.etd)}</td><td class="mono">${s.n}</td><td>${esc(short(s.finalCustomer))}</td><td>${esc(s.pod)}</td><td class="mono">${esc(s.bookingRef)}</td><td>${pill(s)}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted">No hay zarpes en los próximos 30 días.</p>'}
      </section>
      <section class="card"><div class="row" style="justify-content:space-between"><h2>Requiere atención</h2><a href="#controles">Ver los ${ctrlAll.length} controles</a></div>
        ${alerts.length ? `<div class="tablewrap"><table><tbody>${alerts.slice(0, 12).map(([s, m, sv]) => `<tr class="click" data-open="${shipId(s.year, s.n)}"><td>${sevPill(sv)}</td><td class="mono">${s.n}</td><td>${esc(short(s.finalCustomer))}</td><td class="wr">${esc(m)}</td><td class="mono">${fmtD(s.etd)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Todo al día.</p>'}
      </section>
      <section class="card"><h2>Llegadas próximas</h2>
        ${arrivals.length ? `<div class="tablewrap"><table><thead><tr><th>ETA</th><th>N°</th><th>Cliente</th><th>POD</th><th>Contenedor</th></tr></thead><tbody>${arrivals.map(s => `<tr class="click" data-open="${shipId(s.year, s.n)}"><td class="mono">${fmtD(s.eta)}</td><td class="mono">${s.n}</td><td>${esc(short(s.finalCustomer))}</td><td>${esc(s.pod)}</td><td class="mono">${esc(s.containerNo)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin contenedores en tránsito.</p>'}
      </section>
      <section class="card"><h2>Actividad reciente</h2>
        ${recent.length ? recent.map(s => `<div class="att"><a href="#e-${shipId(s.year, s.n)}">N° ${s.n}</a><span>${esc(short(s.finalCustomer))}</span><span class="muted" style="margin-left:auto"><span>${esc((s.log && s.log[0] && s.log[0].msg) || 'Actualizado')}</span> · <span>${esc(whoName(s.updatedBy))}</span> · ${fmtD((s.updatedAt || '').slice(0, 10))}</span></div>`).join('') : '<p class="muted">Aún no hay cambios registrados en la aplicación.</p>'}
      </section>
    </div>`;
  }
  function fmtLong(iso) { return new Date(iso + 'T12:00:00').toLocaleDateString(window.I18N.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function short(name) { return String(name || '').replace(/\s+(Limited|Ltd\.?|ltd|BV|AB|Inc\.?|Corporation|CORPORATION)\b.*$/i, '').slice(0, 34); }
  function whoName(id) { return (id && S.names[id]) || ''; }
  async function resolveNames() {
    if (!S.user || !S.user.profiles) return;
    const ids = Array.from(new Set(shipsArr().map(s => s.updatedBy).filter(Boolean).concat(shipsArr().flatMap(s => (s.log || []).map(l => l.by)).filter(Boolean)))).filter(id => !(id in S.names));
    if (!ids.length) return;
    try {
      const ps = await S.user.profiles(ids);
      let changed = false;
      ids.forEach(id => { S.names[id] = (ps && ps[id] && ps[id].name) || 'Alguien'; changed = true; });
      if (changed && (S.route === 'inicio' || S.route === 'embarque')) render();
    } catch (e) { ids.forEach(id => { S.names[id] = 'Alguien'; }); }
  }

  // ---------- Vista: Lista ----------
  const PHASE_ORDER = { por: 1, sol: 2, res: 3, transit: 4, done: 5, na: 6 };
  // Columnas disponibles en la lista (key, etiqueta, tipo, valor para ordenar/filtrar, celda)
  const LCOLS = [
    ['n', 'N°', 'num', s => s.year * 100000 + s.n, s => `<td class="mono">${s.n}<span class="muted">/${String(s.year).slice(2)}</span></td>`],
    ['soRef', 'SO', 'text', s => s.soRef, s => `<td class="mono">${esc(s.soRef)}</td>`],
    ['customerRef', 'Cust. Ref', 'text', s => s.customerRef, s => `<td class="mono">${esc(s.customerRef)}</td>`],
    ['poRef', 'PO', 'text', s => s.poRef, s => `<td class="mono">${esc(s.poRef)}</td>`],
    ['finalCustomer', 'Cliente', 'text', s => s.finalCustomer, s => `<td>${esc(short(s.finalCustomer))}</td>`],
    ['country', 'País', 'text', s => (customerOf(s) || {}).country || '', s => `<td>${esc((customerOf(s) || {}).country || '')}</td>`],
    ['pol', 'POL', 'text', s => s.pol, s => `<td>${esc(s.pol)}</td>`],
    ['pod', 'POD', 'text', s => s.pod, s => `<td>${esc(s.pod)}</td>`],
    ['orderDate', 'Fecha orden', 'date', s => s.orderDate, s => `<td class="mono">${fmtD(s.orderDate)}</td>`],
    ['etd', 'ETD', 'date', s => s.etd, s => `<td class="mono">${fmtD(s.etd)}</td>`],
    ['eta', 'ETA', 'date', s => s.eta, s => `<td class="mono">${fmtD(s.eta)}</td>`],
    ['stackingEnd', 'Cierre stacking', 'date', s => s.stackingEnd, s => `<td class="mono">${fmtD(s.stackingEnd)}</td>`],
    ['deliveryDate', 'Entrega puerto', 'date', s => s.deliveryDate, s => `<td class="mono">${fmtD(s.deliveryDate)}</td>`],
    ['forwarder', 'Forwarder', 'text', s => s.forwarder, s => `<td>${esc(s.forwarder)}</td>`],
    ['carrier', 'Carrier', 'text', s => s.carrier, s => `<td>${esc(s.carrier)}</td>`],
    ['vessel', 'Nave', 'text', s => s.vessel, s => `<td>${esc(s.vessel)}</td>`],
    ['bookingRef', 'Booking', 'text', s => s.bookingRef, s => `<td class="mono">${esc(s.bookingRef)}</td>`],
    ['containerType', 'Tipo', 'text', s => s.containerType, s => `<td>${esc(s.containerType)}</td>`],
    ['containerNo', 'Contenedor', 'text', s => s.containerNo, s => `<td class="mono">${esc(s.containerNo)}</td>`],
    ['blNo', 'BL', 'text', s => s.blNo, s => `<td class="mono">${esc(s.blNo)}</td>`],
    ['blStatus', 'Estado BL', 'text', s => s.blStatus, s => `<td>${s.blStatus ? blPill(s.blStatus === 'Final' ? 'final' : 'draft') : ''}</td>`],
    ['items', 'Producto', 'text', s => (s.items || []).map(i => i.item + ' ' + i.description).join(' '), s => `<td>${esc((s.items || []).map(i => i.item).join(', '))}</td>`],
    ['bags', 'Bolsas', 'num', s => totals(s).bags, s => `<td class="num">${fmt(totals(s).bags)}</td>`],
    ['net', 'Kg neto', 'num', s => totals(s).net, s => `<td class="num">${fmt(totals(s).net)}</td>`],
    ['amount', 'USD', 'num', s => totals(s).amount, s => `<td class="num">${fmt(totals(s).amount)}</td>`],
    ['invoiceNo', 'Invoice', 'text', s => s.invoiceNo, s => `<td class="mono">${esc(s.invoiceNo)}</td>`],
    ['logistics', 'Logística nacional', 'text', s => s.logistics, s => `<td>${esc(s.logistics)}</td>`],
    ['status', 'Status', 'text', s => s.status, s => `<td>${esc(s.status)}</td>`],
    ['phase', 'Estado', 'phase', s => PHASE_ORDER[phase(s)], s => `<td>${pill(s)}</td>`]
  ];
  const LCOL = Object.fromEntries(LCOLS.map(c => [c[0], c]));
  const DEFAULT_COLS = ['n', 'soRef', 'customerRef', 'poRef', 'finalCustomer', 'pod', 'etd', 'eta', 'bookingRef', 'containerNo', 'bags', 'phase'];
  const OPS = {
    text: [['has', 'contiene'], ['nhas', 'no contiene'], ['eq', 'es igual a'], ['empty', 'está vacío'], ['nempty', 'no está vacío']],
    num: [['eq', '='], ['gt', 'mayor que'], ['lt', 'menor que'], ['btw', 'entre'], ['empty', 'está vacío'], ['nempty', 'no está vacío']],
    date: [['eq', 'es'], ['gt', 'después de'], ['lt', 'antes de'], ['btw', 'entre'], ['next', 'en los próximos (días)'], ['last', 'en los últimos (días)'], ['empty', 'está vacío'], ['nempty', 'no está vacío']],
    phase: [['eq', 'es'], ['neq', 'no es']]
  };
  function testFilter(s, f) {
    const c = LCOL[f.field]; if (!c) return true;
    const ty = c[2]; let v = c[3](s);
    const empty = v === '' || v == null || (ty === 'num' && !v);
    if (f.op === 'empty') return empty;
    if (f.op === 'nempty') return !empty;
    if (ty === 'phase') { const want = PHASE_ORDER[f.v1]; return f.op === 'eq' ? v === want : v !== want; }
    if (ty === 'text') {
      const a = normName(v), b = normName(f.v1);
      if (!b) return true;
      return f.op === 'has' ? a.includes(b) : f.op === 'nhas' ? !a.includes(b) : a === b;
    }
    if (ty === 'num') {
      const x = num(v), a = num(f.v1), b = num(f.v2);
      if (f.v1 === '' || f.v1 == null) return true;
      return f.op === 'eq' ? x === a : f.op === 'gt' ? x > a : f.op === 'lt' ? x < a : x >= a && x <= (f.v2 === '' ? Infinity : b);
    }
    if (ty === 'date') {
      if (f.op === 'next' || f.op === 'last') { if (!v) return false; const d = daysFrom(v), n = num(f.v1); return f.op === 'next' ? d >= 0 && d <= n : d <= 0 && d >= -n; }
      if (!f.v1) return true;
      if (!v) return false;
      return f.op === 'eq' ? v === f.v1 : f.op === 'gt' ? v > f.v1 : f.op === 'lt' ? v < f.v1 : v >= f.v1 && (!f.v2 || v <= f.v2);
    }
    return true;
  }
  function sortRows(rows, sort, colMap) {
    if (!sort || !sort.key || !colMap[sort.key]) return rows;
    const get = colMap[sort.key][3], dir = sort.dir === 'asc' ? 1 : -1;
    return rows.map(r => [r, get(r)]).sort((a, b) => {
      const x = a[1], y = b[1];
      const ex = x === '' || x == null, ey = y === '' || y == null;
      if (ex && ey) return 0; if (ex) return 1; if (ey) return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * dir;
    }).map(p => p[0]);
  }
  function sortTh(table, key, label, sort, cls) {
    const on = sort && sort.key === key;
    const arrow = on ? (sort.dir === 'asc' ? '▲' : '▼') : '↕';
    return `<th class="${cls || ''}" aria-sort="${on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button class="th-sort ${on ? 'on' : ''}" data-sort="${table}:${key}">${esc(label)} <span class="arr" aria-hidden="true">${arrow}</span></button></th>`;
  }
  function toggleSort(table, key) {
    const st = table === 'list' ? S.list : table === 'rep' ? S.rep : table === 'bl' ? S.blList : S.bkList;
    const cur = st.sort || {};
    st.sort = cur.key === key ? (cur.dir === 'desc' ? { key, dir: 'asc' } : { key: '', dir: '' }) : { key, dir: 'desc' };
    if (table === 'list') savePrefs();
    render();
  }
  function filteredList() {
    const L = S.list;
    const q = normName(L.q);
    const rows = shipsArr().filter(s => {
      const ph = phase(s);
      if (L.status === 'activos' && (ph === 'done' || ph === 'na')) return false;
      if (['por', 'sol', 'res', 'transit', 'done', 'na'].includes(L.status) && ph !== L.status) return false;
      if (L.customer && s.finalCustomer !== L.customer) return false;
      if (L.year !== 'all' && String(s.year) !== L.year) return false;
      if (q) {
        const hay = normName([s.n, s.soRef, s.customerRef, s.poRef, s.finalCustomer, s.bookingRef, s.containerNo, s.blNo, s.pod, s.invoiceNo, s.vessel, (s.items || []).map(i => i.item + ' ' + i.batch).join(' ')].join(' '));
        if (!q.split(' ').every(w => hay.includes(w))) return false;
      }
      return (L.filters || []).every(f => testFilter(s, f));
    });
    return sortRows(rows, L.sort, LCOL);
  }
  function filterRowHtml(f, i) {
    const c = LCOL[f.field] || LCOLS[0];
    const ops = OPS[c[2]];
    let val = '';
    const inType = c[2] === 'date' && !['next', 'last'].includes(f.op) ? 'date' : c[2] === 'text' ? 'text' : 'number';
    if (c[2] === 'phase') val = `<select data-flt="${i}:v1" aria-label="Valor">${[['por', 'Por reservar'], ['sol', 'Booking solicitado'], ['res', 'Reservado'], ['transit', 'En tránsito'], ['done', 'Entregado'], ['na', 'N/A']].map(([v, l]) => `<option value="${v}" data-ui ${f.v1 === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    else if (!['empty', 'nempty'].includes(f.op)) {
      val = `<input type="${inType}" data-flt="${i}:v1" value="${esc(f.v1 || '')}" aria-label="Valor" style="width:${inType === 'text' ? 180 : 150}px">`;
      if (f.op === 'btw') val += ` <span class="muted">y</span> <input type="${inType}" data-flt="${i}:v2" value="${esc(f.v2 || '')}" aria-label="Valor hasta" style="width:150px">`;
    }
    return `<div class="row frow">
      <select data-flt="${i}:field" aria-label="Campo">${LCOLS.map(x => `<option value="${x[0]}" data-ui ${x[0] === f.field ? 'selected' : ''}>${esc(x[1])}</option>`).join('')}</select>
      <select data-flt="${i}:op" aria-label="Condición">${ops.map(([v, l]) => `<option value="${v}" data-ui ${v === f.op ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${val}<button class="btn small" data-fltdel="${i}" aria-label="Quitar filtro">×</button></div>`;
  }
  function viewList() {
    const L = S.list;
    const rows = filteredList();
    const cols = (L.cols && L.cols.length ? L.cols : DEFAULT_COLS).filter(k => LCOL[k]);
    const years = Array.from(new Set(shipsArr().map(s => s.year))).sort((a, b) => b - a);
    const custs = Array.from(new Set(shipsArr().map(s => s.finalCustomer).filter(Boolean))).sort();
    const chip = (v, l) => `<button class="chip ${L.status === v ? 'on' : ''}" data-status="${v}">${l}</button>`;
    const span = cols.length + 1;
    let body = '';
    const rowHtml = s => {
      const id = shipId(s.year, s.n);
      return `<tr class="click" data-open="${id}"><td><input type="checkbox" data-sel="${id}" ${L.sel.has(id) ? 'checked' : ''} aria-label="Seleccionar N° ${s.n}"></td>${cols.map(k => LCOL[k][4](s)).join('')}</tr>`;
    };
    if (L.group) {
      const groups = new Map();
      rows.forEach(s => { const k = s.bookingRef || '— Sin booking —'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); });
      for (const [k, arr] of groups) body += `<tr class="group"><td colspan="${span}">Booking ${esc(k)} · ${arr.length} contenedor${arr.length > 1 ? 'es' : ''} · ${esc(arr[0].carrier || '')} ${esc(arr[0].vessel || '')}</td></tr>` + arr.map(rowHtml).join('');
    } else body = rows.map(rowHtml).join('');
    const selN = L.sel.size;
    const views = (S.prefs.views || []);
    const nF = (L.filters || []).length;
    const sumBags = rows.reduce((a, s) => a + totals(s).bags, 0), sumNet = rows.reduce((a, s) => a + totals(s).net, 0);
    return `
    <div class="head"><div><h1>Embarques</h1><div class="sub">Un registro por contenedor (PO/SO). Busca por N°, orden, cliente, booking, contenedor o BL.</div></div>
      <div class="row"><a class="btn" href="#importar">Importar SO/PO</a><a class="btn primary" href="#nuevo">Nuevo embarque</a></div></div>
    <div class="card">
      <div class="row">
        <input type="search" id="q" placeholder="Buscar: 232604, Healy, MRKU…" value="${esc(L.q)}" style="flex:1;min-width:220px" aria-label="Buscar embarques">
        <select id="fYear" aria-label="Año"><option value="all" data-ui>Todos los años</option>${years.map(y => `<option ${L.year === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select>
        <select id="fCust" aria-label="Cliente"><option value="" data-ui>Todos los clientes</option>${custs.map(c => `<option ${L.customer === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <button class="btn ${L.showFilters || nF ? 'on-btn' : ''}" data-action="toggleFilters">Filtros${nF ? ` (${nF})` : ''}</button>
        <button class="btn" data-action="toggleCols">Columnas</button>
        <label class="row" style="gap:6px"><input type="checkbox" id="fGroup" ${L.group ? 'checked' : ''}> Agrupar por booking</label>
      </div>
      <div class="chips">${chip('activos', 'Activos')}${chip('por', 'Por reservar')}${chip('sol', 'Booking solicitado')}${chip('res', 'Reservados')}${chip('transit', 'En tránsito')}${chip('done', 'Entregados')}${chip('all', 'Todos')}</div>
      ${L.showFilters || nF ? `<div class="fbox">
        ${(L.filters || []).map(filterRowHtml).join('') || '<p class="muted" style="margin:0">Sin filtros. Agrega uno para buscar por cualquier campo: fechas, puertos, forwarder, producto, peso…</p>'}
        <div class="row"><button class="btn small" data-action="addFilter">Agregar filtro</button>${nF ? '<button class="btn small" data-action="clearFilters">Quitar filtros</button>' : ''}
          <span style="flex:1"></span><button class="btn small" data-action="saveView">Guardar como vista…</button></div></div>` : ''}
      ${L.showCols ? `<div class="fbox"><div class="muted" style="font-size:12px">Elige las columnas que quieres ver:</div><div class="chips">${LCOLS.map(c => `<label class="chip ${cols.includes(c[0]) ? 'on' : ''}" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-col="${c[0]}" ${cols.includes(c[0]) ? 'checked' : ''} style="display:none">${esc(c[1])}</label>`).join('')}</div>
        <div class="row"><button class="btn small" data-action="resetCols">Columnas por defecto</button></div></div>` : ''}
      ${views.length ? `<div class="row"><span class="muted" style="font-size:12px">Mis vistas:</span>${views.map((v, i) => `<span class="chip" style="display:inline-flex;gap:6px;align-items:center"><button class="linkbtn" data-view="${i}">${esc(v.name)}</button><button class="linkbtn muted" data-viewdel="${i}" aria-label="Borrar vista">×</button></span>`).join('')}</div>` : ''}
      ${selN ? `<div class="row banner info"><b>${selN} seleccionado${selN > 1 ? 's' : ''}</b>
        <button class="btn small" data-action="bookingSel">Solicitar booking</button>
        <button class="btn small" data-action="bulkStatus">Cambiar status…</button>
        <button class="btn small" data-action="clearSel">Quitar selección</button></div>` : ''}
    </div>
    <div class="tablewrap"><table><thead><tr><th></th>${cols.map(k => sortTh('list', k, LCOL[k][1], L.sort, LCOL[k][2] === 'num' ? 'num' : '')).join('')}</tr></thead>
      <tbody>${body || `<tr><td colspan="${span}" class="empty">No hay embarques con estos filtros.</td></tr>`}</tbody></table></div>
    <p class="muted">${rows.length} de ${S.ships.size} embarques · ${fmt(sumBags)} bolsas · ${fmt(sumNet / 1000, 1)} t</p>`;
  }
  // Preferencias por usuario (columnas, orden, vistas guardadas, idioma)
  let prefsTimer = null;
  function savePrefs() {
    S.prefs.listCols = S.list.cols || null; S.prefs.listSort = S.list.sort || null;
    try { localStorage.setItem('sw_prefs', JSON.stringify(S.prefs)); } catch (e) { /* sin almacenamiento */ }
    clearTimeout(prefsTimer);
    prefsTimer = setTimeout(async () => { if (S.db && S.me) { try { await S.db.doc('data/users/' + S.me + '/prefs').set(clone(S.prefs)); } catch (e) { /* sólo local */ } } }, 800);
  }
  function applyPrefs() {
    if (S.prefs.listCols) S.list.cols = S.prefs.listCols;
    if (S.prefs.listSort) S.list.sort = S.prefs.listSort;
  }

  // ---------- Vista: Detalle ----------
  function startEdit() {
    if (S.route === 'nuevo') {
      if (!S.edit || !S.edit.isNew) {
        const y = new Date().getFullYear();
        S.edit = { id: 'nuevo', draft: emptyShip(y, nextN(y)), dirty: false, isNew: true };
      }
      return S.edit;
    }
    const id = S.param;
    if (!S.edit || S.edit.id !== id) {
      const sh = S.ships.get(id);
      if (!sh) return null;
      S.edit = { id, draft: clone(sh), dirty: false, isNew: false, base: sh.updatedAt };
    } else if (!S.edit.dirty) {
      const sh = S.ships.get(id);
      if (sh) { S.edit.draft = clone(sh); S.edit.base = sh.updatedAt; }
    }
    return S.edit;
  }
  function fieldInput(f, sh) {
    const [k, label, type, list] = f;
    const v = sh[k] == null ? '' : sh[k];
    const id = 'f_' + k;
    const dis = S.canWrite ? '' : 'disabled';
    let inp;
    const opts = (arr, cur) => { const a = arr.slice(); if (cur && !a.includes(cur)) a.unshift(cur); return '<option value=""></option>' + a.map(o => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join(''); };
    if (type === 'date') inp = `<input type="date" id="${id}" data-f="${k}" value="${esc(v)}" ${dis}>`;
    else if (type === 'number') inp = `<input type="number" step="any" id="${id}" data-f="${k}" value="${esc(v)}" ${dis}>`;
    else if (type === 'list') inp = `<select id="${id}" data-f="${k}" ${dis}>${opts(S.masters[list] || [], v)}</select>`;
    else if (type === 'customer') inp = `<select id="${id}" data-f="${k}" ${dis}>${opts(S.masters.customers.map(c => c.name), v)}</select>`;
    else if (type === 'pallet') inp = `<select id="${id}" data-f="${k}" ${dis}>${opts(S.masters.pallets.map(c => c.name), v)}</select>`;
    else if (type === 'forwarder') inp = `<select id="${id}" data-f="${k}" ${dis}>${opts(S.masters.forwarders.map(c => c.name), v)}</select>`;
    else inp = `<input type="text" id="${id}" data-f="${k}" value="${esc(v)}" ${dis}>`;
    return `<label class="f" for="${id}">${esc(label)}${inp}</label>`;
  }
  function section(title, keys, sh) {
    return `<section class="card"><h3>${title}</h3><div class="form">${keys.map(k => fieldInput(FIELDS.find(f => f[0] === k), sh)).join('')}</div></section>`;
  }
  function viewShip() {
    const ed = startEdit();
    if (!ed) return `<div class="banner">No encontré el embarque ${esc(S.param)}. Puede haber sido eliminado.</div><p><a href="#embarques">Volver a la lista</a></p>`;
    const sh = ed.draft;
    const t = totals(sh);
    const c = customerOf(sh);
    const siblings = sh.bookingRef ? shipsArr().filter(s => s.bookingRef === sh.bookingRef && !(s.year === sh.year && s.n === sh.n)) : [];
    const dis = S.canWrite ? '' : 'disabled';
    const docBtn = (k, l, need, block) => `<button class="btn small" data-doc="${k}" ${ed.isNew ? 'disabled title="Guarda primero"' : block ? 'disabled' : ''}>${l}${need ? ` <span class="muted">· ${need}</span>` : ''}</button>`;
    const noBk = sh.bookingRef ? '' : 'falta N° booking';
    const errs = shipErrors(sh);
    const bk = bookingOf(sh);
    const missingPL = [!sh.containerNo && 'contenedor', !sh.sealNo && 'sello', !sh.blNo && 'BL', !num(sh.tare) && 'tara'].filter(Boolean);
    const items = (sh.items || []).map((it, i) => {
      const pal = num(it.bagsPerPallet) ? num(it.qty) / num(it.bagsPerPallet) : 0;
      return `<tr>
        <td><input list="itemCodes" data-it="${i}" data-k="item" value="${esc(it.item)}" style="width:100px" aria-label="Código ítem" ${dis}></td>
        <td><input data-it="${i}" data-k="description" value="${esc(it.description)}" style="min-width:220px" aria-label="Descripción" ${dis}></td>
        <td><input type="number" data-it="${i}" data-k="qty" value="${esc(it.qty)}" style="width:80px" aria-label="Bolsas" ${dis}></td>
        <td><input type="number" data-it="${i}" data-k="bagsPerPallet" value="${esc(it.bagsPerPallet)}" style="width:70px" aria-label="Bolsas por pallet" ${dis}></td>
        <td class="num">${fmt(pal, pal % 1 ? 1 : 0)}</td>
        <td><input type="number" step="any" data-it="${i}" data-k="kgPerBag" value="${esc(it.kgPerBag)}" style="width:75px" aria-label="Kg por bolsa" ${dis}></td>
        <td class="num">${fmt(num(it.qty) * num(it.kgPerBag))}</td>
        <td><input type="number" step="any" data-it="${i}" data-k="price" value="${esc(it.price)}" style="width:80px" aria-label="Precio por bolsa" ${dis}></td>
        <td class="num">${fmt(Math.round(num(it.qty) * num(it.price)))}</td>
        <td><input data-it="${i}" data-k="batch" value="${esc(it.batch)}" style="min-width:200px" placeholder="Lote(s)" aria-label="Batch" ${dis}></td>
        <td><button class="btn small danger" data-delitem="${i}" aria-label="Quitar ítem" ${dis}>×</button></td></tr>`;
    }).join('');
    const atts = (sh.attachments || []).map((a, i) => `<div class="att"><span class="pill">${esc(a.kind || 'PDF')}</span><a href="/_blob/${esc(a.id)}" target="_blank" rel="noopener">${esc(a.name)}</a><span class="muted">${fmtD((a.at || '').slice(0, 10))}</span>
      <button class="btn small" data-delatt="${i}" style="margin-left:auto" ${dis}>Quitar</button></div>`).join('');
    const log = (sh.log || []).slice(0, 12).map(l => `<div class="att"><span class="mono muted">${fmtD((l.at || '').slice(0, 10))} ${(l.at || '').slice(11, 16)}</span><span>${esc(l.msg)}</span><span class="muted" style="margin-left:auto">${esc(whoName(l.by))}</span></div>`).join('');
    setTimeout(resolveNames, 0);
    return `
    <div class="sticky-bar">
      <div><h1>${ed.isNew ? 'Nuevo embarque' : `Embarque N° ${sh.n} <span class="muted" style="font-weight:500">/ ${sh.year}</span>`}${sh.poRef ? ` <span class="ref-chip">PO ${esc(sh.poRef)}</span>` : ''}${sh.soRef ? ` <span class="ref-chip">SO ${esc(sh.soRef)}</span>` : ''} ${ed.isNew ? '' : pill(sh)}</h1>
        <div class="muted">${esc(sh.finalCustomer || 'Sin cliente')} ${sh.customerRef ? '· Cust. Ref ' + esc(sh.customerRef) : ''} ${sh.bookingRef ? '· Booking ' + esc(sh.bookingRef) : ''} ${sh.containerNo ? '· ' + esc(sh.containerNo) : ''}</div></div>
      <div class="row">
        ${ed.dirty ? '<span class="pill s-por">Cambios sin guardar</span>' : ''}
        ${ed.dirty && !ed.isNew ? '<button class="btn" data-action="discard">Descartar</button>' : ''}
        <button class="btn primary" data-action="save" ${dis}>${ed.isNew ? 'Crear embarque' : 'Guardar'}</button>
      </div>
    </div>
    ${errs.map(e => `<div class="banner" style="background:var(--red-soft);border-color:var(--red)">${esc(e)}</div>`).join('')}
    ${(() => { if (ed.isNew) return ''; const cs = runControls().filter(c => c.id === shipId(sh.year, sh.n) && c.code !== 'stacking'); return cs.length ? `<div class="banner"><b>Controles:</b> ${cs.map(c => `${sevPill(c.sev)} <span>${esc(c.msg)}</span>`).join(' &nbsp; ')}</div>` : ''; })()}
    <section class="card"><div class="row" style="justify-content:space-between"><h3>Documentos</h3><span class="muted">${ed.dirty ? 'Guarda antes de generar para incluir los últimos cambios' : 'Vista previa y descarga en PDF'}</span></div>
      <div class="row">
        ${docBtn('draft', 'Draft Packing List', noBk, !!noBk)}${docBtn('proforma', 'Proforma Invoice', noBk, !!noBk)}
        ${docBtn('pl', 'Packing List final', missingPL.length ? 'falta ' + missingPL.join(', ') : '')}
        ${isUSA(sh) ? docBtn('isf', 'ISF (USA)', sh.blNo ? '' : 'falta BL') : ''}
        <button class="btn small" data-action="booking" ${ed.isNew ? 'disabled' : ''}>Correo de booking</button>
        <button class="btn small" data-action="customs" ${ed.isNew || noBk ? 'disabled' : ''}>Correo agente de aduanas${noBk ? ' <span class="muted">· falta N° booking</span>' : ''}</button>
        <span style="flex:1"></span>
        ${S.sample && !ed.isNew ? '<button class="btn small" data-action="aiReview">Revisar con Claude</button>' : ''}
        <button class="btn small" data-action="duplicate" ${ed.isNew || !S.canWrite ? 'disabled' : ''}>Duplicar</button>
        <button class="btn small danger" data-action="delete" ${ed.isNew || !S.canWrite ? 'disabled' : ''}>Eliminar</button>
      </div>
    </section>
    <div class="grid g2">
      ${section('Orden y venta', ['soRef', 'customerRef', 'poRef', 'orderDate', 'salesMode', 'paymentTerms', 'deliveryTerms', 'destIncoterm', 'invoiceNo', 'status', 'logistics'], sh)}
      <section class="card"><h3>Cliente final</h3><div class="form">${fieldInput(FIELDS.find(f => f[0] === 'finalCustomer'), sh)}</div>
        ${c ? `<dl class="kv"><dt>Dirección</dt><dd>${esc(c.address)}</dd><dt>Ciudad</dt><dd>${esc(c.city)} ${esc(c.postal)}</dd><dt>País</dt><dd>${esc(c.country)}</dd></dl>` : `<p class="muted">${sh.finalCustomer ? 'Este cliente no está en Maestros: agrégalo para que su dirección salga en los documentos.' : 'Selecciona el cliente final.'}</p>`}
        <label class="f" for="f_remarks">Remarks<textarea id="f_remarks" data-f="remarks" rows="3" ${dis}>${esc(sh.remarks)}</textarea></label>
      </section>
    </div>
    <div class="grid g2">
      ${section('Booking y transporte', ['forwarder', 'bookingRef', 'carrier', 'vessel', 'pol', 'pod', 'etd', 'eta', 'stackingStart', 'stackingEnd', 'deliveryDate', 'blNo', 'blStatus', 'mblNo'], sh)}
      <div style="display:flex;flex-direction:column;gap:14px">
        ${bk ? `<section class="card"><div class="row" style="justify-content:space-between"><h3>Booking ${esc(bk.bookingRef)}</h3><a class="btn small" href="#bk-${esc(bookingId(bk.bookingRef))}">Ver booking</a></div>
          <dl class="kv"><dt>Carrier</dt><dd>${esc(bk.carrier)}</dd><dt>Nave</dt><dd>${esc(bk.vessel)}</dd><dt>Ruta</dt><dd>${esc(bk.pol)} → ${esc(bk.pod)}</dd><dt>ETD / ETA</dt><dd>${fmtD(bk.etd)} / ${fmtD(bk.eta)}</dd>
          <dt>Equipos</dt><dd>${esc((bk.equipment || []).map(e => e.qty + ' x ' + e.type).join(', '))}</dd><dt>Stacking</dt><dd>${fmtD(bk.stackingStart) || '…'} a ${fmtD(bk.stackingEnd) || '…'}</dd>
          <dt>Cierre documental (SI)</dt><dd>${fmtD(bk.siCutoff)}</dd><dt>Cierre VGM</dt><dd>${fmtD(bk.vgmCutoff)}</dd></dl>
          ${(bk.attachments || []).map(a => `<div class="att"><span class="pill">PDF</span><a href="/_blob/${esc(a.id)}" target="_blank" rel="noopener">${esc(a.name)}</a></div>`).join('')}</section>`
        : sh.bookingRef && !ed.isNew ? `<section class="card"><h3>Booking ${esc(sh.bookingRef)}</h3><p class="muted">Aún no se ha importado el PDF de este booking. <a href="#bookings">Importar booking</a></p></section>` : ''}
        ${(() => { const b = blOf(sh); if (b) return `<section class="card"><div class="row" style="justify-content:space-between"><h3>BL ${esc(b.blNo)} ${blPill(b.kind)}</h3><a class="btn small" href="#bl-${esc(blId(b.blNo))}">Ver BL</a></div>
          <dl class="kv"><dt>Nave</dt><dd>${esc(b.vessel)}</dd><dt>Ruta</dt><dd>${esc(b.pol)} → ${esc(b.pod)}</dd><dt>Shipped on board</dt><dd>${fmtD(b.onboardDate)}</dd><dt>Flete</dt><dd>${esc(b.freightTerms || '')} ${b.freight ? '· ' + esc(b.freight) : ''}</dd><dt>Contenedores en el BL</dt><dd>${esc((b.containers || []).map(c => c.containerNo).join(', '))}</dd></dl>
          ${(b.attachments || []).map(a => `<div class="att">${blPill(a.kind)}<a href="/_blob/${esc(a.id)}" target="_blank" rel="noopener">${esc(a.name)}</a></div>`).join('')}</section>`;
          return sh.blNo && !ed.isNew ? `<section class="card"><h3>BL ${esc(sh.blNo)}</h3><p class="muted">Aún no se ha importado el PDF de este BL. <a href="#bls">Importar BL</a></p></section>` : ''; })()}
        ${section('Contenedor', ['containerType', 'containerNo', 'sealNo', 'tare', 'pallet'], sh)}
        ${siblings.length ? `<section class="card"><h3>Mismo booking (${siblings.length + 1} contenedores)</h3>
          ${siblings.map(s => `<div class="att"><a href="#e-${shipId(s.year, s.n)}">N° ${s.n}</a><span class="mono">${esc(s.containerNo || 'sin contenedor')}</span><span>${esc(short(s.finalCustomer))}</span><span style="margin-left:auto">${pill(s)}</span></div>`).join('')}
          <button class="btn small" data-action="propagate" ${dis}>Copiar datos de booking a los otros ${siblings.length}</button>
          <span class="muted" style="font-size:12px">Copia forwarder, carrier, vessel, puertos, ETD/ETA, stacking y fecha de entrega.</span></section>` : ''}
      </div>
    </div>
    <section class="card"><div class="row" style="justify-content:space-between"><h3>Mercadería</h3><button class="btn small" data-action="addItem" ${dis}>Agregar ítem</button></div>
      <div class="tablewrap items"><table><thead><tr><th>Item</th><th>Descripción</th><th>Bolsas</th><th>Bolsas/pallet</th><th class="num">Pallets</th><th>Kg/bolsa</th><th class="num">Kg neto</th><th>Precio USD</th><th class="num">Total USD</th><th>Batch / Lote</th><th></th></tr></thead>
      <tbody>${items || '<tr><td colspan="11" class="empty">Sin ítems. Agrega uno o importa el PDF de la orden.</td></tr>'}</tbody></table></div>
      <datalist id="itemCodes">${S.masters.items.map(i => `<option value="${esc(i.code)}">${esc(i.description)}</option>`).join('')}</datalist>
      <div class="totals">
        <div><span>Bolsas</span><b>${fmt(t.bags)}</b></div><div><span>Pallets</span><b>${fmt(t.pallets, t.pallets % 1 ? 1 : 0)}</b></div>
        <div><span>Peso neto kg</span><b>${fmt(t.net)}</b></div><div><span>Peso pallets kg</span><b>${fmt(t.palletsKg)}</b></div>
        <div><span>Peso bruto kg</span><b>${fmt(t.gross)}</b></div><div><span>VGM kg</span><b>${fmt(t.vgm)}</b></div>
        <div><span>Total USD</span><b>${fmt(t.amount)}</b></div>
      </div>
    </section>
    <div class="grid g2">
      <section class="card"><div class="row" style="justify-content:space-between"><h3>PDF adjuntos</h3>${ed.isNew ? '' : '<a class="btn small" href="#importar">Importar SO/PO</a>'}</div>${atts || '<p class="muted">Los PDF importados (PO / SO) quedan guardados aquí.</p>'}</section>
      <section class="card"><h3>Historial</h3>${log || '<p class="muted">Sin cambios registrados en la aplicación.</p>'}</section>
    </div>`;
  }

  function markDirty() {
    if (!S.edit) return;
    if (!S.edit.dirty) { S.edit.dirty = true; rerenderKeepFocus(); }
  }
  function rerenderKeepFocus() {
    const a = document.activeElement;
    const key = a && (a.id || (a.dataset && a.dataset.it != null ? `it_${a.dataset.it}_${a.dataset.k}` : ''));
    const pos = a && a.selectionStart;
    const scroll = $('#main').scrollTop;
    render();
    $('#main').scrollTop = scroll;
    if (key) {
      let el = document.getElementById(key);
      if (!el && key.startsWith('it_')) { const [, i, k] = key.split('_'); el = $(`[data-it="${i}"][data-k="${k}"]`); }
      if (el) { el.focus(); try { if (pos != null && el.setSelectionRange) el.setSelectionRange(pos, pos); } catch (e) { /* tipo sin selección */ } }
    }
  }

  async function saveEdit() {
    const ed = S.edit; if (!ed) return;
    const sh = ed.draft;
    if (!sh.finalCustomer && !sh.soRef && !sh.poRef) { toast('Indica al menos el cliente o un número de orden.'); return; }
    const errs = shipErrors(sh);
    if (errs.length) { toast(errs[0], 6000); return; }
    try {
      if (ed.isNew) {
        const changes = 'Embarque creado';
        const id = await createShip(sh, changes);
        S.edit = null; toast(`Embarque N° ${sh.n} creado`);
        location.hash = '#e-' + id;
      } else {
        const prev = S.ships.get(ed.id) || {};
        const changed = Object.keys(FIELD_LABEL).filter(k => JSON.stringify(prev[k]) !== JSON.stringify(sh[k]));
        const msg = changed.length ? 'Editó ' + changed.slice(0, 4).map(k => FIELD_LABEL[k]).join(', ') + (changed.length > 4 ? ` y ${changed.length - 4} más` : '') : 'Guardado';
        await writeShip(sh, msg);
        ed.dirty = false; ed.base = S.ships.get(ed.id).updatedAt; ed.warned = false;
        toast('Cambios guardados'); render();
      }
    } catch (e) {
      toast(e && e.code === 'invalid_argument' ? 'No tienes permiso para guardar cambios.' : 'No se pudo guardar: ' + (e.message || e.code || e));
    }
  }

  // ---------- Documentos ----------
  function docCtx(sh) {
    return { sh, S: S.settings, customer: customerOf(sh), t: totals(sh), palletWeight: palletWeightOf(sh), today: todayISO(), palletWeightOf };
  }
  const DOC_NAMES = { draft: 'Draft Packing List', proforma: 'Proforma Invoice', pl: 'Packing List', isf: 'ISF Form', booking: 'Booking Request' };
  function docFileName(kind, sh) {
    const pre = { draft: 'DraftPL', proforma: 'Proforma', pl: 'PL', isf: 'ISF', booking: 'Booking' }[kind];
    const cust = short(sh.finalCustomer).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `${pre}_N${sh.n}_${sh.year}${sh.soRef ? '_SO' + sh.soRef : ''}${cust ? '_' + cust : ''}.pdf`;
  }
  async function openDoc(kind, shs) {
    const sh = shs[0];
    if ((kind === 'draft' || kind === 'proforma') && !sh.bookingRef) { toast('El Draft Packing List y la Proforma Invoice requieren N° de booking.'); return; }
    let doc;
    try {
      doc = kind === 'booking'
        ? window.Docs.build('booking', { list: shs.map(s => ({ sh: s, customer: customerOf(s), t: totals(s) })), S: S.settings, today: todayISO(), palletWeightOf })
        : window.Docs.build(kind, docCtx(sh));
    } catch (e) { toast('No se pudo generar el documento: ' + e.message); return; }
    const buf = doc.output('arraybuffer');
    const name = kind === 'booking' && shs.length > 1 ? `Booking_${shs.map(s => 'N' + s.n).join('-')}.pdf` : docFileName(kind, sh);
    const warn = kind === 'pl' && (!sh.containerNo || !sh.blNo) ? '<div class="banner">Faltan datos para el Packing List final (contenedor, sello o BL). Puedes descargarlo igual.</div>' : '';
    modal(`<div class="row" style="justify-content:space-between"><h2>${DOC_NAMES[kind]} · N° ${shs.map(s => s.n).join(', ')}</h2><button class="btn" data-close>Cerrar</button></div>
      ${warn}<div class="preview" id="pv"><p class="muted">Generando vista previa…</p></div>
      <div class="row"><button class="btn primary" id="dlPdf">Descargar PDF</button><span class="muted">${esc(name)}</span></div>`, 'wide');
    $('#dlPdf').onclick = () => saveFile(name, buf.slice(0));
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
      const pv = $('#pv'); pv.innerHTML = '';
      const box = document.createElement('div'); box.style.cssText = 'display:flex;flex-direction:column;gap:10px';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: 1.6 });
        const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; cv.style.width = Math.min(780, vp.width / 1.6 * 1.3) + 'px';
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        box.appendChild(cv);
      }
      pv.appendChild(box);
    } catch (e) { const pv = $('#pv'); if (pv) pv.innerHTML = '<p class="muted">No se pudo mostrar la vista previa, pero puedes descargar el PDF.</p>'; }
  }
  async function saveFile(filename, data) {
    if (!S.downloads) { toast('La descarga no está disponible en esta vista.'); return; }
    try { await S.downloads.save({ filename, data }); }
    catch (e) { if (e.code !== 'declined') toast('No se pudo descargar: ' + (e.message || e.code)); }
  }

  // Correo de booking con el formato de la hoja "Booking" del Excel
  const BK = { navy: '#1F3864', blue: '#2E5395', label: '#F2F2F2', val: '#166084', hl: '#FFFF00', light: '#BDD7EE', alt: '#DEEAF1', cream: '#FFF2CC', brown: '#7F4000' };
  const fmtEN = (n, d = 0) => (n == null || isNaN(n)) ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  function bookingBlockHtml(s) {
    const c = customerOf(s); const t = totals(s); const pw = palletWeightOf(s);
    const F = 'font-family:Calibri,Arial,sans-serif;font-size:10pt;';
    const td = (v, st) => `<td style="${F}border:1px solid #BFBFBF;padding:3px 6px;${st || ''}">${esc(v == null ? '' : v)}</td>`;
    const lab = v => td(v, `background:${BK.label};color:${BK.navy};font-weight:bold;`);
    const val = (v, hl) => td(v, `background:${hl ? BK.hl : '#FFFFFF'};color:${BK.val};`);
    const band = (v, bg, size) => `<tr><td colspan="6" style="${F}background:${bg};color:#FFFFFF;font-weight:bold;text-align:center;padding:4px 6px;${size ? 'font-size:' + size + ';' : ''}">${esc(v)}</td></tr>`;
    const rows = [];
    rows.push(band('SALTWELL SpA — BOOKING REQUEST', BK.navy, '14pt'));
    rows.push(`<tr>${td('N° Venta:', `background:${BK.navy};color:#FFFFFF;font-weight:bold;`)}<td colspan="5" style="${F}background:${BK.cream};color:${BK.brown};font-weight:bold;font-size:12pt;text-align:center;border:1px solid #BFBFBF">${esc(s.n)}</td></tr>`);
    rows.push(band('DATOS DE LA VENTA', BK.blue));
    rows.push(`<tr>${lab('Sales Order Ref')}${val(s.soRef)}${lab('ETD')}${val(fmtD(s.etd), true)}${lab('ETA')}${val(fmtD(s.eta), true)}</tr>`);
    rows.push(`<tr>${lab('Customer Ref')}${val(s.customerRef)}${lab('Delivery Terms CL')}${val(s.deliveryTerms)}${lab('Port of Discharge')}${val(s.pod)}</tr>`);
    rows.push(`<tr>${lab('PO Ref (SWAB)')}${val(s.poRef)}${lab('Delivery Terms Destino Final')}${val(s.destIncoterm)}${lab('Type Container')}${val(s.containerType)}</tr>`);
    rows.push(`<tr>${lab('Booking Reference')}${val(s.bookingRef, true)}${lab('Forma de Pago')}${val(s.paymentTerms)}${lab('Modalidad Venta')}${val(s.salesMode)}</tr>`);
    rows.push(`<tr><td colspan="6" style="height:8px;border:0"></td></tr>`);
    rows.push(band('CUSTOMER / CONSIGNEE', BK.blue));
    rows.push(`<tr>${lab('Final Customer')}<td colspan="5" style="${F}background:${BK.light};color:${BK.val};font-weight:bold;border:1px solid #BFBFBF;padding:3px 6px">${esc(c ? c.name : s.finalCustomer)}</td></tr>`);
    rows.push(`<tr>${lab('Delivery Address')}<td colspan="5" style="${F}color:${BK.val};border:1px solid #BFBFBF;padding:3px 6px">${esc(c ? c.address : '')}</td></tr>`);
    rows.push(`<tr>${lab('State / City')}<td colspan="3" style="${F}color:${BK.val};border:1px solid #BFBFBF;padding:3px 6px">${esc(c ? c.city : '')}</td>${lab('Postal Code')}${val(c ? c.postal : '')}</tr>`);
    rows.push(`<tr>${lab('Country')}<td colspan="5" style="${F}color:${BK.val};border:1px solid #BFBFBF;padding:3px 6px">${esc(c ? c.country : '')}</td></tr>`);
    rows.push(`<tr><td colspan="6" style="height:8px;border:0"></td></tr>`);
    rows.push(band('MERCADERÍA', BK.blue));
    const hd = v => td(v, `background:${BK.light};color:${BK.navy};font-weight:bold;text-align:center;font-size:9pt;`);
    rows.push(`<tr>${hd('Item')}${hd('Item Description')}${hd('Qty (bags)')}${hd('KG x Bag')}${hd('Total Weight (kg)')}${hd('Gross Weight (kg)')}</tr>`);
    (s.items || []).forEach((i, k) => {
      const q = num(i.qty), net = q * num(i.kgPerBag), gross = net + (num(i.bagsPerPallet) ? q / num(i.bagsPerPallet) * pw : 0);
      const bg = k % 2 ? BK.alt : '#FFFFFF';
      const c2 = (v, al) => td(v, `background:${bg};color:${BK.val};text-align:${al || 'left'};`);
      rows.push(`<tr>${c2(i.item)}${c2(i.description)}${c2(fmtEN(q), 'center')}${c2(fmtEN(num(i.kgPerBag), 2), 'center')}${c2(fmtEN(net, 2), 'right')}${c2(fmtEN(gross, 2), 'right')}</tr>`);
    });
    const tot = (v, al) => td(v, `background:${BK.navy};color:#FFFFFF;font-weight:bold;text-align:${al || 'left'};`);
    rows.push(`<tr><td colspan="4" style="${F}background:${BK.navy};color:#FFFFFF;font-weight:bold;text-align:center;padding:4px 6px;border:1px solid #BFBFBF">TOTAL WEIGHT (kg)</td>${tot(fmtEN(t.net, 2), 'right')}${tot(fmtEN(t.gross, 2), 'right')}</tr>`);
    return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:760px;max-width:100%;margin:6px 0 14px">${'<colgroup><col style="width:150px"><col style="width:200px"><col style="width:120px"><col style="width:100px"><col style="width:95px"><col style="width:95px"></colgroup>'}${rows.join('')}</table>`;
  }
  function bookingBlockText(s) {
    const c = customerOf(s); const t = totals(s);
    const p = (a, b) => (a + ':').padEnd(30) + (b || '-');
    return [
      'SALTWELL SpA — BOOKING REQUEST   (N° Venta: ' + s.n + ')',
      '', 'DATOS DE LA VENTA',
      p('Sales Order Ref', s.soRef), p('ETD', fmtD(s.etd)), p('ETA', fmtD(s.eta)),
      p('Customer Ref', s.customerRef), p('Delivery Terms CL', s.deliveryTerms), p('Port of Discharge', s.pod),
      p('PO Ref (SWAB)', s.poRef), p('Delivery Terms Destino Final', s.destIncoterm), p('Type Container', s.containerType),
      p('Booking Reference', s.bookingRef), p('Forma de Pago', s.paymentTerms), p('Modalidad Venta', s.salesMode),
      '', 'CUSTOMER / CONSIGNEE',
      p('Final Customer', c ? c.name : s.finalCustomer), p('Delivery Address', c && c.address), p('State / City', c && c.city), p('Postal Code', c && c.postal), p('Country', c && c.country),
      '', 'MERCADERÍA',
      ...(s.items || []).map(i => `${i.item}  ${i.description}  |  ${fmtEN(num(i.qty))} bags x ${fmtEN(num(i.kgPerBag), 2)} kg = ${fmtEN(num(i.qty) * num(i.kgPerBag), 2)} kg`),
      `TOTAL WEIGHT (kg): ${fmtEN(t.net, 2)}   Gross: ${fmtEN(t.gross, 2)}`
    ].join('\n');
  }
  const uniqMails = arr => { const seen = new Set(); return arr.filter(m => { const k = m.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }); };
  const splitMails = s => String(s || '').split(/[;,\s]+/).map(x => x.trim().replace(/^<|>$/g, '')).filter(x => /@/.test(x));

  function bookingEmail(shs) {
    const sh = shs[0];
    const fw = S.masters.forwarders.find(f => f.name === sh.forwarder) || {};
    const subjOne = s => [s.customerRef && 'Custom. Ref ' + s.customerRef, s.soRef && 'SO ' + s.soRef, s.poRef && 'PO ' + s.poRef, s.containerType, (short(s.finalCustomer).split(' ')[0] || '')].filter(Boolean).join(' | ');
    const subject = shs.length === 1 ? subjOne(sh) : `Booking ${shs.length} x ${sh.containerType || ''} | ${shs.map(s => 'SO ' + (s.soRef || s.n)).join(' / ')} | ${short(sh.finalCustomer).split(' ')[0]}`;
    const greet = `Estimado ${fw.contact || ''},`.replace(' ,', ',');
    const intro = shs.length > 1 ? S.settings.bookingIntroPlural : S.settings.bookingIntro;
    const sign = S.settings.bookingSign || '';
    modal(`<div class="row" style="justify-content:space-between"><h2>Correo de booking · ${shs.length} contenedor${shs.length > 1 ? 'es' : ''}</h2><button class="btn" data-close>Cerrar</button></div>
      <div class="form" style="grid-template-columns:1fr 1fr">
        <label class="f" for="bkTo">Para (${esc(sh.forwarder || 'sin forwarder')})<input id="bkTo" value="${esc(fw.email || '')}" placeholder="Agrega el correo del forwarder en Maestros"></label>
        <label class="f" for="bkCc">CC<input id="bkCc" value="${esc(uniqMails(splitMails(fw.cc).concat(splitMails(S.settings.internalCc))).join('; '))}"></label>
        <label class="f" for="bkSubj" style="grid-column:1/-1">Asunto<input id="bkSubj" value="${esc(subject)}"></label>
        <label class="f" for="bkGreet">Saludo<input id="bkGreet" value="${esc(greet)}"></label>
        <label class="f" for="bkIntro">Texto<textarea id="bkIntro" rows="2">${esc(intro)}</textarea></label>
        <label class="f" for="bkSign" style="grid-column:1/-1">Firma<textarea id="bkSign" rows="3">${esc(sign)}</textarea></label>
      </div>
      <h3>Vista previa</h3>
      <div id="bkPreview" data-notr style="background:#fff;color:#000;border:1px solid var(--line);border-radius:6px;padding:14px;overflow-x:auto"></div>
      <div class="row">
        <button class="btn primary" id="bkCopyHtml">Copiar correo con formato</button>
        <a class="btn" id="bkMail" href="#" target="_blank" rel="noopener">Abrir en mi correo</a>
        <button class="btn" data-copy="bkTo">Copiar Para</button><button class="btn" data-copy="bkCc">Copiar CC</button><button class="btn" data-copy="bkSubj">Copiar asunto</button>
        <button class="btn" id="bkPdf">PDF Booking Request</button>
        ${S.canWrite ? `<button class="btn" id="bkMark">Marcar como "Booking solicitado"</button>` : ''}
      </div>
      <p class="muted" style="font-size:12px">Abrir en mi correo crea el mensaje con Para, CC, asunto y el texto sin tablas. Para enviarlo con el formato de la hoja Booking, usa Copiar correo con formato y pégalo en el cuerpo del mensaje (Ctrl+V).</p>
      <p class="muted" style="font-size:12px">Si Outlook muestra los CC separados por coma y no los reconoce: en Outlook ve a Archivo › Opciones › Correo › Enviar mensajes y activa la opción de usar comas para separar varios destinatarios. También puedes usar Copiar CC y pegarlos en el campo CC.</p>`, 'wide');
    const html = () => {
      const g = esc($('#bkGreet').value), i = esc($('#bkIntro').value).replace(/\n/g, '<br>'), sg = esc($('#bkSign').value).replace(/\n/g, '<br>');
      const P = 'font-family:Calibri,Arial,sans-serif;font-size:11pt;margin:0 0 8px';
      return `<div><p style="${P}">${g}</p><p style="${P}">${i}</p>${shs.map(bookingBlockHtml).join('')}<p style="${P}">${sg}</p></div>`;
    };
    const text = () => `${$('#bkGreet').value}\n\n${$('#bkIntro').value}\n\n${shs.map(bookingBlockText).join('\n\n------------------------------\n\n')}\n\n${$('#bkSign').value}`;
    const upd = () => {
      $('#bkPreview').innerHTML = html();
      const to = splitMails($('#bkTo').value).join(';'), cc = splitMails($('#bkCc').value).join(';');
      $('#bkMail').href = `mailto:${to}?${cc ? 'cc=' + cc + '&' : ''}subject=${encodeURIComponent($('#bkSubj').value)}&body=${encodeURIComponent(text())}`;
    };
    ['bkTo', 'bkCc', 'bkSubj', 'bkGreet', 'bkIntro', 'bkSign'].forEach(id => $('#' + id).addEventListener('input', upd));
    upd();
    $('#bkCopyHtml').onclick = async () => {
      const h = html(), tx = text();
      try {
        if (!window.ClipboardItem || !navigator.clipboard.write) throw new Error('no-rich');
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([tx], { type: 'text/plain' }) })]);
        toast('Correo copiado con formato. Pégalo en el cuerpo del mensaje.');
      } catch (e) {
        try {
          const pv = $('#bkPreview'); const r = document.createRange(); r.selectNodeContents(pv);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          const ok = document.execCommand('copy'); sel.removeAllRanges();
          if (!ok) throw new Error('copy');
          toast('Correo copiado con formato. Pégalo en el cuerpo del mensaje.');
        } catch (e2) { toast('No se pudo copiar automáticamente: selecciona la vista previa y copia con Ctrl+C.', 6000); }
      }
    };
    $('#bkPdf').onclick = () => openDoc('booking', shs);
    const mk = $('#bkMark');
    if (mk) mk.onclick = async () => {
      mk.disabled = true;
      try {
        for (const s of shs) { if (phase(s) === 'por') { const c = clone(S.ships.get(shipId(s.year, s.n)) || s); c.status = 'Booking solicitado'; await writeShip(c, 'Booking solicitado al forwarder'); } }
        toast('Status actualizado'); closeModal();
      } catch (e) { toast('No se pudo actualizar: ' + (e.message || e.code)); mk.disabled = false; }
    };
  }

  // ---------- Importar PDF ----------
  function viewImport() {
    const aiOk = !!S.sample;
    return `
    <div class="head"><div><h1>Importar SO/PO</h1><div class="sub">Arrastra las Purchase Orders y Sales Orders que recibes. Se leen los datos, se buscan en la base y te muestro qué se va a crear o actualizar antes de guardar.</div></div></div>
    <div class="drop" id="drop">
      <b>Arrastra aquí uno o varios PDF</b>
      <span class="muted">PO de Saltwell AB a Saltwell SpA (SWAB PO Ref) y Sales Order al cliente final (SWAB SO Ref + Customer Ref)</span>
      <label class="btn primary" for="fileIn">Elegir archivos</label><input type="file" id="fileIn" accept="application/pdf,.pdf" multiple hidden>
      <span class="muted" style="font-size:12px">Los PDF de SAP Business One se leen directamente. ${aiOk ? 'Para otros formatos o PDFs escaneados se usa Claude con tu cuenta (te pedirá permiso la primera vez).' : 'La lectura con IA para otros formatos no está disponible en esta vista.'}</span>
    </div>
    ${S.imports.map((im, idx) => importCard(im, idx)).join('')}`;
  }
  function importCard(im, idx) {
    const head = `<div class="row" style="justify-content:space-between"><h2>${esc(im.file.name)}</h2>
      <div class="row">${im.parsed ? `<span class="pill">${im.parsed.docType === 'intercompany' ? 'PO Saltwell AB → SpA' : 'Sales Order cliente'} ${esc(im.parsed.docNo)}</span>` : ''}
      <span class="muted">${im.source === 'ai' ? 'Leído con IA' : im.source === 'parser' ? 'Leído del PDF' : ''}</span>
      <button class="btn small" data-imp-remove="${idx}">Quitar</button></div></div>`;
    if (im.status === 'reading') return `<section class="card">${head}<p class="muted">${esc(im.note || 'Leyendo PDF…')}</p></section>`;
    if (im.status === 'error') return `<section class="card">${head}<div class="banner">${esc(im.error)}</div>${S.sample && im.source !== 'ai' ? `<div><button class="btn" data-imp-ai="${idx}">Leer con IA</button></div>` : ''}</section>`;
    if (im.status === 'applied') return `<section class="card">${head}<div class="banner ok">Guardado en <a href="#e-${im.appliedId}">Embarque N° ${im.appliedId.split('-')[1]}</a>.</div></section>`;
    const P = im.proposal;
    const target = P.targetId ? S.ships.get(P.targetId) : null;
    const rows = P.changes.map((c, i) => `<tr class="${c.changed ? 'chg' : ''}"><td><input type="checkbox" data-imp-chk="${idx}:${i}" ${c.apply ? 'checked' : ''} ${c.changed ? '' : 'disabled'} aria-label="Aplicar ${esc(c.label)}"></td>
      <td>${esc(c.label)}</td><td class="cur wr">${esc(c.curText)}</td><td class="new wr">${esc(c.newText)}</td></tr>`).join('');
    const custWarn = P.unknownCustomer ? `<div class="banner">El cliente <b>${esc(P.unknownCustomer.name)}</b> no está en Maestros. <button class="btn small" data-imp-addcust="${idx}">Agregar a Maestros</button>
      <span class="muted">${esc([P.unknownCustomer.address, P.unknownCustomer.city, P.unknownCustomer.postal, P.unknownCustomer.country].filter(Boolean).join(', '))}</span></div>` : '';
    const options = shipsArr().slice(0, 300).map(s => `<option value="${shipId(s.year, s.n)}" ${P.targetId === shipId(s.year, s.n) ? 'selected' : ''}>N° ${s.n}/${s.year} · ${esc(short(s.finalCustomer))} · SO ${esc(s.soRef || '-')} · PO ${esc(s.poRef || '-')}</option>`).join('');
    return `<section class="card">${head}
      <div class="row"><label class="f" for="impT${idx}" style="min-width:320px">Guardar en
        <select id="impT${idx}" data-imp-target="${idx}"><option value="" data-ui>➕ Nuevo embarque (N° ${nextN(new Date().getFullYear())})</option>${options}</select></label>
        <span class="muted">${target ? `Coincide por ${esc(P.matchedBy)}` : 'No encontré un embarque con estas referencias'}</span></div>
      ${custWarn}
      <div class="tablewrap"><table class="diff"><thead><tr><th></th><th>Campo</th><th>Actual</th><th>Desde el PDF</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="row"><button class="btn primary" data-imp-apply="${idx}" ${S.canWrite ? '' : 'disabled'}>${target ? `Actualizar N° ${target.n}` : 'Crear embarque'}</button>
        ${S.sample && im.source !== 'ai' ? `<button class="btn" data-imp-ai="${idx}">Volver a leer con IA</button>` : ''}
        <span class="muted">El PDF original queda adjunto al embarque${S.assets ? '' : ' (adjuntar no está disponible con tu nivel de acceso)'}.</span></div>
    </section>`;
  }

  function setupDrop() {
    document.addEventListener('dragover', e => { const d = $('#drop'); if (d && d.contains(e.target)) { e.preventDefault(); d.classList.add('over'); } });
    document.addEventListener('dragleave', e => { const d = $('#drop'); if (d && !d.contains(e.relatedTarget)) d.classList.remove('over'); });
    document.addEventListener('dragover', e => { const d = $('#dropBl'); if (d && d.contains(e.target)) { e.preventDefault(); d.classList.add('over'); } });
    document.addEventListener('dragover', e => { const d = $('#dropBk'); if (d && d.contains(e.target)) { e.preventDefault(); d.classList.add('over'); } });
    document.addEventListener('drop', e => {
      const dl = $('#dropBl');
      if (dl && dl.contains(e.target)) { e.preventDefault(); dl.classList.remove('over'); addBLFiles(Array.from(e.dataTransfer.files || [])); return; }
      const dk = $('#dropBk');
      if (dk && dk.contains(e.target)) { e.preventDefault(); dk.classList.remove('over'); addBookingFiles(Array.from(e.dataTransfer.files || [])); return; }
      const d = $('#drop');
      if (!d || !d.contains(e.target)) { e.preventDefault(); return; }
      e.preventDefault(); d.classList.remove('over');
      addFiles(Array.from(e.dataTransfer.files || []));
    });
  }
  function addFiles(files) {
    files = files.filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (!files.length) { toast('Sólo se pueden importar archivos PDF.'); return; }
    if (location.hash !== '#importar') location.hash = '#importar';
    for (const f of files) {
      const im = { file: f, status: 'reading', source: '' };
      S.imports.unshift(im);
      processImport(im);
    }
    render();
  }
  async function pdfItems(file) {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let p = 1; p <= Math.min(pdf.numPages, 4); p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      pages.push({ page, vp, items: tc.items.map(it => ({ x: it.transform[4], y: vp.height - it.transform[5], w: it.width, str: it.str })) });
    }
    return pages;
  }
  async function processImport(im, forceAI) {
    try {
      im.status = 'reading'; im.note = 'Leyendo PDF…'; render();
      const pages = im.pages || (im.pages = await pdfItems(im.file));
      let parsed = null;
      if (!forceAI) {
        parsed = window.SapParser.parseSapOrder(pages[0].items);
        if (parsed.score >= 5 && parsed.docNo) im.source = 'parser'; else parsed = null;
      }
      if (!parsed) {
        if (!S.sample) throw new Error('No reconocí el formato de este PDF y la lectura con IA no está disponible aquí.');
        im.note = 'Leyendo con IA… (puede tardar hasta un minuto)'; render();
        parsed = await aiParse(pages);
        im.source = 'ai';
      }
      im.parsed = parsed;
      im.proposal = buildProposal(parsed);
      im.status = 'ready';
    } catch (e) {
      im.status = 'error';
      im.error = e && e.code === 'not_granted' ? 'No se dio permiso para usar Claude en esta página.' : e && e.code === 'rate_limited' ? 'Demasiadas lecturas seguidas. Espera un momento y vuelve a intentar.' : (e.message || String(e.code || e));
    }
    render();
  }
  async function aiParse(pages) {
    const text = pages.map((p, i) => `--- Página ${i + 1} ---\n` + window.SapParser.linesFromItems(p.items).map(l => l.text).join('\n')).join('\n').slice(0, 60000);
    const schema = `{"docType":"intercompany|customer","docNo":"","customerNo":"","arrivalDate":"YYYY-MM-DD","postingDate":"YYYY-MM-DD","shippingDate":"YYYY-MM-DD","deliveryAddress":["nombre","calle","ciudad","código postal","país"],"customer":["líneas"],"yourOrderNo":"","yourReference":"","ourReference":"","paymentTerms":"","termsOfDelivery":"","transporter":"","lines":[{"itemNo":"","description":"","qty":0,"unit":"","weightKg":0,"price":null}],"remarks":"","etdRemark":"YYYY-MM-DD","etaRemark":"YYYY-MM-DD"}`;
    const instr = `Extrae los datos de una orden comercial de sal (Saltwell). Contexto: Saltwell SpA (Chile) exporta contenedores. Hay dos tipos de documento:
- "intercompany": orden de Saltwell AB (Suecia) a Saltwell SpA; el número del documento es la "SWAB PO Ref". El campo "Your order no." suele venir como "SO//CustomerRef//Cliente".
- "customer": Sales Order de Saltwell AB al cliente final; el número es la "SWAB Sales Order Ref" y "Your order no." es la referencia del cliente.
Usa docType "intercompany" si el cliente del documento es Saltwell SpA. Fechas en formato YYYY-MM-DD; deja "" si no aparecen. qty = número de bolsas/unidades. Responde sólo con JSON con esta forma:\n${schema}`;
    let res;
    const hasText = text.replace(/--- Página \d+ ---/g, '').trim().length > 80;
    if (hasText) res = await S.sample.json(instr + '\n\nTexto del PDF (líneas en orden de lectura):\n' + text, { modelTier: 'default' });
    else {
      const lim = await S.sample.limits().catch(() => null);
      if (!lim || !lim.images) throw new Error('El PDF parece escaneado (sin texto) y esta vista no puede enviar imágenes a Claude.');
      const blobs = [];
      for (const p of pages.slice(0, Math.min(pages.length, lim.images.maxCount || 2))) {
        const vp = p.page.getViewport({ scale: 2 });
        const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
        await p.page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        blobs.push(await new Promise(r => cv.toBlob(r, 'image/png')));
      }
      res = await S.sample.json(instr + '\n\nLas imágenes adjuntas son las páginas del PDF.', { modelTier: 'default', images: blobs });
    }
    if (!res || typeof res !== 'object') throw new Error('La IA no devolvió datos legibles. Intenta de nuevo.');
    const out = Object.assign({ deliveryAddress: [], customer: [], lines: [] }, res);
    out.lines = (Array.isArray(out.lines) ? out.lines : []).map(l => ({ itemNo: String(l.itemNo || ''), description: String(l.description || ''), qty: num(l.qty), weightKg: num(l.weightKg), price: l.price == null ? null : num(l.price), unit: l.unit || '' }));
    out.deliveryAddress = Array.isArray(out.deliveryAddress) ? out.deliveryAddress.map(String) : [];
    out.customer = Array.isArray(out.customer) ? out.customer.map(String) : [];
    out.docNo = String(out.docNo || '');
    if (!out.docNo) throw new Error('La IA no encontró el número de la orden en este PDF.');
    return out;
  }

  function matchCustomer(lines) {
    const cs = S.masters.customers;
    const names = lines.map(normName).filter(Boolean);
    for (const n of names) {
      const exact = cs.find(c => normName(c.name) === n); if (exact) return exact;
    }
    for (const n of names.slice(0, 2)) {
      const c = cs.find(c => { const cn = normName(c.name); return cn && n && (cn.startsWith(n) || n.startsWith(cn)) && Math.min(cn.length, n.length) >= 8; });
      if (c) return c;
    }
    // por dirección
    for (const n of names) {
      const c = cs.find(c => normName(c.address) && normName(c.address) === n); if (c) return c;
    }
    return null;
  }

  function buildProposal(p) {
    const f = {};
    let custHint = null;
    if (p.docType === 'intercompany') {
      f.poRef = p.docNo;
      const parts = String(p.yourOrderNo || '').split(/\/\/|\s\/\s/).map(s => s.trim());
      if (parts[0] && /^\d{4,}$/.test(parts[0])) f.soRef = parts[0];
      if (parts[1]) f.customerRef = parts[1];
      f.etd = p.etdRemark || p.shippingDate || '';
      f.eta = p.etaRemark || p.arrivalDate || '';
      if (p.postingDate) f.orderDate = p.postingDate;
      custHint = matchCustomer(p.deliveryAddress.concat(parts[2] ? [parts[2]] : []));
    } else {
      f.soRef = p.docNo;
      if (p.yourOrderNo) f.customerRef = p.yourOrderNo;
      if (p.termsOfDelivery) f.destIncoterm = p.termsOfDelivery;
      f.etd = p.shippingDate || p.etdRemark || '';
      f.eta = p.arrivalDate || p.etaRemark || '';
      if (p.postingDate) f.orderDate = p.postingDate;
      custHint = matchCustomer(p.deliveryAddress.concat(p.customer));
    }
    let unknownCustomer = null;
    if (custHint) f.finalCustomer = custHint.name;
    else if (p.docType === 'customer') {
      const a = window.SapParser.splitAddress(p.deliveryAddress.length ? p.deliveryAddress : p.customer);
      if (a.name) { unknownCustomer = a; f.finalCustomer = a.name; }
    }
    const items = (p.lines || []).filter(l => l.itemNo).map(l => {
      const it = itemFromMaster(l.itemNo, l.qty);
      if (!it.description) it.description = l.description;
      if (!it.kgPerBag && l.weightKg && l.qty) it.kgPerBag = Math.round(l.weightKg / l.qty * 100) / 100;
      if (p.docType === 'intercompany' && l.price) it.price = num(l.price);
      return it;
    });
    if (items.length) f.items = items;
    Object.keys(f).forEach(k => { if (f[k] === '' || f[k] == null) delete f[k]; });

    // buscar embarque existente
    let targetId = null, matchedBy = '';
    const arr = shipsArr();
    const hit = (pred, why) => { if (targetId) return; const s = arr.find(pred); if (s) { targetId = shipId(s.year, s.n); matchedBy = why; } };
    if (f.soRef) hit(s => s.soRef && s.soRef === f.soRef, 'SO ' + f.soRef);
    if (f.poRef) hit(s => s.poRef && s.poRef === f.poRef, 'PO ' + f.poRef);
    if (f.customerRef && f.finalCustomer) hit(s => s.customerRef === f.customerRef && s.finalCustomer === f.finalCustomer, 'Customer Ref ' + f.customerRef);
    const P = { fields: f, targetId, matchedBy, unknownCustomer, changes: [] };
    computeChanges(P);
    return P;
  }
  function itemsText(items) { return (items || []).map(i => `${i.item} × ${fmt(i.qty)}${i.description ? ' (' + i.description + ')' : ''}`).join('; '); }
  function computeChanges(P) {
    const base = P.targetId ? S.ships.get(P.targetId) : null;
    const f = P.fields;
    P.changes = Object.keys(f).map(k => {
      const cur = base ? base[k] : undefined;
      const isItems = k === 'items';
      let changed;
      if (isItems) changed = !base || !(base.items || []).length || itemsText(base.items.map(i => ({ item: i.item, qty: i.qty }))) !== itemsText(f.items.map(i => ({ item: i.item, qty: i.qty })));
      else changed = String(cur == null ? '' : cur) !== String(f[k]);
      const curEmpty = isItems ? !(cur && cur.length) : (cur == null || cur === '');
      return { key: k, label: FIELD_LABEL[k] || k, curText: isItems ? itemsText(cur) : (k === 'etd' || k === 'eta' || k === 'orderDate' ? fmtD(cur) : (cur == null ? '' : String(cur))),
        newText: isItems ? itemsText(f[k]) : (k === 'etd' || k === 'eta' || k === 'orderDate' ? fmtD(f[k]) : String(f[k])),
        changed, apply: changed && (curEmpty || !base || (k !== 'orderDate' && k !== 'items')) };
    });
  }

  async function applyImport(idx) {
    const im = S.imports[idx]; if (!im || !im.proposal) return;
    const P = im.proposal;
    const btn = $(`[data-imp-apply="${idx}"]`); if (btn) btn.disabled = true;
    try {
      let sh, isNew = false;
      if (P.targetId && S.ships.get(P.targetId)) sh = clone(S.ships.get(P.targetId));
      else {
        const y = new Date().getFullYear();
        sh = emptyShip(y, nextN(y)); isNew = true;
      }
      const applied = [];
      for (const c of P.changes) {
        if (!c.apply) continue;
        if (c.key === 'items') {
          const prev = sh.items || [];
          sh.items = P.fields.items.map(ni => {
            const old = prev.find(o => String(o.item) === String(ni.item));
            return old ? Object.assign({}, ni, { batch: old.batch || '', price: old.price || ni.price, bagsPerPallet: old.bagsPerPallet || ni.bagsPerPallet }) : ni;
          });
        } else sh[c.key] = P.fields[c.key];
        applied.push(c.label);
      }
      if (isNew && sh.finalCustomer) {
        const d = defaultsFromCustomer(sh, sh.finalCustomer);
        for (const k of Object.keys(d)) {
          if (k === '_prevItems') { (sh.items || []).forEach(it => { const o = d._prevItems.find(p => String(p.item) === String(it.item)); if (o) { it.price = o.price || it.price; it.bagsPerPallet = o.bagsPerPallet || it.bagsPerPallet; } }); }
          else if (!(k === 'destIncoterm' && sh.destIncoterm)) sh[k] = d[k];
        }
      }
      if (S.assets) {
        try {
          const up = await S.assets.upload(im.file);
          sh.attachments = (sh.attachments || []).concat([{ id: up.id, name: im.file.name, kind: im.parsed.docType === 'intercompany' ? 'PO SWAB' : 'SO cliente', at: new Date().toISOString() }]);
        } catch (e) { toast('El PDF no se pudo adjuntar (' + (e.message || e.code) + '), pero los datos se guardarán.'); }
      }
      const docLbl = (im.parsed.docType === 'intercompany' ? 'PO ' : 'SO ') + im.parsed.docNo;
      let id;
      if (isNew) id = await createShip(sh, `Creado desde PDF ${docLbl}`);
      else id = await writeShip(sh, `Actualizado desde PDF ${docLbl}: ${applied.slice(0, 4).join(', ')}${applied.length > 4 ? '…' : ''}`);
      im.status = 'applied'; im.appliedId = id;
      // re-evaluar otras importaciones pendientes (p. ej. la PO que corresponde a la SO recién creada)
      S.imports.forEach(o => { if (o !== im && o.status === 'ready') { const np = buildProposal(o.parsed); if (!o.userTarget) o.proposal = np; else { o.proposal.targetId = o.userTarget; computeChanges(o.proposal); } } });
      render();
    } catch (e) {
      toast('No se pudo guardar: ' + (e.message || e.code || e));
      if (btn) btn.disabled = false;
    }
  }

  // ---------- Bookings ----------
  // 40' y 40' HC (45G1/45GP) se consideran el mismo tipo; 20' es otro
  const ctFamily = t => { const c = String(t || '').toUpperCase().replace(/[\s'´`"]/g, ''); if (!c) return ''; if (/^(4|45)/.test(c)) return '40'; if (/^2/.test(c)) return '20'; return c; };
  const sameCtype = (a, b) => !a || !b || ctFamily(a) === ctFamily(b);
  const bookingId = ref => String(ref || '').trim().replace(/[^A-Za-z0-9_\-.~:@+]/g, '-');
  const bookingOf = sh => sh && sh.bookingRef ? S.bookings.get(bookingId(sh.bookingRef)) || null : null;
  const compact = s => normName(s).replace(/ /g, '');
  function matchMaster(list, raw) {
    if (!raw) return '';
    const r = normName(raw), rc = compact(raw);
    let hit = list.find(x => normName(x) === r);
    if (!hit) hit = list.find(x => { const xc = compact(x); return xc.length >= 4 && (rc.startsWith(xc) || xc.startsWith(rc.slice(0, Math.max(8, xc.length - 1)))); });
    if (!hit) hit = list.find(x => { const xc = compact(x); return xc.length >= 6 && rc.includes(xc); });
    return hit || '';
  }
  const BK_FIELDS = [['bookingRef', 'Booking reference', 'text'], ['carrier', 'Carrier', 'text'], ['forwarder', 'Forwarder', 'text'], ['vessel', 'Vessel / viaje', 'text'],
    ['pol', 'Port of loading', 'text'], ['pod', 'Port of discharge', 'text'], ['etd', 'ETD', 'date'], ['eta', 'ETA', 'date'], ['containerType', 'Tipo contenedor', 'text'],
    ['stackingStart', 'Inicio stacking', 'date'], ['stackingEnd', 'Cierre stacking', 'date'], ['siCutoff', 'Cierre documental (SI)', 'date'], ['vgmCutoff', 'Cierre VGM', 'date'], ['blNo', 'N° BL', 'text']];
  const COPY_KEYS = ['bookingRef', 'carrier', 'forwarder', 'vessel', 'pol', 'pod', 'etd', 'eta', 'stackingStart', 'stackingEnd'];

  function shipErrors(sh) {
    const e = [];
    if (sh.stackingStart && sh.stackingEnd && sh.stackingStart > sh.stackingEnd) e.push('El inicio de stacking es posterior al cierre de stacking.');
    if (sh.deliveryDate && ((sh.stackingStart && sh.deliveryDate < sh.stackingStart) || (sh.stackingEnd && sh.deliveryDate > sh.stackingEnd)))
      e.push(`La fecha de entrega en puerto (${fmtD(sh.deliveryDate)}) debe estar dentro del stacking (${fmtD(sh.stackingStart) || '…'} a ${fmtD(sh.stackingEnd) || '…'}).`);
    return e;
  }

  function newBookingObj(form, links, extra) {
    return Object.assign({ status: 'ready', form, links: new Set(links || []), typeFix: new Set(), setReserved: true, equipment: [] }, extra || {});
  }
  function bookingFromDoc(b) {
    const f = {}; BK_FIELDS.forEach(([k]) => { f[k] = b[k] || ''; });
    return newBookingObj(f, b.shipments || [], { existing: b, equipment: b.equipment || [], attachments: b.attachments || [] });
  }
  function formFromParsed(p) {
    const fwNames = S.masters.forwarders.map(f => f.name);
    const vessel = [p.vessel, p.voyage].filter(Boolean).join(' ');
    return {
      bookingRef: p.bookingRef || '', carrier: matchMaster(S.masters.carriers, p.carrier) || p.carrier || '', forwarder: matchMaster(fwNames, p.forwarder) || '',
      vessel, pol: matchMaster(S.masters.pols, p.pol) || p.pol || '', pod: matchMaster(S.masters.pods, p.pod) || p.pod || '', etd: p.etd || '', eta: p.eta || '',
      containerType: p.containerType || '', stackingStart: p.stackingStart || '', stackingEnd: p.stackingEnd || '', siCutoff: p.siCutoff || '', vgmCutoff: p.vgmCutoff || '', blNo: p.blNo || ''
    };
  }

  function viewBookings() {
    const BKC = { bookingRef: [0, 'Booking', 'text', b => b.bookingRef], carrier: [0, 'Carrier', 'text', b => b.carrier], forwarder: [0, 'Forwarder', 'text', b => b.forwarder], vessel: [0, 'Nave', 'text', b => b.vessel],
      route: [0, 'Ruta', 'text', b => (b.pol || '') + ' ' + (b.pod || '')], etd: [0, 'ETD', 'date', b => b.etd], eta: [0, 'ETA', 'date', b => b.eta], stackingEnd: [0, 'Cierre stacking', 'date', b => b.stackingEnd],
      equipment: [0, 'Equipos', 'num', b => (b.equipment || []).reduce((a, e) => a + num(e.qty), 0)], ships: [0, 'Embarques', 'num', b => (b.shipments || []).length] };
    const list = sortRows(Array.from(S.bookings.values()), S.bkList.sort, BKC);
    const rows = list.map(b => {
      const ships = (b.shipments || []).map(id => S.ships.get(id)).filter(Boolean);
      return `<tr class="click" data-openbk="${esc(bookingId(b.bookingRef))}"><td class="mono">${esc(b.bookingRef)}</td><td>${esc(b.carrier)}</td><td>${esc(b.forwarder)}</td><td>${esc(b.vessel)}</td>
        <td>${esc(b.pol)} → ${esc(b.pod)}</td><td class="mono">${fmtD(b.etd)}</td><td class="mono">${fmtD(b.eta)}</td><td class="mono">${fmtD(b.stackingEnd)}</td>
        <td>${esc((b.equipment || []).map(e => e.qty + ' x ' + e.type).join(', '))}</td><td>${ships.map(s => 'N° ' + s.n).join(', ') || '<span class="muted">—</span>'}</td>
        <td>${(b.attachments || []).length ? 'PDF' : ''}</td></tr>`;
    }).join('');
    return `
    <div class="head"><div><h1>Importar Booking</h1><div class="sub">Sube la confirmación de booking de la naviera: se leen nave, viaje, ETD/ETA, stacking, cierres y N° de booking, y se asocia a una o varias órdenes.</div></div></div>
    <div class="drop" id="dropBk">
      <b>Arrastra aquí la confirmación de booking (PDF)</b>
      <span class="muted">Un booking puede asociarse a uno o varios contenedores (órdenes).</span>
      <label class="btn primary" for="fileBk">Elegir archivos</label><input type="file" id="fileBk" accept="application/pdf,.pdf" multiple hidden>
    </div>
    ${S.bkImports.map((im, i) => bookingCard(im, 'i' + i)).join('')}
    <section class="card"><h2>Bookings registrados</h2>
      <div class="tablewrap"><table><thead><tr>${Object.entries(BKC).map(([k, c]) => sortTh('bk', k, c[1], S.bkList.sort)).join('')}<th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="11" class="empty">Aún no hay bookings importados.</td></tr>'}</tbody></table></div></section>`;
  }
  function viewBookingDetail() {
    const b = S.bookings.get(S.param);
    if (!b) return `<div class="banner">No encontré el booking ${esc(S.param)}.</div><p><a href="#bookings">Volver a Bookings</a></p>`;
    if (!S.bkEdit || S.bkEdit.id !== S.param) S.bkEdit = Object.assign(bookingFromDoc(b), { id: S.param });
    return `<div class="head"><div><h1>Booking ${esc(b.bookingRef)}</h1><div class="sub">${esc(b.carrier)} · ${esc(b.vessel)} · ${esc(b.pol)} → ${esc(b.pod)}</div></div>
      <div class="row"><a class="btn" href="#bookings">Volver a Bookings</a>${S.canWrite ? '<button class="btn danger" data-action="delBooking">Eliminar booking</button>' : ''}</div></div>
      ${bookingCard(S.bkEdit, 'ed')}`;
  }
  const bkObj = key => key === 'ed' ? S.bkEdit : S.bkImports[+key.slice(1)];

  function bookingCard(im, key) {
    const dis = S.canWrite ? '' : 'disabled';
    const head = im.file ? `<div class="row" style="justify-content:space-between"><h2>${esc(im.file.name)}</h2><div class="row"><span class="muted">${im.source === 'ai' ? 'Leído con IA' : im.source === 'parser' ? 'Leído del PDF' : ''}</span><button class="btn small" data-bkremove="${key}">Quitar</button></div></div>` : '';
    if (im.status === 'reading') return `<section class="card">${head}<p class="muted">${esc(im.note || 'Leyendo PDF…')}</p></section>`;
    if (im.status === 'error') return `<section class="card">${head}<div class="banner">${esc(im.error)}</div>${S.sample && im.source !== 'ai' ? `<div><button class="btn" data-bkai="${key}">Leer con IA</button></div>` : ''}</section>`;
    if (im.status === 'applied') return `<section class="card">${head}<div class="banner ok">Booking <a href="#bk-${esc(bookingId(im.form.bookingRef))}">${esc(im.form.bookingRef)}</a> guardado y asociado a ${im.appliedCount} embarque${im.appliedCount === 1 ? '' : 's'}.</div>
      <div class="row">${(im.appliedIds || []).filter(id => S.ships.has(id)).map(id => `<a class="btn small" href="#e-${id}">Abrir N° ${S.ships.get(id).n}</a>`).join('')}</div></section>`;
    const f = im.form;
    const existing = im.file && f.bookingRef ? S.bookings.get(bookingId(f.bookingRef)) : null;
    const fields = BK_FIELDS.map(([k, l, ty]) => {
      const lst = k === 'carrier' ? 'dlCarriers' : k === 'forwarder' ? 'dlForwarders' : k === 'pol' ? 'dlPols' : k === 'pod' ? 'dlPods' : k === 'containerType' ? 'dlCtypes' : '';
      return `<label class="f" for="bk_${key}_${k}">${l}<input id="bk_${key}_${k}" type="${ty}" data-bkf="${key}:${k}" value="${esc(f[k])}" ${lst ? `list="${lst}"` : ''} ${dis}></label>`;
    }).join('');
    const eqTotal = (im.equipment || []).reduce((a, e) => a + num(e.qty), 0);
    // candidatos: ya vinculados + mismo booking + activos sin booking
    const ids = new Set(im.links);
    shipsArr().forEach(s => { if (f.bookingRef && s.bookingRef === f.bookingRef) ids.add(shipId(s.year, s.n)); });
    const cands = shipsArr().filter(s => !ids.has(shipId(s.year, s.n)) && ['por', 'sol'].includes(phase(s)) && (!s.bookingRef || s.bookingRef === f.bookingRef))
      .sort((a, b) => {
        const podA = f.pod && normName(a.pod) === normName(f.pod) ? 0 : 1, podB = f.pod && normName(b.pod) === normName(f.pod) ? 0 : 1;
        if (podA !== podB) return podA - podB;
        const da = Math.abs(daysFrom(a.etd || '2100-01-01') - daysFrom(f.etd || todayISO())), db = Math.abs(daysFrom(b.etd || '2100-01-01') - daysFrom(f.etd || todayISO()));
        return da - db;
      }).slice(0, 12);
    const rowFor = (s, linked) => {
      const id = shipId(s.year, s.n);
      const ct = f.containerType, typeBad = ct && s.containerType && !sameCtype(ct, s.containerType);
      const probe = Object.assign({}, s, { stackingStart: f.stackingStart || s.stackingStart, stackingEnd: f.stackingEnd || s.stackingEnd });
      const warns = [];
      if (typeBad) warns.push(`Tipo distinto: orden ${s.containerType} · booking ${ct}`);
      if (s.bookingRef && f.bookingRef && s.bookingRef !== f.bookingRef) warns.push(`Tiene otro booking: ${s.bookingRef}`);
      shipErrors(probe).forEach(w => warns.push(w));
      return `<tr><td><input type="checkbox" data-bklink="${key}:${id}" ${im.links.has(id) ? 'checked' : ''} ${dis} aria-label="Asociar N° ${s.n}"></td>
        <td class="mono"><a href="#e-${id}">${s.n}</a></td><td class="mono">${esc(s.soRef)}</td><td class="mono">${esc(s.poRef)}</td><td>${esc(short(s.finalCustomer))}</td><td>${esc(s.pod)}</td><td class="mono">${fmtD(s.etd)}</td><td>${esc(s.containerType)}</td>
        <td class="wr">${warns.map(w => `<div style="color:var(--amber)">${esc(w)}</div>`).join('')}${typeBad ? `<label class="row" style="gap:6px;font-size:12px"><input type="checkbox" data-bktype="${key}:${id}" ${im.typeFix.has(id) ? 'checked' : ''} ${dis}> <span>Cambiar la orden a ${esc(ct)}</span></label>` : ''}</td>
        <td><a class="btn small" href="#e-${id}">Abrir N° ${s.n}</a></td></tr>`;
    };
    const linkedRows = Array.from(ids).map(id => S.ships.get(id)).filter(Boolean).map(s => rowFor(s, true)).join('');
    const candRows = cands.map(s => rowFor(s, false)).join('');
    const nLinked = im.links.size;
    const countWarn = eqTotal && nLinked && eqTotal !== nLinked ? `<div class="banner">El booking indica ${eqTotal} contenedor${eqTotal === 1 ? '' : 'es'} y hay ${nLinked} orden${nLinked === 1 ? '' : 'es'} seleccionada${nLinked === 1 ? '' : 's'}.</div>` : '';
    const allOpts = shipsArr().filter(s => !ids.has(shipId(s.year, s.n)) && phase(s) !== 'done').slice(0, 300).map(s => `<option value="${shipId(s.year, s.n)}">N° ${s.n}/${s.year} · ${esc(short(s.finalCustomer))} · SO ${esc(s.soRef || '-')} · PO ${esc(s.poRef || '-')}</option>`).join('');
    const atts = (im.attachments || []).map(a => `<div class="att"><span class="pill">PDF</span><a href="/_blob/${esc(a.id)}" target="_blank" rel="noopener">${esc(a.name)}</a><span class="muted">${fmtD((a.at || '').slice(0, 10))}</span></div>`).join('');
    return `<section class="card">${head}
      ${existing && !im.existing ? `<div class="banner info">Este booking ya existe: al guardar se actualizan sus datos y se agrega este PDF.</div>` : ''}
      <div class="form">${fields}</div>
      ${(im.equipment || []).length ? `<div class="muted">Equipos en el booking: <b>${esc(im.equipment.map(e => e.qty + ' x ' + e.type).join(', '))}</b></div>` : ''}
      <h3>Órdenes asociadas</h3>
      ${countWarn}
      <div class="tablewrap"><table><thead><tr><th></th><th>N°</th><th>SO</th><th>PO</th><th>Cliente</th><th>POD</th><th>ETD</th><th>Tipo</th><th>Avisos</th><th></th></tr></thead>
        <tbody>${linkedRows}${candRows ? `<tr class="group"><td colspan="10">Sugeridas (por reservar, mismo destino y ETD cercana)</td></tr>${candRows}` : ''}${!linkedRows && !candRows ? '<tr><td colspan="10" class="empty">No hay órdenes pendientes de booking.</td></tr>' : ''}</tbody></table></div>
      <div class="row"><label class="f" for="bkadd_${key}" style="min-width:360px">Asociar otra orden<select id="bkadd_${key}" data-bkadd="${key}" ${dis}><option value="" data-ui>Elegir…</option>${allOpts}</select></label></div>
      <label class="row" style="gap:6px"><input type="checkbox" data-bkres="${key}" ${im.setReserved ? 'checked' : ''} ${dis}> <span>Cambiar status a "Reservado" en las órdenes por reservar</span></label>
      ${atts ? `<div><h3>PDF del booking</h3>${atts}</div>` : ''}
      <div class="row"><button class="btn primary" data-bksave="${key}" ${dis}>${im.existing ? `Guardar y actualizar ${nLinked} orden${nLinked === 1 ? '' : 'es'}` : `Guardar booking y actualizar ${nLinked} orden${nLinked === 1 ? '' : 'es'}`}</button>
        ${im.file && S.sample && im.source !== 'ai' ? `<button class="btn" data-bkai="${key}">Volver a leer con IA</button>` : ''}
        <span class="muted">Se copian a cada orden: booking, carrier, forwarder, nave, puertos, ETD/ETA y stacking${f.blNo ? '; el BL de la naviera queda como MBL' : ''}.</span></div>
    </section>`;
  }
  function bookingDatalists() {
    const o = arr => arr.map(v => `<option value="${esc(v)}"></option>`).join('');
    return `<datalist id="dlCarriers">${o(S.masters.carriers)}</datalist><datalist id="dlForwarders">${o(S.masters.forwarders.map(f => f.name))}</datalist><datalist id="dlPols">${o(S.masters.pols)}</datalist><datalist id="dlPods">${o(S.masters.pods)}</datalist><datalist id="dlCtypes">${o(S.masters.containerTypes)}</datalist>`;
  }

  function addBookingFiles(files) {
    files = files.filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (!files.length) { toast('Sólo se pueden importar archivos PDF.'); return; }
    for (const f of files) { const im = newBookingObj({}, [], { file: f, status: 'reading' }); S.bkImports.unshift(im); processBooking(im); }
    render();
  }
  async function processBooking(im, forceAI) {
    try {
      im.status = 'reading'; im.note = 'Leyendo PDF…'; render();
      const pages = im.pages || (im.pages = await pdfItems(im.file));
      let p = null;
      if (!forceAI) { p = window.SapParser.parseBooking(pages, im.file.name); if (p.score >= 5) im.source = 'parser'; else p = null; }
      if (!p) {
        if (!S.sample) throw new Error('No reconocí el formato de este booking y la lectura con IA no está disponible aquí.');
        im.note = 'Leyendo con IA… (puede tardar hasta un minuto)'; render();
        p = await aiBooking(pages); im.source = 'ai';
      }
      im.parsed = p; im.form = formFromParsed(p); im.equipment = p.equipment || [];
      const ex = S.bookings.get(bookingId(im.form.bookingRef));
      im.links = new Set(ex ? (ex.shipments || []) : []);
      shipsArr().forEach(s => { if (im.form.bookingRef && s.bookingRef === im.form.bookingRef) im.links.add(shipId(s.year, s.n)); });
      im.attachments = ex ? (ex.attachments || []) : [];
      im.status = 'ready';
    } catch (e) {
      im.status = 'error';
      im.error = e && e.code === 'not_granted' ? 'No se dio permiso para usar Claude en esta página.' : e && e.code === 'rate_limited' ? 'Demasiadas lecturas seguidas. Espera un momento y vuelve a intentar.' : (e.message || String(e.code || e));
    }
    render();
  }
  async function aiBooking(pages) {
    const text = pages.map((p, i) => `--- Página ${i + 1} ---\n` + window.SapParser.linesFromItems(p.items).map(l => l.text).join('\n')).join('\n').slice(0, 60000);
    const schema = '{"bookingRef":"","carrier":"","forwarder":"(quien hizo la reserva)","vessel":"","voyage":"","etd":"YYYY-MM-DD","eta":"YYYY-MM-DD","pol":"","pod":"","equipment":[{"qty":1,"type":"40HC"}],"stackingStart":"YYYY-MM-DD","stackingEnd":"YYYY-MM-DD","siCutoff":"YYYY-MM-DD","vgmCutoff":"YYYY-MM-DD","blNo":""}';
    const instr = `Extrae los datos de esta confirmación de booking de una naviera (exportación de contenedores desde Chile). stackingEnd es la última fecha de entrega del contenedor en el terminal (FCL delivery / CY cut-off); stackingStart la primera fecha de recepción si aparece. pol/pod: nombre del puerto sin el código UN/LOCODE. Deja "" lo que no aparezca. Responde sólo con JSON con esta forma:\n${schema}\n\nTexto del PDF:\n${text}`;
    const r = await S.sample.json(instr, { modelTier: 'default' });
    if (!r || typeof r !== 'object' || !r.bookingRef) throw new Error('La IA no encontró el N° de booking en este PDF.');
    r.equipment = Array.isArray(r.equipment) ? r.equipment.map(e => ({ qty: num(e.qty) || 1, type: String(e.type || '').toUpperCase() })) : [];
    r.containerType = r.equipment[0] ? window.SapParser.containerTypeFrom(r.equipment[0].type) : '';
    ['etd', 'eta', 'stackingStart', 'stackingEnd', 'siCutoff', 'vgmCutoff'].forEach(k => { r[k] = window.SapParser.parseDate(r[k] || ''); });
    return r;
  }

  async function saveBooking(key) {
    const im = bkObj(key); if (!im) return;
    const f = im.form;
    if (!f.bookingRef) { toast('Falta el N° de booking.'); return; }
    const btn = $(`[data-bksave="${key}"]`); if (btn) btn.disabled = true;
    try {
      const id = bookingId(f.bookingRef);
      const prev = S.bookings.get(id) || (im.existing || null);
      let attachments = (prev && prev.attachments) || [];
      if (im.file && S.assets) {
        try { const up = await S.assets.upload(im.file); attachments = attachments.concat([{ id: up.id, name: im.file.name, at: new Date().toISOString() }]); }
        catch (e) { toast('El PDF no se pudo adjuntar (' + (e.message || e.code) + '), pero los datos se guardarán.'); }
      }
      const links = Array.from(im.links).filter(sid => S.ships.has(sid));
      const doc = Object.assign({}, f, { equipment: im.equipment || (prev && prev.equipment) || [], attachments, shipments: links, updatedAt: new Date().toISOString(), updatedBy: S.me || '' });
      if (!prev) doc.createdAt = doc.updatedAt;
      await S.db.doc('bookings/' + id).set(doc);
      S.bookings.set(id, doc);
      // actualizar órdenes asociadas
      for (const sid of links) {
        const s = clone(S.ships.get(sid));
        COPY_KEYS.forEach(k => { if (f[k]) s[k] = f[k]; });
        if (f.blNo && !s.mblNo) s.mblNo = f.blNo;
        if (im.typeFix.has(sid) && f.containerType) s.containerType = f.containerType;
        if (im.setReserved && ['por', 'sol'].includes(phase(s))) s.status = 'Reservado';
        await writeShip(s, `Booking ${f.bookingRef} asociado (${f.vessel || ''} ETD ${fmtD(f.etd)})`);
      }
      // órdenes que dejaron de estar asociadas
      for (const sid of ((prev && prev.shipments) || [])) {
        if (links.includes(sid) || !S.ships.has(sid)) continue;
        const s = clone(S.ships.get(sid));
        if (s.bookingRef === f.bookingRef) { s.bookingRef = ''; await writeShip(s, `Desasociado del booking ${f.bookingRef}`); }
      }
      if (key === 'ed') { S.bkEdit = null; toast('Booking guardado'); render(); }
      else { im.status = 'applied'; im.appliedCount = links.length; im.appliedIds = links; render(); }
    } catch (e) {
      toast('No se pudo guardar: ' + (e.message || e.code || e));
      if (btn) btn.disabled = false;
    }
  }

  // ---------- Bills of Lading (draft / final) ----------
  const blId = no => String(no || '').trim().replace(/[^A-Za-z0-9_\-.~:@+]/g, '-');
  const blOf = sh => sh && sh.blNo ? S.bls.get(blId(sh.blNo)) || null : null;
  const ck = s => window.SapParser.contKey(s);
  const ctypeOf = t => window.SapParser.containerTypeFrom(t);
  function matchContainer(c, taken) {
    const arr = shipsArr().filter(s => !taken.has(shipId(s.year, s.n)));
    let s = arr.find(x => x.containerNo && ck(x.containerNo) === c.key);
    if (!s && c.po) s = arr.find(x => x.poRef && x.poRef === c.po);
    if (!s && c.so) s = arr.find(x => x.soRef && x.soRef === c.so);
    return s ? shipId(s.year, s.n) : '';
  }
  function blWarnings(c, s, bl) {
    const w = [];
    if (!s) return w;
    if (s.containerNo && ck(s.containerNo) !== c.key) w.push(`Contenedor en la orden: ${s.containerNo}`);
    if (s.sealNo && c.seal && ck(s.sealNo) !== ck(c.seal)) w.push(`Sello distinto: orden ${s.sealNo} · BL ${c.seal}`);
    if (c.po && s.poRef && c.po !== s.poRef) w.push(`PO distinta: orden ${s.poRef} · BL ${c.po}`);
    const t = totals(s);
    if (c.bags && t.bags && Math.abs(c.bags - t.bags) > 0.5) w.push(`Bolsas: orden ${fmt(t.bags)} · BL ${fmt(c.bags)}`);
    if (c.gross && t.gross && Math.abs(c.gross - t.gross) > 1) w.push(`Peso bruto: orden ${fmt(t.gross, 2)} · BL ${fmt(c.gross, 2)}`);
    const bt = ctypeOf(c.type); if (bt && s.containerType && !sameCtype(bt, s.containerType)) w.push(`Tipo: orden ${s.containerType} · BL ${c.type}`);
    if (bl.pod && s.pod && !normName(s.pod).includes(normName(bl.pod).split(' ')[0]) && !normName(bl.pod).includes(normName(s.pod).split(' ')[0])) w.push(`POD: orden ${s.pod} · BL ${bl.pod}`);
    if (s.blNo && s.blNo !== bl.blNo) w.push(`La orden tiene otro BL: ${s.blNo}`);
    return w;
  }
  const BL_SUM = [['blNo', 'N° BL'], ['reference', 'Referencia'], ['vessel', 'Nave'], ['pol', 'Port of loading'], ['pod', 'Port of discharge'], ['placeDelivery', 'Lugar de entrega'],
    ['onboardDate', 'Shipped on board'], ['issueDate', 'Fecha de emisión'], ['freightTerms', 'Flete'], ['freight', 'Flete pagadero en']];
  function blCompare(prev, cur) {
    const d = [];
    BL_SUM.forEach(([k, l]) => { if ((prev[k] || '') !== (cur[k] || '')) d.push(`${l}: ${prev[k] || '—'} → ${cur[k] || '—'}`); });
    if ((prev.notify || []).join('|') !== (cur.notify || []).join('|')) d.push('Notify: cambió');
    (cur.containers || []).forEach(c => { const p = (prev.containers || []).find(x => x.key === c.key || ck(x.containerNo) === c.key); if (!p) d.push(`Contenedor nuevo: ${c.containerNo}`); else ['seal', 'po', 'bags', 'gross'].forEach(k => { if (String(p[k] || '') !== String(c[k] || '')) d.push(`${c.containerNo} ${k}: ${p[k] || '—'} → ${c[k] || '—'}`); }); });
    return d;
  }

  function viewBLs() {
    const BLC = { blNo: [0, 'N° BL', 'text', b => b.blNo], kind: [0, 'Estado', 'text', b => b.kind], vessel: [0, 'Nave', 'text', b => b.vessel], route: [0, 'Ruta', 'text', b => (b.pol || '') + ' ' + (b.pod || '')],
      onboardDate: [0, 'Shipped on board', 'date', b => b.onboardDate], containers: [0, 'Contenedores', 'num', b => (b.containers || []).length], ships: [0, 'Embarques', 'num', b => (b.shipments || []).length] };
    const list = sortRows(Array.from(S.bls.values()), S.blList.sort, BLC);
    const rows = list.map(b => `<tr class="click" data-openbl="${esc(blId(b.blNo))}"><td class="mono">${esc(b.blNo)}</td><td>${blPill(b.kind)}</td><td>${esc(b.vessel)}</td><td>${esc(b.pol)} → ${esc(b.pod)}</td><td class="mono">${fmtD(b.onboardDate)}</td>
      <td class="mono">${esc((b.containers || []).map(c => c.containerNo).join(', '))}</td><td>${(b.shipments || []).map(id => (S.ships.get(id) || {}).n).filter(Boolean).map(n => 'N° ' + n).join(', ')}</td><td>${esc((b.attachments || []).map(a => a.kind === 'final' ? 'Final' : 'Draft').join(' + '))}</td></tr>`).join('');
    return `
    <div class="head"><div><h1>Importar BL</h1><div class="sub">Sube el Draft de BL y luego el BL final (no negociable). Se leen N° de BL, nave, puertos, contenedores, sellos, PO y pesos, y se asocia cada contenedor a su embarque.</div></div></div>
    <div class="drop" id="dropBl"><b>Arrastra aquí el BL o HBL (PDF)</b><span class="muted">Un BL puede incluir uno o varios contenedores. El draft se reconoce por la marca de agua DRAFT.</span>
      <label class="btn primary" for="fileBl">Elegir archivos</label><input type="file" id="fileBl" accept="application/pdf,.pdf" multiple hidden></div>
    ${S.blImports.map((im, i) => blCard(im, 'i' + i)).join('')}
    <section class="card"><h2>BL registrados</h2><div class="tablewrap"><table><thead><tr>${Object.entries(BLC).filter(([k]) => k !== 'containers' && k !== 'ships').map(([k, c]) => sortTh('bl', k, c[1], S.blList.sort)).join('')}${sortTh('bl', 'containers', 'Contenedores', S.blList.sort)}${sortTh('bl', 'ships', 'Embarques', S.blList.sort)}<th>PDF</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8" class="empty">Aún no hay BL importados.</td></tr>'}</tbody></table></div></section>`;
  }
  const blPill = k => k === 'final' ? '<span class="pill s-done">Final</span>' : '<span class="pill s-sol">Draft</span>';
  function viewBLDetail() {
    const b = S.bls.get(S.param);
    if (!b) return `<div class="banner">No encontré el BL ${esc(S.param)}.</div><p><a href="#bls">Volver a BL</a></p>`;
    if (!S.blEdit || S.blEdit.id !== S.param) {
      S.blEdit = { id: S.param, status: 'ready', parsed: clone(b), kind: b.kind, map: Object.fromEntries((b.containers || []).map(c => [c.key, c.shipment || ''])), attachments: b.attachments || [], existing: b };
    }
    return `<div class="head"><div><h1>BL ${esc(b.blNo)} ${blPill(b.kind)}</h1><div class="sub">${esc(b.vessel)} · ${esc(b.pol)} → ${esc(b.pod)}</div></div>
      <div class="row"><a class="btn" href="#bls">Volver a BL</a>${S.canWrite ? '<button class="btn danger" data-action="delBL">Eliminar BL</button>' : ''}</div></div>${blCard(S.blEdit, 'ed')}`;
  }
  const blObj = key => key === 'ed' ? S.blEdit : S.blImports[+key.slice(1)];
  function blCard(im, key) {
    const dis = S.canWrite ? '' : 'disabled';
    const head = im.file ? `<div class="row" style="justify-content:space-between"><h2>${esc(im.file.name)}</h2><div class="row"><span class="muted">${im.source === 'ai' ? 'Leído con IA' : im.source === 'parser' ? 'Leído del PDF' : ''}</span><button class="btn small" data-blremove="${key}">Quitar</button></div></div>` : '';
    if (im.status === 'reading') return `<section class="card">${head}<p class="muted">${esc(im.note || 'Leyendo PDF…')}</p></section>`;
    if (im.status === 'error') return `<section class="card">${head}<div class="banner">${esc(im.error)}</div>${S.sample && im.source !== 'ai' ? `<div><button class="btn" data-blai="${key}">Leer con IA</button></div>` : ''}</section>`;
    if (im.status === 'applied') return `<section class="card">${head}<div class="banner ok">BL <a href="#bl-${esc(blId(im.parsed.blNo))}">${esc(im.parsed.blNo)}</a> (${im.kind === 'final' ? 'Final' : 'Draft'}) guardado y asociado a ${im.appliedCount} embarque${im.appliedCount === 1 ? '' : 's'}.</div>
      <div class="row">${Object.values(im.map).filter(id => id && S.ships.has(id)).map(id => `<a class="btn small" href="#e-${id}">Abrir N° ${S.ships.get(id).n}</a>`).join('')}</div></section>`;
    const p = im.parsed;
    const prev = im.file ? S.bls.get(blId(p.blNo)) : null;
    const diffs = prev ? blCompare(prev, p) : [];
    const shipOpts = cur => '<option value="" data-ui>— Sin asociar —</option>' + shipsArr().filter(s => phase(s) !== 'na').slice(0, 400).map(s => { const id = shipId(s.year, s.n); return `<option value="${id}" ${cur === id ? 'selected' : ''}>N° ${s.n}/${s.year} · ${esc(short(s.finalCustomer))} · PO ${esc(s.poRef || '-')} · ${esc(s.containerNo || '')}</option>`; }).join('');
    const crow = c => {
      const sid = im.map[c.key] || ''; const s = sid ? S.ships.get(sid) : null;
      const w = blWarnings(c, s, p);
      return `<tr><td class="mono">${esc(c.containerNo)}</td><td>${esc(c.type)}</td><td class="mono">${esc(c.seal)}</td><td class="mono">${esc(c.po || '')}${c.so ? ' / SO ' + esc(c.so) : ''}</td><td class="num">${c.bags ? fmt(c.bags) : ''}</td><td class="num">${c.gross ? fmt(c.gross, 2) : ''}</td>
        <td><select data-blmap="${key}:${c.key}" ${dis} aria-label="Embarque" style="max-width:260px">${shipOpts(sid)}</select></td>
        <td class="wr">${s ? (w.length ? w.map(x => `<div style="color:var(--amber)">${esc(x)}</div>`).join('') : '<span style="color:var(--green)">Coincide con la orden</span>') : '<span style="color:var(--amber)">Sin embarque asociado</span>'}</td>
        <td>${s ? `<a class="btn small" href="#e-${sid}">Abrir N° ${s.n}</a>` : ''}</td></tr>`;
    };
    const kv = BL_SUM.filter(([k]) => k !== 'blNo').map(([k, l]) => `<dt>${l}</dt><dd>${esc(k.endsWith('Date') ? fmtD(p[k]) : p[k] || '')}</dd>`).join('');
    const atts = (im.attachments || []).map(a => `<div class="att">${blPill(a.kind)}<a href="/_blob/${esc(a.id)}" target="_blank" rel="noopener">${esc(a.name)}</a><span class="muted">${fmtD((a.at || '').slice(0, 10))}</span></div>`).join('');
    const nLinked = Object.values(im.map).filter(Boolean).length;
    return `<section class="card">${head}
      <div class="row"><h2 class="mono">${esc(p.blNo)}</h2>
        <label class="f" for="blk_${key}" style="min-width:160px">Tipo de documento<select id="blk_${key}" data-blkind="${key}" ${dis}><option value="draft" data-ui ${im.kind === 'draft' ? 'selected' : ''}>Draft BL</option><option value="final" data-ui ${im.kind === 'final' ? 'selected' : ''}>BL final / no negociable</option></select></label>
        ${im.file && p.watermark ? '<span class="muted">Marca de agua DRAFT detectada</span>' : ''}</div>
      ${prev ? `<div class="banner info">Este BL ya existe como ${prev.kind === 'final' ? 'Final' : 'Draft'}. Al guardar se agrega este PDF y se actualizan los datos.${diffs.length ? '<br><b>Cambios respecto a la versión anterior:</b><br>' + diffs.map(esc).join('<br>') : ' Sin cambios en los datos.'}</div>` : ''}
      <dl class="kv">${kv}<dt>Notify</dt><dd>${esc((p.notify || []).join(', '))}</dd></dl>
      <h3>Contenedores (${(p.containers || []).length})</h3>
      <div class="tablewrap"><table><thead><tr><th>Contenedor</th><th>Tipo</th><th>Sello</th><th>PO / SO</th><th class="num">Bolsas</th><th class="num">Peso bruto</th><th>Embarque</th><th>Revisión</th><th></th></tr></thead>
        <tbody>${(p.containers || []).map(crow).join('') || '<tr><td colspan="9" class="empty">No encontré contenedores en este BL.</td></tr>'}</tbody></table></div>
      ${atts ? `<div><h3>PDF del BL</h3>${atts}</div>` : ''}
      <div class="row"><button class="btn primary" data-blsave="${key}" ${dis}>Guardar BL y actualizar ${nLinked} embarque${nLinked === 1 ? '' : 's'}</button>
        ${im.file && S.sample && im.source !== 'ai' ? `<button class="btn" data-blai="${key}">Volver a leer con IA</button>` : ''}
        <span class="muted">En cada embarque se guarda el N° de BL y su estado; contenedor, sello y nave sólo si estaban vacíos.</span></div>
    </section>`;
  }
  function addBLFiles(files) {
    files = files.filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (!files.length) { toast('Sólo se pueden importar archivos PDF.'); return; }
    for (const f of files) { const im = { file: f, status: 'reading', map: {}, attachments: [] }; S.blImports.unshift(im); processBL(im); }
    render();
  }
  async function processBL(im, forceAI) {
    try {
      im.status = 'reading'; im.note = 'Leyendo PDF…'; render();
      const pages = im.pages || (im.pages = await pdfItems(im.file));
      let p = null;
      if (!forceAI) { p = window.SapParser.parseBL(pages, im.file.name); if (p.score >= 5) im.source = 'parser'; else p = null; }
      if (!p) {
        if (!S.sample) throw new Error('No reconocí el formato de este BL y la lectura con IA no está disponible aquí.');
        im.note = 'Leyendo con IA… (puede tardar hasta un minuto)'; render();
        p = await aiBL(pages, im.file.name); im.source = 'ai';
      }
      im.parsed = p; im.kind = p.kind || 'draft';
      const prev = S.bls.get(blId(p.blNo));
      im.attachments = prev ? (prev.attachments || []) : [];
      const taken = new Set(); im.map = {};
      (p.containers || []).forEach(c => {
        const pc = prev && (prev.containers || []).find(x => x.key === c.key);
        const sid = (pc && pc.shipment && S.ships.has(pc.shipment)) ? pc.shipment : matchContainer(c, taken);
        if (sid) taken.add(sid); im.map[c.key] = sid;
      });
      im.status = 'ready';
    } catch (e) {
      im.status = 'error';
      im.error = e && e.code === 'not_granted' ? 'No se dio permiso para usar Claude en esta página.' : e && e.code === 'rate_limited' ? 'Demasiadas lecturas seguidas. Espera un momento y vuelve a intentar.' : (e.message || String(e.code || e));
    }
    render();
  }
  async function aiBL(pages, fileName) {
    const text = pages.map((p, i) => `--- Página ${i + 1} ---\n` + window.SapParser.linesFromItems(p.items).map(l => l.text).join('\n')).join('\n').slice(0, 60000);
    const schema = '{"blNo":"","reference":"","kind":"draft|final","vessel":"","pol":"","pod":"","placeDelivery":"","onboardDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","issuePlace":"","freight":"","freightTerms":"PREPAID|COLLECT","notify":["líneas"],"containers":[{"containerNo":"ABCD123456-7","type":"40 HC","seal":"","po":"","so":"","bags":0,"gross":0}]}';
    const r = await S.sample.json(`Extrae los datos de este Bill of Lading (BL o HBL) de una exportación de sal desde Chile. kind = "draft" si es un borrador (dice DRAFT), si no "final". Para cada contenedor indica la PO y Sales Order si aparecen. Deja "" lo que no aparezca. Nombre del archivo: ${fileName}. Responde sólo con JSON con esta forma:\n${schema}\n\nTexto del PDF:\n${text}`, { modelTier: 'default' });
    if (!r || !r.blNo) throw new Error('La IA no encontró el N° de BL en este PDF.');
    r.containers = (Array.isArray(r.containers) ? r.containers : []).map(c => ({ key: ck(c.containerNo), containerNo: String(c.containerNo || ''), type: String(c.type || ''), seal: String(c.seal || ''), po: String(c.po || ''), so: String(c.so || ''), bags: num(c.bags) || null, gross: num(c.gross) || null })).filter(c => c.key);
    ['onboardDate', 'issueDate'].forEach(k => { r[k] = window.SapParser.parseDate(r[k] || ''); });
    r.notify = Array.isArray(r.notify) ? r.notify.map(String) : [];
    return r;
  }
  async function saveBL(key) {
    const im = blObj(key); if (!im) return;
    const p = im.parsed; if (!p.blNo) { toast('Falta el N° de BL.'); return; }
    const btn = $(`[data-blsave="${key}"]`); if (btn) btn.disabled = true;
    try {
      const id = blId(p.blNo);
      const prev = S.bls.get(id) || null;
      let attachments = (prev && prev.attachments) || [];
      if (im.file && S.assets) {
        try { const up = await S.assets.upload(im.file); attachments = attachments.concat([{ id: up.id, name: im.file.name, kind: im.kind, at: new Date().toISOString() }]); }
        catch (e) { toast('El PDF no se pudo adjuntar (' + (e.message || e.code) + '), pero los datos se guardarán.'); }
      }
      const containers = (p.containers || []).map(c => Object.assign({}, c, { shipment: im.map[c.key] || '' }));
      const shipments = Array.from(new Set(containers.map(c => c.shipment).filter(sid => sid && S.ships.has(sid))));
      const kind = prev && prev.kind === 'final' && im.kind === 'draft' && !im.existing ? 'final' : im.kind;
      const doc = Object.assign({}, prev || {}, p, { kind, containers, shipments, attachments, updatedAt: new Date().toISOString(), updatedBy: S.me || '' });
      delete doc.score; delete doc.watermark; delete doc.text;
      await S.db.doc('bls/' + id).set(doc);
      S.bls.set(id, doc);
      for (const c of containers) {
        if (!c.shipment || !S.ships.has(c.shipment)) continue;
        const s = clone(S.ships.get(c.shipment));
        s.blNo = p.blNo; s.blStatus = kind === 'final' ? 'Final' : 'Draft';
        if (!s.containerNo) s.containerNo = c.containerNo;
        if (!s.sealNo && c.seal) s.sealNo = c.seal;
        if (!s.vessel && p.vessel) s.vessel = p.vessel;
        await writeShip(s, `BL ${p.blNo} (${kind === 'final' ? 'final' : 'draft'}) asociado`);
      }
      for (const sid of ((prev && prev.shipments) || [])) {
        if (shipments.includes(sid) || !S.ships.has(sid)) continue;
        const s = clone(S.ships.get(sid));
        if (s.blNo === p.blNo) { s.blNo = ''; s.blStatus = ''; await writeShip(s, `Desasociado del BL ${p.blNo}`); }
      }
      if (key === 'ed') { S.blEdit = null; toast('BL guardado'); render(); }
      else { im.status = 'applied'; im.kind = kind; im.appliedCount = shipments.length; render(); }
    } catch (e) { toast('No se pudo guardar: ' + (e.message || e.code || e)); if (btn) btn.disabled = false; }
  }

  // ---------- Controles automáticos ----------
  const SEV = { alta: ['Alta', 's-por', 1], media: ['Media', 's-sol', 2], baja: ['Baja', '', 3] };
  function runControls() {
    const out = [];
    const all = shipsArr();
    const add = (s, sev, code, msg, field) => out.push({ ship: s, id: shipId(s.year, s.n), sev, code, msg, field: field || '' });
    const dup = (key) => { const m = new Map(); all.forEach(s => { const v = ck(s[key] || ''); if (v && phase(s) !== 'na') m.set(v, (m.get(v) || []).concat([s])); }); return m; };
    const dSo = dup('soRef'), dPo = dup('poRef'), dCt = dup('containerNo');
    for (const s of all) {
      const ph = phase(s); if (ph === 'na') continue;
      const dEtd = daysFrom(s.etd), dEta = daysFrom(s.eta);
      const active = ['por', 'sol', 'res', 'transit'].includes(ph);
      if (active) {
        if (['por', 'sol'].includes(ph) && !s.bookingRef && dEtd !== null && dEtd <= 21) add(s, 'alta', 'nobooking', `Sin booking y zarpa en ${dEtd} días`, 'bookingRef');
        shipErrors(s).forEach(e => add(s, 'alta', 'stacking', e, 'deliveryDate'));
        const ds = daysFrom(s.stackingEnd);
        if (s.stackingEnd && !s.deliveryDate && ds !== null && ds >= 0 && ds <= 3) add(s, 'alta', 'stackclose', `Cierre de stacking en ${ds} días sin fecha de entrega`, 'deliveryDate');
        if (s.etd && s.eta && s.eta < s.etd) add(s, 'alta', 'etaetd', 'La ETA es anterior a la ETD', 'eta');
        if (!(s.items || []).length) add(s, 'alta', 'noitems', 'Sin ítems de mercadería', 'items');
        (s.items || []).forEach(i => { if (!num(i.kgPerBag)) add(s, 'media', 'nokg', `Ítem ${i.item || '?'} sin kg por bolsa`, 'items'); if (!num(i.price)) add(s, 'baja', 'noprice', `Ítem ${i.item || '?'} sin precio`, 'items'); });
        if (!customerOf(s)) add(s, 'media', 'nocust', s.finalCustomer ? 'Cliente no está en Maestros (sin dirección para documentos)' : 'Sin cliente final', 'finalCustomer');
        if (s.containerType === "20'" && totals(s).gross > 28000) add(s, 'alta', 'overweight', 'Peso bruto sobre 28 t en contenedor de 20\'', 'items');
        const bk = bookingOf(s);
        if (bk && bk.containerType && s.containerType && !sameCtype(bk.containerType, s.containerType)) add(s, 'media', 'bktype', `Tipo de contenedor distinto al booking (${s.containerType} vs ${bk.containerType})`, 'containerType');
        if (s.bookingRef && !bk && dEtd !== null && dEtd >= 0 && dEtd <= 14 && ph !== 'transit') add(s, 'baja', 'bkpdf', 'Booking sin PDF importado', 'bookingRef');
        if (s.bookingRef && !s.forwarder) add(s, 'baja', 'nofw', 'Tiene booking pero no forwarder', 'forwarder');
        if (dEtd !== null && dEtd < 0 && !s.containerNo) add(s, 'alta', 'nocont', 'Ya zarpó y no tiene N° de contenedor', 'containerNo');
        if (dEtd !== null && dEtd < 0 && !s.blNo) add(s, 'media', 'nobl', 'Ya zarpó y no tiene BL', 'blNo');
        if (s.blStatus === 'Draft' && dEtd !== null && dEtd < -7) add(s, 'media', 'bldraft', 'El BL sigue en draft una semana después del zarpe', 'blStatus');
        if (isUSA(s) && dEtd !== null && dEtd <= 10 && !s.blNo) add(s, 'media', 'isf', 'Embarque a USA: el ISF necesita el N° de BL antes del zarpe', 'blNo');
        const bl = blOf(s);
        if (bl) {
          const c = (bl.containers || []).find(x => x.shipment === shipId(s.year, s.n));
          if (c) blWarnings(c, s, bl).forEach(w => add(s, 'media', 'blmismatch', 'BL: ' + w, 'blNo'));
        }
      }
      if (dEta !== null && dEta < -3 && ['por', 'sol', 'res'].includes(ph)) add(s, 'baja', 'oldstatus', 'La ETA ya pasó: revisa el status', 'status');
      if (s.status === 'Done' && dEtd !== null && dEtd < 0 && !s.invoiceNo) add(s, 'baja', 'noinv', 'Despachado sin N° de invoice', 'invoiceNo');
      [['soRef', dSo, 'SO'], ['poRef', dPo, 'PO'], ['containerNo', dCt, 'contenedor']].forEach(([k, m, l]) => {
        const v = ck(s[k] || ''); const arr = v ? m.get(v) : null;
        if (arr && arr.length > 1) add(s, 'alta', 'dup' + k, `${l} ${s[k]} repetido en N° ${arr.filter(o => o !== s).map(o => o.n).join(', ')}`, k);
      });
    }
    return out.sort((a, b) => SEV[a.sev][2] - SEV[b.sev][2] || (a.ship.etd || '9').localeCompare(b.ship.etd || '9'));
  }
  const sevPill = sev => `<span class="pill ${SEV[sev][1]}">${SEV[sev][0]}</span>`;
  function viewControls() {
    const all = runControls();
    const f = S.ctl || (S.ctl = { sev: '', q: '' });
    const rows = all.filter(c => (!f.sev || c.sev === f.sev) && (!f.q || normName(c.msg + ' ' + c.ship.finalCustomer + ' ' + c.ship.n + ' ' + (c.ship.poRef || '') + ' ' + (c.ship.soRef || '')).includes(normName(f.q))));
    const cnt = k => all.filter(c => c.sev === k).length;
    const chip = (v, l) => `<button class="chip ${f.sev === v ? 'on' : ''}" data-ctlsev="${v}">${l}</button>`;
    return `<div class="head"><div><h1>Controles</h1><div class="sub">Revisión automática de todos los embarques activos: fechas, booking, stacking, BL, pesos, duplicados y datos faltantes. Se recalcula con cada cambio.</div></div>
      ${S.sample ? '<div class="row"><button class="btn" data-action="aiOpen">Preguntar a Claude</button></div>' : ''}</div>
      <div class="tiles"><div class="tile red">${ICON('alert', 22)}<b>${cnt('alta')}</b><span>Prioridad alta</span></div><div class="tile amber"><b>${cnt('media')}</b><span>Prioridad media</span></div><div class="tile"><b>${cnt('baja')}</b><span>Prioridad baja</span></div></div>
      <div class="card"><div class="row"><input type="search" id="ctlQ" value="${esc(f.q)}" placeholder="Buscar en controles…" style="flex:1;min-width:220px" aria-label="Buscar en controles">
        <div class="chips">${chip('', 'Todas')}${chip('alta', 'Alta')}${chip('media', 'Media')}${chip('baja', 'Baja')}</div></div></div>
      <div class="tablewrap"><table><thead><tr><th>Prioridad</th><th>N°</th><th>PO</th><th>SO</th><th>Cliente</th><th>ETD</th><th>Control</th><th></th></tr></thead><tbody>
      ${rows.map(c => `<tr class="click" data-open="${c.id}"><td>${sevPill(c.sev)}</td><td class="mono">${c.ship.n}</td><td class="mono">${esc(c.ship.poRef || '')}</td><td class="mono">${esc(c.ship.soRef || '')}</td><td>${esc(short(c.ship.finalCustomer))}</td><td class="mono">${fmtD(c.ship.etd)}</td><td class="wr">${esc(c.msg)}</td><td><a class="btn small" href="#e-${c.id}">Abrir N° ${c.ship.n}${c.ship.poRef || c.ship.soRef ? ' · ' + [c.ship.poRef && 'PO ' + esc(c.ship.poRef), c.ship.soRef && 'SO ' + esc(c.ship.soRef)].filter(Boolean).join(' / ') : ''}</a></td></tr>`).join('') || '<tr><td colspan="8" class="empty">Sin observaciones. Todo en orden.</td></tr>'}
      </tbody></table></div>`;
  }

  // ---------- Revisión con IA de un embarque ----------
  function shipForAI(s) {
    const c = customerOf(s), bk = bookingOf(s), bl = blOf(s), t = totals(s);
    const pick = (o, keys) => o ? Object.fromEntries(keys.filter(k => o[k] != null && o[k] !== '').map(k => [k, o[k]])) : null;
    return {
      embarque: Object.assign(pick(s, ['n', 'year', 'soRef', 'customerRef', 'poRef', 'orderDate', 'finalCustomer', 'salesMode', 'paymentTerms', 'deliveryTerms', 'destIncoterm', 'invoiceNo', 'status', 'logistics', 'forwarder', 'bookingRef', 'carrier', 'vessel', 'pol', 'pod', 'etd', 'eta', 'stackingStart', 'stackingEnd', 'deliveryDate', 'blNo', 'blStatus', 'mblNo', 'containerType', 'containerNo', 'sealNo', 'tare', 'pallet', 'remarks']), { items: s.items, totales: { bolsas: t.bags, pallets: t.pallets, kgNeto: t.net, kgBruto: t.gross, vgm: t.vgm, usd: t.amount } }),
      cliente: c, booking: pick(bk, ['bookingRef', 'carrier', 'forwarder', 'vessel', 'pol', 'pod', 'etd', 'eta', 'containerType', 'equipment', 'stackingStart', 'stackingEnd', 'siCutoff', 'vgmCutoff', 'blNo']),
      bl: bl ? Object.assign(pick(bl, ['blNo', 'kind', 'vessel', 'pol', 'pod', 'onboardDate', 'freightTerms', 'notify']), { contenedor: (bl.containers || []).find(x => x.shipment === shipId(s.year, s.n)) || null }) : null,
      maestroProducto: (s.items || []).map(i => S.masters.items.find(m => String(m.code) === String(i.item)) || null)
    };
  }
  async function aiReview() {
    const sh = S.edit && S.edit.draft; if (!sh || !S.sample) return;
    const ctrls = runControls().filter(c => c.id === shipId(sh.year, sh.n)).map(c => c.msg);
    const lang = { en: 'inglés', sv: 'sueco' }[window.I18N.lang] || 'español';
    modal(`<div class="row" style="justify-content:space-between"><h2>Revisión con Claude · N° ${sh.n}</h2><button class="btn" data-close>Cerrar</button></div><div id="aiRev"><p class="muted">Claude está revisando el embarque… (puede tardar hasta un minuto)</p></div>`, 'wide');
    const prompt = `Eres un analista de logística de exportación de Saltwell SpA (Chile), que vende sal en contenedores a Saltwell AB (Suecia) para clientes finales. Revisa este embarque y detecta inconsistencias, datos faltantes o riesgos operativos (fechas ETD/ETA/stacking/entrega, booking vs orden, BL vs orden, pesos, pallets, tipo de contenedor, incoterms, puertos, cliente, documentos para Draft PL/Proforma/PL/ISF). Hoy es ${todayISO()}. Los controles automáticos ya detectaron: ${JSON.stringify(ctrls)}. No repitas esos salvo que agregues algo útil. Sé concreto y breve. Escribe en ${lang}.
Para cada hallazgo, si la corrección es obvia a partir de los datos (por ejemplo copiar un valor del booking o del BL), incluye "fix" con el campo del embarque y el valor exacto; si no, omite "fix". Campos válidos para fix: ${FIELDS.map(f => f[0]).join(', ')}.
Responde sólo con JSON: {"resumen":"una frase","hallazgos":[{"severidad":"alta|media|baja","mensaje":"","fix":{"campo":"","valor":""}}]}

Datos:
${JSON.stringify(shipForAI(sh))}`;
    try {
      const r = await S.sample.json(prompt, { modelTier: 'default' });
      const hs = Array.isArray(r && r.hallazgos) ? r.hallazgos : [];
      S.aiFixes = hs.map(h => h.fix && FIELD_LABEL[h.fix.campo] ? h.fix : null);
      const box = $('#aiRev'); if (!box) return;
      box.innerHTML = `<p data-notr>${esc(r.resumen || '')}</p>${hs.length ? `<div class="tablewrap"><table><tbody>${hs.map((h, i) => `<tr><td>${sevPill(SEV[h.severidad] ? h.severidad : 'baja')}</td><td class="wr" data-notr>${esc(h.mensaje)}</td>
        <td>${S.aiFixes[i] ? `<button class="btn small" data-aifix="${i}">Aplicar: ${esc(FIELD_LABEL[S.aiFixes[i].campo])} = ${esc(S.aiFixes[i].valor)}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p>Sin observaciones.</p>'}
        <p class="muted" style="font-size:12px">Las correcciones se aplican al formulario; revisa y presiona Guardar para confirmarlas. Claude puede equivocarse: verifica antes de guardar.</p>`;
    } catch (e) {
      const box = $('#aiRev'); if (box) box.innerHTML = `<div class="banner">${esc(aiErr(e))}</div>`;
    }
  }
  function aiErr(e) {
    const c = e && e.code;
    if (c === 'not_granted') return 'No se dio permiso para usar Claude en esta página.';
    if (c === 'rate_limited') return 'Límite de uso alcanzado. Espera un momento y vuelve a intentar.';
    if (c === 'invalid_json') return 'Claude no devolvió una respuesta legible. Intenta de nuevo.';
    return 'No se pudo consultar a Claude: ' + ((e && (e.message || e.code)) || e);
  }

  // ---------- Asistente (chat con herramientas sobre los datos) ----------
  function compactShip(s) {
    const t = totals(s);
    return { n: s.n, year: s.year, so: s.soRef, po: s.poRef, custRef: s.customerRef, cliente: s.finalCustomer, pol: s.pol, pod: s.pod, etd: s.etd, eta: s.eta, booking: s.bookingRef, forwarder: s.forwarder, carrier: s.carrier, nave: s.vessel, contenedor: s.containerNo, tipo: s.containerType, bl: s.blNo, blEstado: s.blStatus, status: s.status, estado: PHASE[phase(s)][0], bolsas: t.bags, kgNeto: t.net, usd: t.amount, productos: (s.items || []).map(i => i.item).join(',') };
  }
  const AI_TOOLS = () => [
    { name: 'buscar_embarques', description: 'Busca embarques. Devuelve hasta 60 filas compactas y el total. Todos los filtros son opcionales.', inputSchema: { type: 'object', properties: {
      texto: { type: 'string', description: 'texto libre: N°, SO, PO, cliente, booking, contenedor, BL, nave' }, estado: { type: 'string', enum: ['por reservar', 'booking solicitado', 'reservado', 'en tránsito', 'entregado', 'activos', 'todos'] },
      cliente: { type: 'string' }, pod: { type: 'string' }, campoFecha: { type: 'string', enum: ['etd', 'eta', 'orderDate', 'stackingEnd', 'deliveryDate'] }, desde: { type: 'string', description: 'YYYY-MM-DD' }, hasta: { type: 'string', description: 'YYYY-MM-DD' } } },
      execute: (a) => {
        const map = { 'por reservar': 'por', 'booking solicitado': 'sol', 'reservado': 'res', 'en tránsito': 'transit', 'entregado': 'done' };
        const q = normName(a.texto || ''), cf = a.campoFecha || 'etd';
        const rows = shipsArr().filter(s => {
          const ph = phase(s);
          if (a.estado === 'activos' && ['done', 'na'].includes(ph)) return false;
          if (map[a.estado] && ph !== map[a.estado]) return false;
          if (a.cliente && !normName(s.finalCustomer).includes(normName(a.cliente))) return false;
          if (a.pod && !normName(s.pod).includes(normName(a.pod))) return false;
          if (a.desde && (!s[cf] || s[cf] < a.desde)) return false;
          if (a.hasta && (!s[cf] || s[cf] > a.hasta)) return false;
          if (q) { const hay = normName(JSON.stringify(compactShip(s))); if (!q.split(' ').every(w => hay.includes(w))) return false; }
          return true;
        });
        return { total: rows.length, filas: rows.slice(0, 60).map(compactShip) };
      } },
    { name: 'ver_embarque', description: 'Devuelve todo el detalle de un embarque (orden, ítems, totales, cliente, booking y BL asociados).', inputSchema: { type: 'object', properties: { n: { type: 'number' }, year: { type: 'number' } }, required: ['n'] },
      execute: (a) => { const s = shipsArr().find(x => x.n === Number(a.n) && (!a.year || x.year === Number(a.year))); if (!s) throw new Error('No existe ese N°'); return shipForAI(s); } },
    { name: 'controles', description: 'Lista los controles automáticos pendientes (problemas detectados), opcionalmente de un embarque.', inputSchema: { type: 'object', properties: { n: { type: 'number' } } },
      execute: (a) => runControls().filter(c => !a.n || c.ship.n === Number(a.n)).slice(0, 80).map(c => ({ n: c.ship.n, prioridad: c.sev, control: c.msg })) },
    { name: 'abrir_embarque', description: 'Abre en pantalla la ficha de un embarque para el usuario.', inputSchema: { type: 'object', properties: { n: { type: 'number' }, year: { type: 'number' } }, required: ['n'] },
      execute: (a) => { const s = shipsArr().find(x => x.n === Number(a.n) && (!a.year || x.year === Number(a.year))); if (!s) throw new Error('No existe ese N°'); location.hash = '#e-' + shipId(s.year, s.n); return 'abierto'; } }
  ];
  function aiPanel() {
    const A = S.ai || (S.ai = { open: false, turns: [], busy: false, partial: '' });
    if (!A.open) return S.sample ? `<button class="ai-fab" data-action="aiOpen" title="Preguntar a Claude">Claude</button>` : '';
    const msgs = A.turns.map(t => `<div class="ai-msg ${t.role}" data-notr>${t.role === 'assistant' ? mdLite(t.content) : esc(t.content)}</div>`).join('');
    return `<aside class="ai-panel" aria-label="Asistente">
      <div class="row" style="justify-content:space-between"><b>Asistente Claude</b><button class="btn small" data-action="aiClose">Cerrar</button></div>
      <div class="ai-log" id="aiLog">${msgs || `<p class="muted" style="font-size:13px">Pregunta sobre los embarques. Ejemplos:</p>
        <div class="chips">${['¿Qué embarques zarpan esta semana y qué les falta?', '¿Cuántas toneladas enviamos a Healy este año?', 'Resume los controles de prioridad alta', '¿Qué contenedores de Bluewaters siguen sin BL final?'].map(q => `<button class="chip" data-aiq="${esc(q)}">${esc(q)}</button>`).join('')}</div>`}
        ${A.busy ? `<div class="ai-msg assistant" id="aiPartial" data-notr>${A.partial ? mdLite(A.partial) : '<span class="muted">Pensando…</span>'}</div>` : ''}</div>
      <form class="row" id="aiForm"><input id="aiInput" placeholder="Escribe tu pregunta…" style="flex:1" ${A.busy ? 'disabled' : ''} aria-label="Pregunta"><button class="btn primary" ${A.busy ? 'disabled' : ''}>Enviar</button></form>
      <details ${A.fbOpen ? 'open' : ''}><summary class="muted" style="font-size:12px;cursor:pointer">Sugerir una mejora para la página</summary>
        <textarea id="fbText" rows="3" placeholder="¿Qué te gustaría que la página hiciera mejor?"></textarea><button class="btn small" data-action="sendFeedback">Enviar sugerencia</button></details>
      <p class="muted" style="font-size:11px;margin:0">Usa tu cuenta de Claude. Sólo lee los datos; los cambios los haces tú.</p>
    </aside>`;
  }
  function mdLite(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#{1,4}\s*(.+)$/gm, '<b>$1</b>').replace(/^\s*[-*]\s+/gm, '• ').replace(/\n/g, '<br>');
  }
  async function aiAsk(q) {
    const A = S.ai; if (!q || A.busy || !S.sample) return;
    A.turns.push({ role: 'user', content: q }); A.busy = true; A.partial = ''; render();
    const sys = `Eres el asistente de la página "Saltwell Embarques" (gestión de exportaciones de sal de Saltwell SpA, Chile, a Saltwell AB, Suecia, y sus clientes finales). Hoy es ${todayISO()}. Responde en ${{ en: 'inglés', sv: 'sueco' }[window.I18N.lang] || 'español'}, breve y concreto, usando las herramientas para consultar los datos reales (no inventes). Cita los N° de embarque. Si el usuario quiere ver una ficha, usa abrir_embarque. No puedes modificar datos: indica qué debe cambiar el usuario y dónde.`;
    const ctl = new AbortController(); A.ctl = ctl;
    try {
      const lim = await S.sample.limits().catch(() => null);
      const opts = { signal: ctl.signal, onText: ({ text }) => { A.partial = text; const el = $('#aiPartial'); if (el) el.innerHTML = mdLite(text); } };
      if (lim && lim.tools) opts.tools = AI_TOOLS(); else { opts.cache = false; }
      const ctx = lim && lim.tools ? '' : `\n\nDatos (resumen de embarques activos): ${JSON.stringify(shipsArr().filter(s => !['done', 'na'].includes(phase(s))).slice(0, 120).map(compactShip))}`;
      const turns = [{ role: 'user', content: sys + ctx }].concat(A.turns.slice(-10));
      const r = await S.sample(turns, opts);
      A.turns.push({ role: 'assistant', content: r.text });
    } catch (e) {
      if (e.code !== 'cancelled') A.turns.push({ role: 'assistant', content: (e.text ? e.text + '\n\n' : '') + aiErr(e) });
    }
    A.busy = false; A.partial = ''; render();
    const lg = $('#aiLog'); if (lg) lg.scrollTop = lg.scrollHeight;
  }
  async function sendFeedback() {
    const t = ($('#fbText') || {}).value; if (!t || !t.trim()) return;
    try { await S.db.collection('feedback').add({ text: t.trim(), by: S.me || '', at: new Date().toISOString(), route: location.hash }); $('#fbText').value = ''; toast('Gracias. La sugerencia quedó registrada.'); }
    catch (e) { toast('No se pudo enviar: ' + (e.message || e.code)); }
  }

  // ---------- Reportes ----------
  function repRows() {
    const R = S.rep;
    return shipsArr().filter(s => {
      const d = s[R.dateField] || '';
      if (R.year !== 'all') { if (R.dateField === 'year' ? String(s.year) !== R.year : !d.startsWith(R.year)) return false; }
      if (R.from && (!d || d < R.from)) return false;
      if (R.to && (!d || d > R.to)) return false;
      if (R.customer && s.finalCustomer !== R.customer) return false;
      if (R.status && phase(s) !== R.status) return false;
      if (R.pod && s.pod !== R.pod) return false;
      return true;
    });
  }
  const REP_COLS = ['n', 'soRef', 'customerRef', 'poRef', 'finalCustomer', 'pod', 'etd', 'eta', 'bookingRef', 'carrier', 'containerNo', 'blNo', 'bags', 'net', 'amount', 'invoiceNo', 'phase'];
  function viewReports() {
    const R = S.rep;
    const rows = repRows();
    const tt = rows.reduce((a, s) => { const t = totals(s); a.bags += t.bags; a.net += t.net; a.amount += t.amount; return a; }, { bags: 0, net: 0, amount: 0 });
    const years = Array.from(new Set(shipsArr().flatMap(s => [String(s.year), (s.etd || '').slice(0, 4), (s.eta || '').slice(0, 4)]).filter(Boolean))).sort().reverse();
    const custs = Array.from(new Set(shipsArr().map(s => s.finalCustomer).filter(Boolean))).sort();
    const pods = Array.from(new Set(shipsArr().map(s => s.pod).filter(Boolean))).sort();
    const byCust = new Map();
    rows.forEach(s => { const k = s.finalCustomer || 'Sin cliente'; const o = byCust.get(k) || { n: 0, t: 0, usd: 0 }; const t = totals(s); o.n++; o.t += t.net / 1000; o.usd += t.amount; byCust.set(k, o); });
    const custArr = Array.from(byCust.entries()).sort((a, b) => b[1].t - a[1].t);
    const maxT = Math.max(1, ...custArr.map(c => c[1].t));
    const byProd = new Map();
    rows.forEach(s => (s.items || []).forEach(i => { const k = i.item + ' · ' + (i.description || ''); const o = byProd.get(k) || { bags: 0, t: 0 }; o.bags += num(i.qty); o.t += num(i.qty) * num(i.kgPerBag) / 1000; byProd.set(k, o); }));
    const prodArr = Array.from(byProd.entries()).sort((a, b) => b[1].t - a[1].t);
    const sel = (id, val, opts, all) => `<select id="${id}">${all ? `<option value="" data-ui>${all}</option>` : ''}${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${Array.isArray(o) ? 'data-ui' : ''} ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
    return `
    <div class="head"><div><h1>Reportes</h1><div class="sub">Filtra los embarques y exporta el detalle a Excel con las mismas columnas de la hoja Ventas.</div></div>
      <div class="row"><button class="btn primary" data-action="exportXlsx">Exportar a Excel (${rows.length})</button></div></div>
    <div class="card"><div class="row">
      <label class="f" for="rDate">Fecha de referencia${sel('rDate', R.dateField, [['etd', 'ETD'], ['eta', 'ETA'], ['orderDate', 'Fecha orden'], ['year', 'Año del N°']])}</label>
      <label class="f" for="rYear">Año${sel('rYear', R.year, [['all', 'Todos']].concat(years))}</label>
      <label class="f" for="rFrom">Desde<input type="date" id="rFrom" value="${esc(R.from)}"></label>
      <label class="f" for="rTo">Hasta<input type="date" id="rTo" value="${esc(R.to)}"></label>
      <label class="f" for="rCust">Cliente${sel('rCust', R.customer, custs, 'Todos')}</label>
      <label class="f" for="rPod">Puerto destino${sel('rPod', R.pod, pods, 'Todos')}</label>
      <label class="f" for="rStatus">Estado${sel('rStatus', R.status, [['por', 'Por reservar'], ['sol', 'Booking solicitado'], ['res', 'Reservado'], ['transit', 'En tránsito'], ['done', 'Entregado'], ['na', 'N/A']], 'Todos')}</label>
    </div></div>
    <div class="tiles">
      <div class="tile teal">${ICON('container', 22)}<b>${rows.length}</b><span>Contenedores</span></div>
      <div class="tile"><b>${fmt(tt.bags)}</b><span>Bolsas</span></div>
      <div class="tile"><b>${fmt(tt.net / 1000, 1)}</b><span>Toneladas netas</span></div>
      <div class="tile green">${ICON('chart', 22)}<b>${fmt(tt.amount)}</b><span>USD (precio Saltwell SpA)</span></div>
    </div>
    <section class="card"><h2>Contenedores por mes de ${R.dateField === 'eta' ? 'ETA' : R.dateField === 'orderDate' ? 'orden' : 'ETD'}</h2><div id="chartMonths" style="overflow-x:auto"></div></section>
    <div class="grid g2">
      <section class="card"><h2>Toneladas por cliente</h2><div class="bars">${custArr.map(([k, o]) => `<div class="bar"><span class="lbl" title="${esc(k)}">${esc(short(k))}</span><span class="t"><i style="width:${(o.t / maxT * 100).toFixed(1)}%"></i></span><span class="num">${fmt(o.t, 0)} t · ${o.n}</span></div>`).join('') || '<p class="muted">Sin datos.</p>'}</div></section>
      <section class="card"><h2>Por producto</h2><div class="tablewrap"><table><thead><tr><th>Producto</th><th class="num">Bolsas</th><th class="num">Toneladas</th></tr></thead><tbody>${prodArr.map(([k, o]) => `<tr><td>${esc(k)}</td><td class="num">${fmt(o.bags)}</td><td class="num">${fmt(o.t, 1)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Sin datos.</td></tr>'}</tbody></table></div></section>
    </div>
    <section class="card"><h2>Detalle</h2><div class="tablewrap"><table><thead><tr>${REP_COLS.map(k => sortTh('rep', k, LCOL[k][1], R.sort, LCOL[k][2] === 'num' ? 'num' : '')).join('')}</tr></thead><tbody>
      ${sortRows(rows, R.sort, LCOL).map(s => { const t = totals(s); return `<tr class="click" data-open="${shipId(s.year, s.n)}"><td class="mono">${s.n}</td><td class="mono">${esc(s.soRef)}</td><td class="mono">${esc(s.customerRef)}</td><td class="mono">${esc(s.poRef)}</td><td>${esc(short(s.finalCustomer))}</td><td>${esc(s.pod)}</td><td class="mono">${fmtD(s.etd)}</td><td class="mono">${fmtD(s.eta)}</td><td class="mono">${esc(s.bookingRef)}</td><td>${esc(s.carrier)}</td><td class="mono">${esc(s.containerNo)}</td><td class="mono">${esc(s.blNo)}</td><td class="num">${fmt(t.bags)}</td><td class="num">${fmt(t.net)}</td><td class="num">${fmt(t.amount)}</td><td class="mono">${esc(s.invoiceNo)}</td><td>${pill(s)}</td></tr>`; }).join('') || '<tr><td colspan="17" class="empty">Sin embarques con estos filtros.</td></tr>'}
    </tbody></table></div></section>`;
  }
  function drawReportCharts() {
    const el = $('#chartMonths'); if (!el) return;
    const rows = repRows();
    const field = S.rep.dateField === 'year' ? 'etd' : S.rep.dateField;
    const m = new Map();
    rows.forEach(s => { const k = (s[field] || '').slice(0, 7); if (!k) return; const o = m.get(k) || { n: 0, t: 0 }; o.n++; o.t += totals(s).net / 1000; m.set(k, o); });
    const keys = Array.from(m.keys()).sort();
    if (!keys.length) { el.innerHTML = '<p class="muted">Sin fechas para graficar.</p>'; return; }
    // completar meses intermedios
    const all = []; let [y, mo] = keys[0].split('-').map(Number); const [ly, lm] = keys[keys.length - 1].split('-').map(Number);
    while (y < ly || (y === ly && mo <= lm)) { all.push(`${y}-${String(mo).padStart(2, '0')}`); mo++; if (mo > 12) { mo = 1; y++; } }
    const W = Math.max(560, all.length * 46 + 50), H = 210, pad = { l: 34, r: 10, t: 16, b: 34 };
    const max = Math.max(...all.map(k => (m.get(k) || { n: 0 }).n));
    const step = max <= 5 ? 1 : max <= 12 ? 2 : max <= 30 ? 5 : 10;
    const top = Math.ceil(max / step) * step || 1;
    const bw = (W - pad.l - pad.r) / all.length;
    const yv = v => pad.t + (H - pad.t - pad.b) * (1 - v / top);
    const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    let svg = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contenedores por mes">`;
    for (let v = 0; v <= top; v += step) svg += `<line class="gl" x1="${pad.l}" x2="${W - pad.r}" y1="${yv(v)}" y2="${yv(v)}"/><text x="${pad.l - 6}" y="${yv(v) + 4}" text-anchor="end">${v}</text>`;
    const cur = todayISO().slice(0, 7);
    all.forEach((k, i) => {
      const o = m.get(k) || { n: 0 }; const x = pad.l + i * bw + bw * 0.18, w = bw * 0.64;
      if (o.n) svg += `<rect class="${k > cur ? 'b2' : 'b'}" x="${x}" y="${yv(o.n)}" width="${w}" height="${yv(0) - yv(o.n)}" rx="2"><title>${k}: ${o.n} contenedores, ${fmt(o.t, 0)} t</title></rect><text class="v" x="${x + w / 2}" y="${yv(o.n) - 4}" text-anchor="middle">${o.n}</text>`;
      const [yy, mm] = k.split('-');
      svg += `<text x="${x + w / 2}" y="${H - pad.b + 14}" text-anchor="middle">${MES[+mm - 1]}</text>`;
      if (mm === '01' || i === 0) svg += `<text x="${x + w / 2}" y="${H - pad.b + 27}" text-anchor="middle">${yy}</text>`;
    });
    svg += '</svg><p class="muted" style="font-size:12px;margin:4px 0 0">Barras claras: meses futuros (planificado).</p>';
    el.innerHTML = svg;
  }
  // ---------- Correo al agente de aduanas (booking + Draft PL + Proforma) ----------
  async function loadZip() {
    if (window.JSZip) return window.JSZip;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el compresor ZIP')); document.head.appendChild(s); });
    return window.JSZip;
  }
  function customsCc(sh) {
    const rules = String(S.settings.customsCcRules || '').split('\n').map(l => l.split(':')).filter(p => p.length >= 2)
      .map(([port, ...rest]) => ({ port: port.trim(), mails: splitMails(rest.join(':')) }));
    const r = rules.find(x => normName(x.port) === normName(sh.pol)) || rules.find(x => normName(sh.pol).includes(normName(x.port)));
    const fw = S.masters.forwarders.find(f => f.name === sh.forwarder) || {};
    const all = [...(r ? r.mails : []), ...splitMails(fw.email), ...splitMails(fw.cc), ...splitMails(S.settings.internalCc)];
    const seen = new Set(); return all.filter(m => { const k = m.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const b64 = buf => { const u8 = new Uint8Array(buf); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const wrap76 = s => s.replace(/.{1,76}/g, '$&\r\n');
  const encHeader = s => /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + btoa(unescape(encodeURIComponent(s))) + '?=';
  function buildEml({ to, cc, subject, html, text, attachments }) {
    const bnd = 'SWB-' + Math.random().toString(36).slice(2), alt = 'SWA-' + Math.random().toString(36).slice(2);
    const u = s => b64(new TextEncoder().encode(s).buffer);
    let m = `To: ${to.join(', ')}\r\n` + (cc.length ? `Cc: ${cc.join(', ')}\r\n` : '') + `Subject: ${encHeader(subject)}\r\nX-Unsent: 1\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${bnd}"\r\n\r\n`;
    m += `--${bnd}\r\nContent-Type: multipart/alternative; boundary="${alt}"\r\n\r\n`;
    m += `--${alt}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(u(text))}`;
    m += `--${alt}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(u(html))}--${alt}--\r\n`;
    for (const a of attachments) m += `--${bnd}\r\nContent-Type: application/pdf; name="${a.name}"\r\nContent-Disposition: attachment; filename="${a.name}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(b64(a.data))}`;
    return m + `--${bnd}--\r\n`;
  }
  async function customsEmail(sh0) {
    const sh = S.ships.get(shipId(sh0.year, sh0.n)) || sh0;
    if (!sh.bookingRef) { toast('El Draft Packing List y la Proforma Invoice requieren N° de booking.'); return; }
    const bk = bookingOf(sh);
    const sibs = shipsArr().filter(s => s.bookingRef === sh.bookingRef && !(s.year === sh.year && s.n === sh.n));
    const st = { includeSibs: sibs.length > 0 };
    const ships = () => [sh].concat(st.includeSibs ? sibs : []).sort((a, b) => a.n - b.n);
    const bkAtt = bk && (bk.attachments || []).length ? bk.attachments[bk.attachments.length - 1] : null;
    const name = S.settings.customsName || '';
    const subjectOf = () => { const L = ships(); return `Documentos embarque | Booking ${sh.bookingRef} | ${L.map(s => 'SO ' + (s.soRef || '-') + ' / PO ' + (s.poRef || '-')).join(' + ')} | ${short(sh.finalCustomer).split(' ')[0]}`; };
    const intro = S.settings.customsIntro || '';
    modal(`<div class="row" style="justify-content:space-between"><h2>Correo agente de aduanas</h2><button class="btn" data-close>Cerrar</button></div>
      <div class="form" style="grid-template-columns:1fr 1fr">
        <label class="f" for="caTo">Para<input id="caTo" value="${esc(S.settings.customsTo || '')}"></label>
        <label class="f" for="caCc">CC<input id="caCc" value="${esc(customsCc(sh).join('; '))}"></label>
        <label class="f" for="caSubj" style="grid-column:1/-1">Asunto<input id="caSubj" value="${esc(subjectOf())}"></label>
        <label class="f" for="caBody" style="grid-column:1/-1">Texto<textarea id="caBody" rows="5">${esc(`Estimada ${name},\n\n${intro}`.replace(' ,', ','))}</textarea></label>
        <label class="f" for="caSign" style="grid-column:1/-1">Firma<textarea id="caSign" rows="3">${esc(S.settings.bookingSign || '')}</textarea></label>
      </div>
      ${sibs.length ? `<label class="row" style="gap:6px"><input type="checkbox" id="caSibs" checked> <span>Incluir las otras ${sibs.length} órdenes del mismo booking (N° ${sibs.map(s => s.n).join(', ')})</span></label>` : ''}
      <h3>Adjuntos</h3><div id="caAtts"></div>
      <h3>Vista previa</h3><div id="caPreview" data-notr style="background:#fff;color:#000;border:1px solid var(--line);border-radius:6px;padding:14px;overflow-x:auto"></div>
      <div class="row">
        <button class="btn primary" id="caEml">Descargar correo para Outlook (con adjuntos)</button>
        <button class="btn" id="caZip">Descargar sólo adjuntos (.zip)</button>
        <a class="btn" id="caMail" href="#" target="_blank" rel="noopener">Abrir en mi correo (sin adjuntos)</a>
        <button class="btn" data-copy="caTo">Copiar Para</button><button class="btn" data-copy="caCc">Copiar CC</button><button class="btn" data-copy="caSubj">Copiar asunto</button>
      </div>
      <p class="muted" style="font-size:12px">Descargar correo para Outlook baja un .zip con el correo (.eml) ya armado: Para, CC, asunto, texto y los PDF adjuntos. Descomprímelo y abre el .eml con doble clic: Outlook lo abre como mensaje nuevo listo para enviar. Una página web no puede enviar correos ni adjuntar archivos por sí sola.</p>`, 'wide');
    const attList = () => {
      const L = ships(); const a = [];
      a.push({ kind: 'booking', label: bkAtt ? `Booking ${sh.bookingRef} · ${bkAtt.name}` : `Booking ${sh.bookingRef} · sin PDF importado`, ok: !!bkAtt, name: bkAtt ? bkAtt.name.replace(/^[0-9a-f]{8}-/, '') : '' });
      L.forEach(s => { a.push({ kind: 'draft', sh: s, label: docFileName('draft', s), ok: true, name: docFileName('draft', s) }); a.push({ kind: 'proforma', sh: s, label: docFileName('proforma', s), ok: true, name: docFileName('proforma', s) }); });
      return a;
    };
    const summaryHtml = () => {
      const F = 'font-family:Calibri,Arial,sans-serif;font-size:10pt;border:1px solid #BFBFBF;padding:3px 6px;';
      const th = v => `<th style="${F}background:${BK.navy};color:#fff;text-align:left">${esc(v)}</th>`, td = v => `<td style="${F}color:${BK.val}">${esc(v == null ? '' : v)}</td>`;
      const rows = ships().map(s => { const t = totals(s); return `<tr>${td(s.n)}${td(s.soRef)}${td(s.poRef)}${td(s.customerRef)}${td(customerOf(s) ? customerOf(s).name : s.finalCustomer)}${td(s.containerType)}${td(fmtEN(t.bags))}${td(fmtEN(t.gross, 2))}</tr>`; }).join('');
      const b = bk || sh;
      return `<table cellspacing="0" style="border-collapse:collapse;margin:6px 0 10px"><tr>${th('Booking')}${td(sh.bookingRef)}${th('Naviera')}${td(b.carrier)}${th('Nave')}${td(b.vessel)}</tr><tr>${th('POL')}${td(b.pol)}${th('POD')}${td(b.pod)}${th('ETD / ETA')}${td(fmtD(b.etd) + ' / ' + fmtD(b.eta))}</tr></table>
        <table cellspacing="0" style="border-collapse:collapse;margin:0 0 12px"><tr>${['N°', 'SO', 'PO', 'Customer Ref', 'Cliente', 'Contenedor', 'Bolsas', 'Peso bruto (kg)'].map(th).join('')}</tr>${rows}</table>`;
    };
    const P = 'font-family:Calibri,Arial,sans-serif;font-size:11pt;margin:0 0 8px';
    const html = () => `<div>${esc($('#caBody').value).split('\n\n').map(p => `<p style="${P}">${p.replace(/\n/g, '<br>')}</p>`).join('')}${summaryHtml()}<p style="${P}">${esc($('#caSign').value).replace(/\n/g, '<br>')}</p></div>`;
    const text = () => `${$('#caBody').value}\n\nBooking ${sh.bookingRef}\n${ships().map(s => `N° ${s.n} · SO ${s.soRef || '-'} · PO ${s.poRef || '-'} · ${s.containerType || ''}`).join('\n')}\n\nAdjuntos: booking, Draft Packing List y Proforma Invoice.\n\n${$('#caSign').value}`;
    const upd = () => {
      $('#caAtts').innerHTML = attList().map(a => `<div class="att"><span class="pill ${a.ok ? 's-res' : 's-por'}">${a.kind === 'booking' ? 'Booking' : a.kind === 'draft' ? 'Draft PL' : 'Proforma'}</span><span>${esc(a.label)}</span>${a.ok ? '' : '<a href="#bookings" style="margin-left:auto">Importar booking</a>'}</div>`).join('');
      $('#caPreview').innerHTML = html();
      const to = splitMails($('#caTo').value).join(';'), cc = splitMails($('#caCc').value).join(';');
      $('#caMail').href = `mailto:${to}?${cc ? 'cc=' + cc + '&' : ''}subject=${encodeURIComponent($('#caSubj').value)}&body=${encodeURIComponent(text())}`;
    };
    ['caTo', 'caCc', 'caSubj', 'caBody', 'caSign'].forEach(id => $('#' + id).addEventListener('input', upd));
    const sb = $('#caSibs'); if (sb) sb.onchange = () => { st.includeSibs = sb.checked; $('#caSubj').value = subjectOf(); upd(); };
    upd();
    const gather = async () => {
      const out = [];
      for (const a of attList()) {
        if (a.kind === 'booking') {
          if (!a.ok) continue;
          try { const r = await fetch('/_blob/' + bkAtt.id); if (!r.ok) throw new Error(r.status); out.push({ name: a.name, data: await r.arrayBuffer() }); }
          catch (e) { toast('No se pudo leer el PDF del booking; adjúntalo a mano.', 6000); }
        } else out.push({ name: a.name, data: window.Docs.build(a.kind, docCtx(a.sh)).output('arraybuffer') });
      }
      return out;
    };
    const zipName = `Aduana_Booking_${sh.bookingRef}_N${ships().map(s => s.n).join('-')}`;
    $('#caEml').onclick = async () => {
      try {
        const Z = await loadZip(); const atts = await gather();
        const eml = buildEml({ to: splitMails($('#caTo').value), cc: splitMails($('#caCc').value), subject: $('#caSubj').value, html: html(), text: text(), attachments: atts });
        const z = new Z(); z.file(zipName + '.eml', eml);
        const data = await z.generateAsync({ type: 'uint8array' });
        await saveFile(zipName + '.zip', data);
        if (S.canWrite) { const c = clone(S.ships.get(shipId(sh.year, sh.n))); await writeShip(c, 'Correo a agente de aduanas preparado'); }
      } catch (e) { toast('No se pudo preparar el correo: ' + (e.message || e.code || e)); }
    };
    $('#caZip').onclick = async () => {
      try { const Z = await loadZip(); const atts = await gather(); const z = new Z(); atts.forEach(a => z.file(a.name, a.data)); await saveFile(zipName + '_adjuntos.zip', await z.generateAsync({ type: 'uint8array' })); }
      catch (e) { toast('No se pudo preparar el correo: ' + (e.message || e.code || e)); }
    };
  }

  async function loadXlsx() {
    if (window.XLSX) return window.XLSX;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el exportador de Excel')); document.head.appendChild(s); });
    return window.XLSX;
  }
  async function exportXlsx() {
    try {
      const X = await loadXlsx();
      const H = ['N°', 'Año', 'SWAB Sales Order Ref', 'Customer Ref', 'SWAB PO Ref', 'date Order', 'Forwarder', 'Booking reference', 'ETD', 'ETA', 'Port of Loading', 'Port of discharge', 'Modalidad Venta', 'Forma de Pago', 'Final Customer', 'Delivery Terms', 'Type Container', 'Container N°', 'Seal N°', 'Tara', 'Pallet', 'Pallets Weight (kg)', 'Item', 'Item Description', 'Quantity (bags)', 'Bags x Pallet', 'N° pallets', 'KG x Bag', 'Total Weight (kg)', 'Gross Wegiht (kg)', 'Verified Gross Mass (VGM) (kg): ', 'Batch/Lote', 'Price x Bag', 'N° BL', 'Carrier', 'Vessel', 'Inicio Staking', 'Cierre Staking', 'delivery date', 'N° Invoice', 'Status', 'Logistica Nacional', 'Incoterm en Destino', 'Remarks'];
      const d = s => s ? new Date(s + 'T00:00:00Z') : '';
      const out = [H];
      repRows().slice().sort((a, b) => a.year - b.year || a.n - b.n).forEach(s => {
        const pw = palletWeightOf(s);
        (s.items && s.items.length ? s.items : [{}]).forEach((it, i) => {
          const q = num(it.qty), bpp = num(it.bagsPerPallet), pal = bpp ? q / bpp : 0, net = q * num(it.kgPerBag), gross = net + pw * pal;
          const tare = i === 0 ? num(s.tare) : 0;
          out.push([s.n, s.year, s.soRef, s.customerRef, s.poRef, d(s.orderDate), s.forwarder, s.bookingRef, d(s.etd), d(s.eta), s.pol, s.pod, s.salesMode, s.paymentTerms, s.finalCustomer, s.deliveryTerms, s.containerType, s.containerNo, s.sealNo, tare, s.pallet, pw, it.item || '', it.description || '', q, bpp, pal, num(it.kgPerBag), net, gross, gross + tare, it.batch || '', num(it.price), s.blNo, s.carrier, s.vessel, d(s.stackingStart), d(s.stackingEnd), d(s.deliveryDate), s.invoiceNo, s.status, s.logistics, s.destIncoterm, s.remarks]);
        });
      });
      const ws = X.utils.aoa_to_sheet(out, { cellDates: true, dateNF: 'dd-mm-yyyy' });
      ws['!cols'] = H.map((h, i) => ({ wch: [0, 1].includes(i) ? 6 : Math.min(28, Math.max(10, h.length + 2)) }));
      ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: out.length - 1, c: H.length - 1 } }) };
      const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Ventas');
      const buf = X.write(wb, { type: 'array', bookType: 'xlsx', cellDates: true });
      await saveFile(`Embarques_${todayISO()}.xlsx`, new Uint8Array(buf));
    } catch (e) { toast('No se pudo exportar: ' + (e.message || e)); }
  }

  // ---------- Maestros ----------
  const MASTER_TABS = [
    ['customers', 'Clientes', [['name', 'Nombre (Final Customer)'], ['address', 'Dirección'], ['city', 'Ciudad / Estado'], ['postal', 'Código postal'], ['country', 'País']]],
    ['items', 'Productos', [['code', 'Item N°'], ['description', 'Descripción'], ['kgPerBag', 'Kg por bolsa', 'n'], ['price', 'Precio USD/bolsa', 'n'], ['bagsPerPallet', 'Bolsas por pallet', 'n']]],
    ['pallets', 'Pallets', [['name', 'Tipo de pallet'], ['weight', 'Peso kg', 'n']]],
    ['forwarders', 'Forwarders', [['name', 'Forwarder'], ['contact', 'Contacto (saludo del correo)'], ['email', 'Correo booking (Para)'], ['cc', 'En copia (CC) — separar con ;']]],
    ['lists', 'Listas', null]
  ];
  const LISTS = [['carriers', 'Carriers'], ['pols', 'Puertos de carga'], ['pods', 'Puertos de destino'], ['containerTypes', 'Tipos de contenedor'], ['statuses', 'Status'], ['deliveryTerms', 'Delivery terms (CL)'], ['destIncoterms', 'Incoterm en destino'], ['salesModes', 'Modalidad de venta'], ['paymentTerms', 'Formas de pago'], ['logistics', 'Logística nacional']];
  function viewMasters() {
    const tab = MASTER_TABS.find(t => t[0] === S.masterTab) || MASTER_TABS[0];
    const dis = S.canWrite ? '' : 'disabled';
    let body;
    if (tab[0] === 'lists') {
      body = `<div class="grid g3">${LISTS.map(([k, l]) => `<label class="f" for="ls_${k}">${l} <span class="muted">(uno por línea)</span><textarea id="ls_${k}" data-list="${k}" rows="6" ${dis}>${esc((S.masters[k] || []).join('\n'))}</textarea></label>`).join('')}</div>`;
    } else {
      const rows = S.masters[tab[0]] || [];
      body = `<div class="tablewrap items"><table><thead><tr>${tab[2].map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr>${tab[2].map(c => `<td><input ${c[2] === 'n' ? 'type="number" step="any"' : ''} data-m="${tab[0]}" data-mi="${i}" data-mk="${c[0]}" value="${esc(r[c[0]])}" aria-label="${esc(c[1])}" ${dis} style="${c[0] === 'name' || c[0] === 'description' || c[0] === 'address' || c[0] === 'email' ? 'min-width:240px' : c[0] === 'cc' ? 'min-width:380px' : 'min-width:90px'}"></td>`).join('')}
        <td><button class="btn small danger" data-mdel="${tab[0]}:${i}" ${dis} aria-label="Eliminar fila">×</button></td></tr>`).join('')}
      </tbody></table></div><div><button class="btn small" data-madd="${tab[0]}" ${dis}>Agregar fila</button></div>`;
    }
    return `<div class="head"><div><h1>Maestros</h1><div class="sub">Clientes, productos y listas que alimentan los formularios y documentos (equivalente a la hoja DataBase).</div></div>
      <div class="row">${S.formDirty ? '<span class="pill s-por">Cambios sin guardar</span>' : ''}<button class="btn primary" data-action="saveMasters" ${dis}>Guardar maestros</button></div></div>
      <div class="tabs" role="tablist">${MASTER_TABS.map(t => `<button role="tab" class="${t[0] === tab[0] ? 'on' : ''}" data-mtab="${t[0]}">${t[1]}</button>`).join('')}</div>
      <section class="card">${body}</section>`;
  }

  // ---------- Ajustes ----------
  const SETTING_GROUPS = [
    ['Shipper (Saltwell SpA)', [['shipperName', 'Nombre'], ['shipperAddress', 'Dirección'], ['shipperCity', 'Ciudad'], ['shipperCountry', 'País'], ['shipperRut', 'RUT'], ['shipperEmail', 'Correo']]],
    ['Consignee / Customer (Saltwell AB)', [['consigneeName', 'Nombre'], ['consigneeAddress', 'Dirección'], ['consigneeCity', 'Ciudad'], ['consigneeCountry', 'País']]],
    ['Pie de documentos y firma', [['footerAddress1', 'Dirección línea 1'], ['footerAddress2', 'Dirección línea 2'], ['shipperCountryTitle', 'País'], ['vatNo', 'VAT N°'], ['signatoryName', 'Firmante'], ['signatoryTitle', 'Cargo'], ['exportRef', 'Export reference (declaración de origen)'], ['origin', 'Country of origin'], ['currency', 'Moneda proforma']]],
    ['ISF (embarques a USA)', [['isfManufacturerName', 'Manufacturer'], ['isfManufacturerAddress', 'Dirección manufacturer / stuffing'], ['isfSellerAddress', 'Dirección seller / consignee'], ['isfImporterNumber', 'Importer of record'], ['isfHts', 'USHTS'], ['isfFiler', 'ISF filer'], ['usaCountries', 'Países que requieren ISF (separados por coma)']]],
    ['Correos internos Saltwell', [['internalCc', 'En copia en los correos de booking y de agente de aduanas (separar con ;)', 'ta']]],
    ['Correo agente de aduanas', [['customsName', 'Nombre (saludo)'], ['customsTo', 'Correo (Para)'], ['customsCcRules', 'CC según puerto de carga (una línea por puerto: Puerto: correo; correo)', 'ta'], ['customsIntro', 'Texto', 'ta']]],
    ['Correo de booking', [['bookingIntro', 'Texto (1 contenedor)', 'ta'], ['bookingIntroPlural', 'Texto (varios contenedores)', 'ta'], ['bookingSign', 'Firma', 'ta']]]
  ];
  function viewSettings() {
    const dis = S.canWrite ? '' : 'disabled';
    if (S.db && !S.fbLoaded) { S.fbLoaded = true; S.db.collection('feedback').get().then(q => { S.feedback = q.docs.map(d => d.data()).sort((a, b) => (b.at || '').localeCompare(a.at || '')); if (S.route === 'ajustes' && !S.formDirty) render(); }).catch(() => {}); }
    const fb = (S.feedback || []).length ? `<section class="card"><h3>Sugerencias de mejora recibidas (${S.feedback.length})</h3>${S.feedback.slice(0, 30).map(f => `<div class="att"><span class="mono muted">${fmtD((f.at || '').slice(0, 10))}</span><span data-notr>${esc(f.text)}</span><span class="muted" style="margin-left:auto">${esc(whoName(f.by))}</span></div>`).join('')}
      <p class="muted" style="font-size:12px;margin:0">Pídele a Claude en el chat donde se creó esta página que revise estas sugerencias para implementarlas.</p></section>` : '';
    return `<div class="head"><div><h1>Ajustes</h1><div class="sub">Datos fijos que aparecen en Draft PL, Proforma, Packing List, ISF y correo de booking.</div></div>
      <div class="row">${S.formDirty ? '<span class="pill s-por">Cambios sin guardar</span>' : ''}<button class="btn primary" data-action="saveSettings" ${dis}>Guardar ajustes</button></div></div>
      ${SETTING_GROUPS.map(([t, fs]) => `<section class="card"><h3>${t}</h3><div class="form">${fs.map(([k, l, ty]) => ty === 'ta'
        ? `<label class="f" for="st_${k}" style="grid-column:1/-1">${l}<textarea id="st_${k}" data-st="${k}" rows="3" ${dis}>${esc(S.settings[k])}</textarea></label>`
        : `<label class="f" for="st_${k}">${l}<input id="st_${k}" data-st="${k}" value="${esc(S.settings[k])}" ${dis}></label>`).join('')}</div>
        ${t.startsWith('Pie') ? `<label class="row"><input type="checkbox" data-st-bool="showSignature" ${S.settings.showSignature !== false ? 'checked' : ''} ${dis}> Incluir firma escaneada en los documentos</label>` : ''}</section>`).join('')}${fb}`;
  }

  // ---------- Diálogos ----------
  function modal(html, cls) {
    $('#modalRoot').innerHTML = `<div class="modal-bg" data-bg><div class="modal ${cls || ''}" role="dialog" aria-modal="true">${html}</div></div>`;
    if (window.decorateIcons) window.decorateIcons($('#modalRoot'));
    const first = $('#modalRoot .modal button, #modalRoot .modal input'); if (first) first.focus();
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }
  function confirmDialog(text, okLabel, onOk) {
    modal(`<h2>${esc(text)}</h2><div class="row" style="justify-content:flex-end"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="cfOk">${esc(okLabel)}</button></div>`);
    $('#cfOk').onclick = () => { closeModal(); onOk(); };
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').innerHTML) closeModal(); });

  // ---------- Eventos ----------
  function onClick(e) {
    const bl = e.target.closest('[data-openbl],[data-blsave],[data-blremove],[data-blai]');
    if (bl) {
      if (bl.dataset.openbl) { location.hash = '#bl-' + bl.dataset.openbl; return; }
      if (bl.dataset.blsave) { saveBL(bl.dataset.blsave); return; }
      if (bl.dataset.blremove) { S.blImports.splice(+bl.dataset.blremove.slice(1), 1); render(); return; }
      if (bl.dataset.blai) { processBL(blObj(bl.dataset.blai), true); return; }
    }
    const bt = e.target.closest('[data-openbk],[data-bksave],[data-bkremove],[data-bkai]');
    if (bt) {
      if (bt.dataset.openbk) { location.hash = '#bk-' + bt.dataset.openbk; return; }
      if (bt.dataset.bksave) { saveBooking(bt.dataset.bksave); return; }
      if (bt.dataset.bkremove) { S.bkImports.splice(+bt.dataset.bkremove.slice(1), 1); render(); return; }
      if (bt.dataset.bkai) { processBooking(bkObj(bt.dataset.bkai), true); return; }
    }
    const aq = e.target.closest('[data-aiq],[data-aifix],[data-ctlsev]');
    if (aq) {
      if (aq.dataset.aiq) { aiAsk(aq.dataset.aiq); return; }
      if (aq.dataset.ctlsev !== undefined) { S.ctl.sev = aq.dataset.ctlsev; render(); return; }
      const fx = S.aiFixes && S.aiFixes[+aq.dataset.aifix];
      if (fx && S.edit) { const f = FIELDS.find(x => x[0] === fx.campo); S.edit.draft[fx.campo] = f && f[2] === 'number' ? num(fx.valor) : String(fx.valor); S.edit.dirty = true; aq.disabled = true; aq.textContent = '✓ ' + aq.textContent.replace(/^Aplicar: /, ''); render(); toast('Aplicado al formulario. Revisa y guarda.'); }
      return;
    }
    const so = e.target.closest('[data-sort]');
    if (so) { const [tb, k] = so.dataset.sort.split(':'); toggleSort(tb, k); return; }
    const vw = e.target.closest('[data-view],[data-viewdel],[data-fltdel]');
    if (vw) {
      if (vw.dataset.fltdel !== undefined) { S.list.filters.splice(+vw.dataset.fltdel, 1); render(); return; }
      if (vw.dataset.viewdel !== undefined) { S.prefs.views.splice(+vw.dataset.viewdel, 1); savePrefs(); render(); return; }
      const v = S.prefs.views[+vw.dataset.view]; if (!v) return;
      Object.assign(S.list, clone({ q: v.q || '', status: v.status || 'activos', customer: v.customer || '', year: v.year || 'all', group: !!v.group, filters: v.filters || [], sort: v.sort || S.list.sort, cols: v.cols || S.list.cols }));
      S.list.showFilters = (S.list.filters || []).length > 0; savePrefs(); render(); return;
    }
    const lb = e.target.closest('[data-lang]');
    if (lb) { setLang(lb.dataset.lang, true); return; }
    const t = e.target.closest('[data-action],[data-open],[data-doc],[data-status],[data-goto-status],[data-close],[data-bg],[data-delitem],[data-delatt],[data-imp-apply],[data-imp-remove],[data-imp-ai],[data-imp-addcust],[data-madd],[data-mdel],[data-mtab],[data-copy],[data-sel]');
    if (!t) return;
    if (t.hasAttribute('data-bg') && e.target !== t) return;
    if (t.dataset.sel !== undefined) { e.stopPropagation(); const id = t.dataset.sel; t.checked ? S.list.sel.add(id) : S.list.sel.delete(id); render(); return; }
    if (t.dataset.open) { if (e.target.closest('input,a,button')) return; location.hash = '#e-' + t.dataset.open; return; }
    if (t.hasAttribute('data-close') || t.hasAttribute('data-bg')) { closeModal(); return; }
    if (t.dataset.gotoStatus) { S.list.status = t.dataset.gotoStatus; return; }
    if (t.dataset.status) { S.list.status = t.dataset.status; render(); return; }
    if (t.dataset.doc) { if (S.edit) openDoc(t.dataset.doc, [S.edit.draft]); return; }
    if (t.dataset.copy) { const el = document.getElementById(t.dataset.copy); navigator.clipboard.writeText(el.value).then(() => toast('Copiado'), () => { el.select(); toast('Selecciona y copia con Ctrl+C'); }); return; }
    if (t.dataset.delitem !== undefined) { S.edit.draft.items.splice(+t.dataset.delitem, 1); S.edit.dirty = true; rerenderKeepFocus(); return; }
    if (t.dataset.delatt !== undefined) { S.edit.draft.attachments.splice(+t.dataset.delatt, 1); S.edit.dirty = true; rerenderKeepFocus(); return; }
    if (t.dataset.impApply !== undefined) { applyImport(+t.dataset.impApply); return; }
    if (t.dataset.impRemove !== undefined) { S.imports.splice(+t.dataset.impRemove, 1); render(); return; }
    if (t.dataset.impAi !== undefined) { processImport(S.imports[+t.dataset.impAi], true); return; }
    if (t.dataset.impAddcust !== undefined) { addCustomerFromImport(+t.dataset.impAddcust); return; }
    if (t.dataset.mtab) { S.masterTab = t.dataset.mtab; render(); return; }
    if (t.dataset.madd) { const k = t.dataset.madd; S.masters[k] = (S.masters[k] || []).concat([{}]); S.formDirty = true; render(); return; }
    if (t.dataset.mdel) { const [k, i] = t.dataset.mdel.split(':'); S.masters[k].splice(+i, 1); S.formDirty = true; render(); return; }
    const a = t.dataset.action;
    if (a === 'save') saveEdit();
    else if (a === 'discard') { S.edit = null; render(); }
    else if (a === 'addItem') { const prev = S.edit.draft.items[S.edit.draft.items.length - 1]; S.edit.draft.items.push(prev ? Object.assign({}, prev, { batch: '' }) : itemFromMaster('', 0)); S.edit.dirty = true; rerenderKeepFocus(); }
    else if (a === 'booking') bookingEmail([S.edit.draft]);
    else if (a === 'customs') { if (S.edit.dirty) toast('Guarda primero este embarque.'); else customsEmail(S.edit.draft); }
    else if (a === 'bookingSel') bookingEmail(Array.from(S.list.sel).map(id => S.ships.get(id)).filter(Boolean).sort((x, y) => x.n - y.n));
    else if (a === 'clearSel') { S.list.sel.clear(); render(); }
    else if (a === 'aiOpen') { S.ai = S.ai || { open: false, turns: [], busy: false }; S.ai.open = true; render(); setTimeout(() => { const i = $('#aiInput'); if (i) i.focus(); }, 0); }
    else if (a === 'aiClose') { if (S.ai) { S.ai.open = false; if (S.ai.ctl && S.ai.busy) S.ai.ctl.abort(); } render(); }
    else if (a === 'aiReview') { if (S.edit && S.edit.dirty) toast('Guarda primero este embarque.'); else aiReview(); }
    else if (a === 'sendFeedback') sendFeedback();
    else if (a === 'toggleFilters') { S.list.showFilters = !S.list.showFilters; if (S.list.showFilters && !S.list.filters.length) S.list.filters.push({ field: 'etd', op: 'next', v1: '30', v2: '' }); render(); }
    else if (a === 'toggleCols') { S.list.showCols = !S.list.showCols; render(); }
    else if (a === 'addFilter') { S.list.filters.push({ field: 'finalCustomer', op: 'has', v1: '', v2: '' }); render(); }
    else if (a === 'clearFilters') { S.list.filters = []; render(); }
    else if (a === 'resetCols') { S.list.cols = null; savePrefs(); render(); }
    else if (a === 'saveView') saveViewDialog();
    else if (a === 'bulkStatus') bulkStatus();
    else if (a === 'duplicate') duplicate();
    else if (a === 'delete') confirmDialog(`¿Eliminar el embarque N° ${S.edit.draft.n}? Esta acción no se puede deshacer.`, 'Eliminar', async () => {
      try { await S.db.doc('shipments/' + S.edit.id).delete(); S.ships.delete(S.edit.id); S.edit = null; toast('Embarque eliminado'); location.hash = '#embarques'; }
      catch (err) { toast('No se pudo eliminar: ' + (err.message || err.code)); }
    });
    else if (a === 'propagate') propagate();
    else if (a === 'delBL') confirmDialog('¿Eliminar este BL? Los embarques mantienen el N° de BL.', 'Eliminar', async () => {
      try { await S.db.doc('bls/' + S.param).delete(); S.bls.delete(S.param); S.blEdit = null; toast('BL eliminado'); location.hash = '#bls'; }
      catch (err) { toast('No se pudo eliminar: ' + (err.message || err.code)); }
    });
    else if (a === 'delBooking') confirmDialog('¿Eliminar este booking? Las órdenes mantienen sus datos.', 'Eliminar', async () => {
      try { await S.db.doc('bookings/' + S.param).delete(); S.bookings.delete(S.param); S.bkEdit = null; toast('Booking eliminado'); location.hash = '#bookings'; }
      catch (err) { toast('No se pudo eliminar: ' + (err.message || err.code)); }
    });
    else if (a === 'exportXlsx') exportXlsx();
    else if (a === 'saveMasters') doSaveMasters();
    else if (a === 'saveSettings') doSaveSettings();
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.bkf) { const [k, f] = t.dataset.bkf.split(':'); const o = bkObj(k); if (o) { o.form[f] = t.value; o.dirty = true; } return; }
    if (t.dataset.flt && (t.type === 'text' || t.type === 'number')) {
      const [i, k] = t.dataset.flt.split(':'); S.list.filters[+i][k] = t.value;
      clearTimeout(S.fltTimer);
      S.fltTimer = setTimeout(() => {
        const a = document.activeElement; const key = a && a.dataset && a.dataset.flt; const pos = a && a.selectionStart;
        render();
        const el = key && document.querySelector(`[data-flt="${key}"]`); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { /* number */ } }
      }, 350);
      return;
    }
    if (t.id === 'ctlQ') { S.ctl.q = t.value; const pos = t.selectionStart; render(); const q = $('#ctlQ'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } return; }
    if (t.id === 'q') { S.list.q = t.value; const pos = t.selectionStart; render(); const q = $('#q'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } return; }
    if (S.edit && t.dataset.f) {
      const k = t.dataset.f; let v = t.value;
      if (t.type === 'number') v = v === '' ? 0 : num(v);
      S.edit.draft[k] = v;
      if (!S.edit.dirty) { S.edit.dirty = true; rerenderKeepFocus(); }
      return;
    }
    if (S.edit && t.dataset.it !== undefined) {
      const it = S.edit.draft.items[+t.dataset.it]; const k = t.dataset.k;
      it[k] = t.type === 'number' ? (t.value === '' ? 0 : num(t.value)) : t.value;
      S.edit.dirty = true;
      if (t.type === 'number') rerenderKeepFocus();
      else if (!t.closest('tr').dataset.marked) { t.closest('tr').dataset.marked = 1; }
      return;
    }
    if (t.dataset.m) { const r = S.masters[t.dataset.m][+t.dataset.mi]; r[t.dataset.mk] = t.type === 'number' ? num(t.value) : t.value; S.formDirty = true; return; }
    if (t.dataset.list) { S.masters[t.dataset.list] = t.value.split('\n').map(s => s.trim()).filter(Boolean); S.formDirty = true; return; }
    if (t.dataset.st) { S.settings[t.dataset.st] = t.value; S.formDirty = true; return; }
  }
  function onChange(e) {
    const t = e.target;
    if (t.id === 'fileIn') { addFiles(Array.from(t.files || [])); t.value = ''; return; }
    if (t.id === 'fileBl') { addBLFiles(Array.from(t.files || [])); t.value = ''; return; }
    if (t.dataset.blmap) { const [k, c] = t.dataset.blmap.split(':'); blObj(k).map[c] = t.value; render(); return; }
    if (t.dataset.blkind) { blObj(t.dataset.blkind).kind = t.value; return; }
    if (t.id === 'fileBk') { addBookingFiles(Array.from(t.files || [])); t.value = ''; return; }
    if (t.dataset.bkf) { if (/containerType|stacking/.test(t.dataset.bkf)) render(); return; }
    if (t.dataset.bklink) { const [k, id] = t.dataset.bklink.split(':'); const o = bkObj(k); t.checked ? o.links.add(id) : o.links.delete(id); o.dirty = true; render(); return; }
    if (t.dataset.bktype) { const [k, id] = t.dataset.bktype.split(':'); const o = bkObj(k); t.checked ? o.typeFix.add(id) : o.typeFix.delete(id); return; }
    if (t.dataset.bkres) { bkObj(t.dataset.bkres).setReserved = t.checked; return; }
    if (t.dataset.bkadd) { if (t.value) { const o = bkObj(t.dataset.bkadd); o.links.add(t.value); o.dirty = true; render(); } return; }
    if (t.dataset.flt) {
      const [i, k] = t.dataset.flt.split(':'); const f = S.list.filters[+i];
      if ((t.type === 'text' || t.type === 'number') && f[k] === t.value) return;
      f[k] = t.value;
      if (k === 'field') { const ty = LCOL[t.value][2]; f.op = OPS[ty][0][0]; f.v1 = ty === 'phase' ? 'por' : ''; f.v2 = ''; }
      if (k === 'op' && ['next', 'last'].includes(t.value)) { f.v1 = f.v1 && /^\d+$/.test(f.v1) ? f.v1 : '30'; }
      render(); return;
    }
    if (t.dataset.col) {
      const cur = (S.list.cols && S.list.cols.length ? S.list.cols : DEFAULT_COLS).slice();
      const k = t.dataset.col;
      S.list.cols = t.checked ? LCOLS.map(c => c[0]).filter(x => cur.includes(x) || x === k) : cur.filter(x => x !== k);
      if (!S.list.cols.length) S.list.cols = ['n'];
      savePrefs(); render(); return;
    }
    if (t.id === 'fYear') { S.list.year = t.value; render(); return; }
    if (t.id === 'fCust') { S.list.customer = t.value; render(); return; }
    if (t.id === 'fGroup') { S.list.group = t.checked; render(); return; }
    const repMap = { rDate: 'dateField', rYear: 'year', rFrom: 'from', rTo: 'to', rCust: 'customer', rPod: 'pod', rStatus: 'status' };
    if (repMap[t.id]) { S.rep[repMap[t.id]] = t.value; render(); return; }
    if (t.dataset.impTarget !== undefined) { const im = S.imports[+t.dataset.impTarget]; im.proposal.targetId = t.value || null; im.userTarget = t.value || null; im.proposal.matchedBy = 'selección manual'; computeChanges(im.proposal); render(); return; }
    if (t.dataset.impChk) { const [i, j] = t.dataset.impChk.split(':').map(Number); S.imports[i].proposal.changes[j].apply = t.checked; return; }
    if (t.dataset.stBool) { S.settings[t.dataset.stBool] = t.checked; S.formDirty = true; return; }
    if (S.edit && t.dataset.f === 'finalCustomer' && S.edit.isNew) {
      const d = defaultsFromCustomer(S.edit.draft, t.value);
      Object.keys(d).forEach(k => { if (k !== '_prevItems') S.edit.draft[k] = d[k]; });
      if (d._prevItems && !(S.edit.draft.items || []).length) S.edit.draft.items = d._prevItems.map(i => Object.assign({}, i, { batch: '' }));
      rerenderKeepFocus(); return;
    }
    if (S.edit && t.dataset.it !== undefined && t.dataset.k === 'item') {
      const i = +t.dataset.it; const m = S.masters.items.find(x => String(x.code) === t.value);
      if (m) { const it = S.edit.draft.items[i]; it.description = m.description; it.kgPerBag = num(m.kgPerBag); it.price = num(m.price); it.bagsPerPallet = num(m.bagsPerPallet) || it.bagsPerPallet; }
      rerenderKeepFocus(); return;
    }
    if (S.edit && (t.dataset.f || t.dataset.it !== undefined)) rerenderKeepFocus();
    if (t.dataset.m || t.dataset.list || t.dataset.st) render();
  }

  async function doSaveMasters() {
    try {
      ['customers', 'items', 'pallets', 'forwarders'].forEach(k => { S.masters[k] = (S.masters[k] || []).filter(r => Object.values(r).some(v => String(v).trim())); });
      await saveMasters(); S.formDirty = false; toast('Maestros guardados'); render();
    } catch (e) { toast('No se pudo guardar: ' + (e.message || e.code)); }
  }
  async function doSaveSettings() {
    try { await saveSettings(); S.formDirty = false; toast('Ajustes guardados'); render(); }
    catch (e) { toast('No se pudo guardar: ' + (e.message || e.code)); }
  }
  async function addCustomerFromImport(idx) {
    const im = S.imports[idx]; const c = im.proposal.unknownCustomer; if (!c) return;
    try {
      S.masters.customers = (S.masters.customers || []).concat([c]);
      await saveMasters();
      im.proposal = buildProposal(im.parsed); render(); toast('Cliente agregado a Maestros');
    } catch (e) { toast('No se pudo agregar: ' + (e.message || e.code)); }
  }
  async function propagate() {
    const sh = S.edit.draft; if (S.edit.dirty) { toast('Guarda primero este embarque.'); return; }
    const sibs = shipsArr().filter(s => s.bookingRef === sh.bookingRef && !(s.year === sh.year && s.n === sh.n));
    try {
      for (const s of sibs) { const c = clone(s); BOOKING_FIELDS.forEach(k => { c[k] = sh[k]; }); await writeShip(c, `Datos de booking copiados desde N° ${sh.n}`); }
      toast(`Actualizados ${sibs.length} contenedores`); render();
    } catch (e) { toast('No se pudo copiar: ' + (e.message || e.code)); }
  }
  async function duplicate() {
    const src = S.edit.draft; const y = new Date().getFullYear();
    const c = clone(src);
    Object.assign(c, { n: nextN(y), year: y, soRef: '', customerRef: '', poRef: '', bookingRef: '', containerNo: '', sealNo: '', tare: 0, blNo: '', vessel: '', invoiceNo: '', status: 'Por Reservar', logistics: '', stackingStart: '', stackingEnd: '', deliveryDate: '', etd: '', eta: '', orderDate: todayISO(), attachments: [], log: [] });
    c.items = (c.items || []).map(i => Object.assign({}, i, { batch: '' }));
    S.edit = { id: 'nuevo', draft: c, dirty: true, isNew: true };
    history.pushState(null, '', '#nuevo'); S.route = 'nuevo'; render();
    toast('Copia creada: completa las referencias y guarda.');
  }
  function saveViewDialog() {
    modal(`<h2>Guardar vista</h2><p class="muted">Guarda la búsqueda, filtros, orden y columnas actuales para usarlos con un clic. Las vistas son personales.</p>
      <label class="f" for="vwName">Nombre de la vista<input id="vwName" placeholder="Ej.: Healy por zarpar"></label>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="vwOk">Guardar</button></div>`);
    $('#vwOk').onclick = () => {
      const name = $('#vwName').value.trim(); if (!name) { $('#vwName').focus(); return; }
      const L = S.list;
      S.prefs.views = (S.prefs.views || []).filter(v => v.name !== name).concat([clone({ name, q: L.q, status: L.status, customer: L.customer, year: L.year, group: L.group, filters: L.filters, sort: L.sort, cols: L.cols })]);
      savePrefs(); closeModal(); render(); toast('Vista guardada');
    };
  }
  function bulkStatus() {
    const ids = Array.from(S.list.sel);
    modal(`<h2>Cambiar status de ${ids.length} embarque${ids.length > 1 ? 's' : ''}</h2>
      <label class="f" for="bsSel">Nuevo status<select id="bsSel">${S.masters.statuses.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="bsOk">Aplicar</button></div>`);
    $('#bsOk').onclick = async () => {
      const v = $('#bsSel').value; closeModal();
      try { for (const id of ids) { const c = clone(S.ships.get(id)); c.status = v; await writeShip(c, 'Status: ' + v); } S.list.sel.clear(); toast('Status actualizado'); render(); }
      catch (e) { toast('No se pudo actualizar: ' + (e.message || e.code)); }
    };
  }

  // ---------- Idioma ----------
  function initialLang() {
    try { const v = localStorage.getItem('sw_lang'); if (['es', 'en', 'sv'].includes(v)) return v; } catch (e) { /* sin almacenamiento */ }
    const nl = navigator.language || 'es';
    return /^es\b/i.test(nl) ? 'es' : /^(sv|nb|no|da)\b/i.test(nl) ? 'sv' : 'en';
  }
  async function setLang(lang, persist) {
    if (lang === window.I18N.lang) return;
    window.I18N.set(lang);
    render();
    if (!persist) return;
    try { localStorage.setItem('sw_lang', lang); } catch (e) { /* sin almacenamiento */ }
    S.prefs.lang = lang; savePrefs();
  }
  async function loadLangPref() {
    if (!S.db || !S.me) return;
    try {
      const d = await S.db.doc('data/users/' + S.me + '/prefs').get();
      if (d.exists) {
        S.prefs = Object.assign({}, S.prefs, clone(d.data())); S.prefs.views = S.prefs.views || [];
        applyPrefs();
        if (S.prefs.lang) { setLang(S.prefs.lang, false); try { localStorage.setItem('sw_lang', S.prefs.lang); } catch (e) { /* nada */ } }
        render();
      }
    } catch (e) { /* nada */ }
  }

  // ---------- Arranque ----------
  if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
  window.__app = { S, totals, buildProposal, phase };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
