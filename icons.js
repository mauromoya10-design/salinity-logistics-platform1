/* Íconos de línea (estilo Lucide, dibujados a mano) y decoración automática de la interfaz. */
(function () {
  'use strict';
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
    ship: '<path d="M2 20c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0"/><path d="M4 17 3 12h18l-2 5"/><path d="M12 3v9"/><path d="M7 12V7h10v5"/>',
    upload: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/>',
    booking: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
    bl: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pdf: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M12 11v6"/><path d="m9 14 3 3 3-3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    spark: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a2 2 0 0 1 2-2h11"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
    container: '<rect x="2" y="6" width="20" height="12" rx="1"/><path d="M6 6v12M10 6v12M14 6v12M18 6v12"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    order: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3"/><path d="M9 11h6M9 15h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
    alert: '<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
    plane: '<path d="M2 12h14l4-4 2 2-4 4 4 4-2 2-4-4H2"/>',
    arrival: '<path d="M2 20h20"/><path d="M5 17 3 9l3 1 3 4 9 2a2 2 0 0 1 0 4z"/>',
    departure: '<path d="M2 20h20"/><path d="M4 15 2 9l3 .5 3 3.5 9-4a2 2 0 0 1 2 3.5L8 17z"/>',
    filter: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    open: '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    excel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    zip: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M10 6h2M10 9h2M10 12h2M10 15h2v3h-2z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    customs: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/><path d="M9 10h6"/>'
  };
  const svg = (n, size) => P[n] ? `<svg class="ic" width="${size || 16}" height="${size || 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>` : '';
  window.ICON = svg;

  // Reglas: selector → ícono (se antepone al contenido una sola vez)
  const RULES = [
    ['nav.side a[data-nav="inicio"]', 'home'], ['nav.side a[data-nav="embarques"]', 'ship'], ['nav.side a[data-nav="importar"]', 'upload'],
    ['nav.side a[data-nav="bookings"]', 'booking'], ['nav.side a[data-nav="bls"]', 'bl'], ['nav.side a[data-nav="controles"]', 'shield'],
    ['nav.side a[data-nav="reportes"]', 'chart'], ['nav.side a[data-nav="maestros"]', 'db'], ['nav.side a[data-nav="ajustes"]', 'gear'],
    ['a.btn[href="#nuevo"]', 'plus'], ['a.btn[href="#importar"]', 'upload'], ['a.btn[href="#bookings"]', 'booking'], ['a.btn[href="#bls"]', 'bl'],
    ['[data-doc="draft"]', 'pdf'], ['[data-doc="proforma"]', 'pdf'], ['[data-doc="pl"]', 'pdf'], ['[data-doc="isf"]', 'pdf'],
    ['[data-action="booking"]', 'mail'], ['[data-action="customs"]', 'customs'], ['[data-action="aiReview"]', 'spark'], ['[data-action="aiOpen"]', 'spark'],
    ['[data-action="duplicate"]', 'copy'], ['[data-action="delete"]', 'trash'], ['[data-action="delBooking"]', 'trash'], ['[data-action="delBL"]', 'trash'],
    ['[data-action="save"]', 'save'], ['[data-action="saveMasters"]', 'save'], ['[data-action="saveSettings"]', 'save'], ['[data-bksave]', 'save'], ['[data-blsave]', 'save'], ['[data-imp-apply]', 'save'],
    ['[data-action="exportXlsx"]', 'excel'], ['[data-action="toggleFilters"]', 'filter'], ['[data-action="toggleCols"]', 'columns'], ['[data-action="addFilter"]', 'plus'],
    ['[data-action="addItem"]', 'plus'], ['[data-madd]', 'plus'], ['[data-action="bookingSel"]', 'mail'], ['[data-action="propagate"]', 'copy'],
    ['#dlPdf', 'pdf'], ['#caEml', 'mail'], ['#caZip', 'zip'], ['#bkCopyHtml', 'copy'], ['#bkMail', 'send'], ['#caMail', 'send'], ['#bkPdf', 'pdf'], ['[data-copy]', 'copy'],
    ['a.btn[href^="#e-"]', 'open'], ['a.btn[href^="#bk-"]', 'booking'], ['a.btn[href^="#bl-"]', 'bl'], ['label.btn[for="fileIn"]', 'upload'], ['label.btn[for="fileBk"]', 'upload'], ['label.btn[for="fileBl"]', 'upload'],
    ['[data-action="sendFeedback"]', 'send'], ['[data-bkai]', 'spark'], ['[data-blai]', 'spark'], ['[data-imp-ai]', 'spark']
  ];
  // Íconos para títulos de sección (h2/h3) según su texto en español
  const HEAD = [
    [/^Próximos zarpes/, 'departure'], [/^Requiere atención/, 'alert'], [/^Llegadas próximas/, 'arrival'], [/^Actividad reciente/, 'clock'],
    [/^Documentos$/, 'pdf'], [/^Orden y venta/, 'order'], [/^Cliente final/, 'user'], [/^Booking y transporte/, 'truck'], [/^Contenedor$/, 'container'],
    [/^Mercadería/, 'box'], [/^PDF adjuntos/, 'clip'], [/^Historial/, 'clock'], [/^Booking /, 'booking'], [/^BL /, 'bl'], [/^Mismo booking/, 'list'],
    [/^Órdenes asociadas/, 'list'], [/^Contenedores/, 'container'], [/^Bookings registrados/, 'booking'], [/^BL registrados/, 'bl'],
    [/^Toneladas por cliente/, 'user'], [/^Por producto/, 'box'], [/^Detalle$/, 'list'], [/^Shipper/, 'anchor'], [/^Consignee/, 'anchor'],
    [/^Pie de documentos/, 'pdf'], [/^ISF/, 'customs'], [/^Correo/, 'mail'], [/^Correos internos/, 'mail'], [/^Sugerencias/, 'chat'],
    [/^Adjuntos/, 'clip'], [/^Vista previa/, 'eye'], [/^PDF del/, 'clip'], [/^Contenedores por mes/, 'chart']
  ];
  function decorate(root) {
    root = root || document;
    for (const [sel, name] of RULES) {
      root.querySelectorAll(sel).forEach(el => {
        if (el.dataset.ic) return;
        el.dataset.ic = '1';
        el.insertAdjacentHTML('afterbegin', svg(name));
      });
    }
    root.querySelectorAll('.card h2, .card h3, section h2, section h3').forEach(h => {
      if (h.dataset.ic) return;
      const t = (h.dataset.es || h.textContent || '').trim();
      const r = HEAD.find(([re]) => re.test(t));
      h.dataset.ic = '1';
      if (r) { h.classList.add('with-ic'); h.insertAdjacentHTML('afterbegin', `<span class="hic">${svg(r[1], 15)}</span>`); }
    });
  }
  window.decorateIcons = decorate;
})();
