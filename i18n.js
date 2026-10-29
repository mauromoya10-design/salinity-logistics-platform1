/* Traducción de la interfaz (español → inglés). La app se escribe en español; cuando el usuario elige
   inglés, cada nodo que entra al DOM se traduce con un diccionario y patrones. Los datos (clientes,
   referencias, valores de listas maestras) no se tocan. Los documentos PDF ya salen en inglés. */
(function () {
  'use strict';
  const D = {
    // Navegación y generales
    'Inicio': 'Home', 'Embarques': 'Shipments', 'Importar PDF': 'Import PDF', 'Reportes': 'Reports', 'Maestros': 'Master data', 'Ajustes': 'Settings',
    'Cargando embarques…': 'Loading shipments…', 'Cerrar': 'Close', 'Cancelar': 'Cancel', 'Aplicar': 'Apply', 'Guardar': 'Save', 'Quitar': 'Remove',
    'Eliminar': 'Delete', 'Descartar': 'Discard', 'Duplicar': 'Duplicate', 'Todos': 'All', 'Sin datos.': 'No data.', 'Copiado': 'Copied',
    'Saltwell Embarques': 'Saltwell Shipments', 'Gestión de embarques, órdenes y documentos de exportación': 'Shipments, orders and export documents',
    'Esta página guarda los embarques en una base de datos compartida que sólo funciona al abrirla dentro de Claude con tu cuenta. Ábrela desde el enlace del artefacto en claude.ai.': 'This page stores shipments in a shared database that only works when opened inside Claude with your account. Open it from the artifact link on claude.ai.',
    'Tienes acceso de lectura. Para crear o editar embarques, pide al dueño de la página que te comparta con permiso de edición.': 'You have read-only access. To create or edit shipments, ask the page owner to share it with you as an editor.',
    // Inicio
    'Importar PDF de orden': 'Import order PDF', 'Nuevo embarque': 'New shipment', 'Por reservar': 'To book', 'Booking solicitado': 'Booking requested',
    'Reservados por zarpar': 'Booked, awaiting departure', 'En tránsito': 'In transit', 'Próximos zarpes (30 días)': 'Upcoming departures (30 days)',
    'Cliente': 'Customer', 'Estado': 'Status', 'No hay zarpes en los próximos 30 días.': 'No departures in the next 30 days.', 'Requiere atención': 'Needs attention',
    'Reservado sin N° de contenedor': 'Booked without container No.', 'En tránsito sin N° BL': 'In transit without BL No.', 'Todo al día.': 'All up to date.',
    'Llegadas próximas': 'Upcoming arrivals', 'Contenedor': 'Container', 'Sin contenedores en tránsito.': 'No containers in transit.',
    'Actividad reciente': 'Recent activity', 'Aún no hay cambios registrados en la aplicación.': 'No changes recorded in the app yet.', 'Actualizado': 'Updated',
    'Reservado': 'Booked', 'Entregado': 'Delivered', 'Despachado, por zarpar': 'At port, awaiting departure', 'Alguien': 'Someone',
    // Lista
    'Un registro por contenedor (PO/SO). Busca por N°, orden, cliente, booking, contenedor o BL.': 'One record per container (PO/SO). Search by No., order, customer, booking, container or BL.',
    'Buscar: 232604, Healy, MRKU…': 'Search: 232604, Healy, MRKU…', 'Buscar embarques': 'Search shipments', 'Todos los años': 'All years', 'Todos los clientes': 'All customers',
    'Año': 'Year', 'Agrupar por booking': 'Group by booking', 'Activos': 'Active', 'Reservados': 'Booked', 'Entregados': 'Delivered', 'Solicitar booking': 'Request booking',
    'Cambiar status…': 'Change status…', 'Quitar selección': 'Clear selection', 'Bolsas': 'Bags', 'No hay embarques con estos filtros.': 'No shipments match these filters.',
    '— Sin booking —': '— No booking —',
    // Detalle
    'Volver a la lista': 'Back to list', 'Sin cliente': 'No customer', 'Cambios sin guardar': 'Unsaved changes', 'Crear embarque': 'Create shipment', 'Documentos': 'Documents',
    'Guarda antes de generar para incluir los últimos cambios': 'Save before generating to include your latest changes', 'Vista previa y descarga en PDF': 'Preview and download as PDF',
    'Packing List final': 'Final Packing List', 'Guarda primero': 'Save first', 'Correo de booking': 'Booking email', 'Orden y venta': 'Order & sale', 'Cliente final': 'Final customer',
    'Booking y transporte': 'Booking & transport', 'Mercadería': 'Goods', 'Fecha orden': 'Order date', 'Modalidad venta': 'Sales mode', 'Forma de pago': 'Payment terms',
    'Incoterm en destino': 'Destination Incoterm', 'N° Invoice': 'Invoice No.', 'Logística nacional': 'Domestic logistics', 'Inicio stacking': 'Stacking opens',
    'Cierre stacking': 'Stacking closes', 'Fecha entrega a puerto': 'Port delivery date', 'N° BL': 'BL No.', 'Tipo contenedor': 'Container type', 'Tara (kg)': 'Tare (kg)',
    'Dirección': 'Address', 'Ciudad': 'City', 'País': 'Country',
    'Este cliente no está en Maestros: agrégalo para que su dirección salga en los documentos.': 'This customer is not in Master data: add it so its address appears on the documents.',
    'Selecciona el cliente final.': 'Select the final customer.', 'sin contenedor': 'no container',
    'Copia forwarder, carrier, vessel, puertos, ETD/ETA, stacking y fecha de entrega.': 'Copies forwarder, carrier, vessel, ports, ETD/ETA, stacking and delivery date.',
    'Agregar ítem': 'Add item', 'Descripción': 'Description', 'Bolsas/pallet': 'Bags/pallet', 'Kg/bolsa': 'Kg/bag', 'Kg neto': 'Net kg', 'Precio USD': 'Price USD',
    'Batch / Lote': 'Batch', 'Lote(s)': 'Batch(es)', 'Código ítem': 'Item code', 'Bolsas por pallet': 'Bags per pallet', 'Kg por bolsa': 'Kg per bag', 'Precio por bolsa': 'Price per bag',
    'Quitar ítem': 'Remove item', 'Sin ítems. Agrega uno o importa el PDF de la orden.': 'No items. Add one or import the order PDF.', 'Peso neto kg': 'Net weight kg',
    'Peso pallets kg': 'Pallets weight kg', 'Peso bruto kg': 'Gross weight kg', 'PDF adjuntos': 'Attached PDFs', 'Los PDF importados (PO / SO) quedan guardados aquí.': 'Imported PDFs (PO / SO) are kept here.',
    'Historial': 'History', 'Sin cambios registrados en la aplicación.': 'No changes recorded in the app.', 'SO cliente': 'Customer SO', 'Ítems': 'Items',
    'Embarque creado': 'Shipment created', 'Guardado': 'Saved', 'Booking solicitado al forwarder': 'Booking requested from forwarder', 'Importado desde Ventas_Contenedores.xlsx': 'Imported from Ventas_Contenedores.xlsx',
    // Modales de documentos y booking
    'Faltan datos para el Packing List final (contenedor, sello o BL). Puedes descargarlo igual.': 'Data missing for the final Packing List (container, seal or BL). You can still download it.',
    'Generando vista previa…': 'Generating preview…', 'Descargar PDF': 'Download PDF', 'No se pudo mostrar la vista previa, pero puedes descargar el PDF.': 'The preview could not be shown, but you can download the PDF.',
    'Agrega el correo del forwarder en Maestros': 'Add the forwarder email in Master data', 'Asunto': 'Subject', 'Texto': 'Body', 'Copiar asunto': 'Copy subject', 'Copiar texto': 'Copy body',
    'Abrir en mi correo': 'Open in my email', 'Marcar como "Booking solicitado"': 'Mark as "Booking requested"',
    'Si el botón de correo no abre tu programa, usa Copiar asunto y Copiar texto y pégalos en Outlook.': 'If the email button does not open your mail app, use Copy subject and Copy body and paste them into Outlook.',
    // Importar
    'Arrastra las Purchase Orders y Sales Orders que recibes. Se leen los datos, se buscan en la base y te muestro qué se va a crear o actualizar antes de guardar.': 'Drop the Purchase Orders and Sales Orders you receive. The data is read, matched against the database, and you see what will be created or updated before saving.',
    'Arrastra aquí uno o varios PDF': 'Drop one or more PDFs here', 'PO de Saltwell AB a Saltwell SpA (SWAB PO Ref) y Sales Order al cliente final (SWAB SO Ref + Customer Ref)': 'PO from Saltwell AB to Saltwell SpA (SWAB PO Ref) and Sales Order to the final customer (SWAB SO Ref + Customer Ref)',
    'Elegir archivos': 'Choose files',
    'Los PDF de SAP Business One se leen directamente. Para otros formatos o PDFs escaneados se usa Claude con tu cuenta (te pedirá permiso la primera vez).': 'SAP Business One PDFs are read directly. Other formats or scanned PDFs are read by Claude with your account (it asks for permission the first time).',
    'Los PDF de SAP Business One se leen directamente. La lectura con IA para otros formatos no está disponible en esta vista.': 'SAP Business One PDFs are read directly. AI reading for other formats is not available in this view.',
    'Leído con IA': 'Read with AI', 'Leído del PDF': 'Read from PDF', 'Leyendo PDF…': 'Reading PDF…', 'Leyendo con IA… (puede tardar hasta un minuto)': 'Reading with AI… (may take up to a minute)',
    'Leer con IA': 'Read with AI', 'Volver a leer con IA': 'Read again with AI', 'Guardado en': 'Saved to', 'Guardar en': 'Save to',
    'No encontré un embarque con estas referencias': 'No shipment found with these references', 'El cliente': 'Customer', 'no está en Maestros.': 'is not in Master data.',
    'Agregar a Maestros': 'Add to Master data', 'Campo': 'Field', 'Actual': 'Current', 'Desde el PDF': 'From the PDF',
    'El PDF original queda adjunto al embarque.': 'The original PDF is attached to the shipment.',
    'El PDF original queda adjunto al embarque (adjuntar no está disponible con tu nivel de acceso).': 'The original PDF is attached to the shipment (attaching is not available with your access level).',
    'No se dio permiso para usar Claude en esta página.': 'Permission to use Claude on this page was not granted.',
    'Demasiadas lecturas seguidas. Espera un momento y vuelve a intentar.': 'Too many reads in a row. Wait a moment and try again.',
    'No reconocí el formato de este PDF y la lectura con IA no está disponible aquí.': 'This PDF format was not recognised and AI reading is not available here.',
    'La IA no encontró el número de la orden en este PDF.': 'The AI did not find the order number in this PDF.', 'La IA no devolvió datos legibles. Intenta de nuevo.': 'The AI returned no readable data. Try again.',
    'El PDF parece escaneado (sin texto) y esta vista no puede enviar imágenes a Claude.': 'The PDF looks scanned (no text) and this view cannot send images to Claude.',
    'selección manual': 'manual selection',
    // Reportes
    'Filtra los embarques y exporta el detalle a Excel con las mismas columnas de la hoja Ventas.': 'Filter shipments and export the detail to Excel with the same columns as the Ventas sheet.',
    'Fecha de referencia': 'Reference date', 'Año del N°': 'Shipment No. year', 'Desde': 'From', 'Hasta': 'To', 'Puerto destino': 'Destination port', 'Contenedores': 'Containers',
    'Toneladas netas': 'Net tonnes', 'USD (precio Saltwell SpA)': 'USD (Saltwell SpA price)', 'Toneladas por cliente': 'Tonnes by customer', 'Por producto': 'By product',
    'Producto': 'Product', 'Toneladas': 'Tonnes', 'Detalle': 'Detail', 'Sin embarques con estos filtros.': 'No shipments match these filters.', 'Sin fechas para graficar.': 'No dates to chart.',
    'Barras claras: meses futuros (planificado).': 'Light bars: future months (planned).',
    'ene': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'abr': 'Apr', 'may': 'May', 'jun': 'Jun', 'jul': 'Jul', 'ago': 'Aug', 'sep': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dic': 'Dec',
    // Maestros
    'Clientes, productos y listas que alimentan los formularios y documentos (equivalente a la hoja DataBase).': 'Customers, products and lists used by the forms and documents (equivalent to the DataBase sheet).',
    'Guardar maestros': 'Save master data', 'Clientes': 'Customers', 'Productos': 'Products', 'Listas': 'Lists', 'Nombre (Final Customer)': 'Name (Final Customer)',
    'Ciudad / Estado': 'City / State', 'Código postal': 'Postal code', 'Item N°': 'Item No.', 'Precio USD/bolsa': 'Price USD/bag', 'Tipo de pallet': 'Pallet type', 'Peso kg': 'Weight kg',
    'Contacto (saludo del correo)': 'Contact (email greeting)', 'Correo booking': 'Booking email address', 'Puertos de carga': 'Ports of loading', 'Puertos de destino': 'Ports of discharge',
    'Tipos de contenedor': 'Container types', 'Modalidad de venta': 'Sales modes', 'Formas de pago': 'Payment terms', '(uno por línea)': '(one per line)', 'Agregar fila': 'Add row', 'Eliminar fila': 'Delete row',
    // Ajustes
    'Datos fijos que aparecen en Draft PL, Proforma, Packing List, ISF y correo de booking.': 'Fixed data shown on the Draft PL, Proforma, Packing List, ISF and booking email.',
    'Guardar ajustes': 'Save settings', 'Pie de documentos y firma': 'Document footer and signature', 'ISF (embarques a USA)': 'ISF (shipments to USA)', 'Nombre': 'Name', 'Correo': 'Email',
    'Dirección línea 1': 'Address line 1', 'Dirección línea 2': 'Address line 2', 'Firmante': 'Signatory', 'Cargo': 'Title', 'Export reference (declaración de origen)': 'Export reference (origin declaration)',
    'Moneda proforma': 'Proforma currency', 'Dirección manufacturer / stuffing': 'Manufacturer / stuffing address', 'Dirección seller / consignee': 'Seller / consignee address',
    'Países que requieren ISF (separados por coma)': 'Countries that require ISF (comma separated)', 'Texto (1 contenedor)': 'Text (1 container)', 'Texto (varios contenedores)': 'Text (several containers)',
    'Firma': 'Signature', 'Incluir firma escaneada en los documentos': 'Include scanned signature on documents',
    // Diálogos
    'Hay cambios sin guardar en este embarque. ¿Descartarlos?': 'This shipment has unsaved changes. Discard them?', 'Descartar cambios': 'Discard changes', 'Nuevo status': 'New status',
    // Avisos
    'Cambios guardados': 'Changes saved', 'Status actualizado': 'Status updated', 'Embarque eliminado': 'Shipment deleted', 'Maestros guardados': 'Master data saved',
    'Ajustes guardados': 'Settings saved', 'Cliente agregado a Maestros': 'Customer added to Master data', 'Copia creada: completa las referencias y guarda.': 'Copy created: fill in the references and save.',
    'Datos del Excel cargados': 'Excel data loaded', 'Indica al menos el cliente o un número de orden.': 'Enter at least the customer or an order number.',
    'No tienes permiso para guardar cambios.': 'You do not have permission to save changes.', 'Sólo se pueden importar archivos PDF.': 'Only PDF files can be imported.',
    'Otra persona actualizó este embarque. Guarda o descarta tus cambios para ver la versión nueva.': 'Someone else updated this shipment. Save or discard your changes to see the new version.',
    'Guarda primero este embarque.': 'Save this shipment first.', 'La descarga no está disponible en esta vista.': 'Download is not available in this view.', 'Selecciona y copia con Ctrl+C': 'Select and copy with Ctrl+C',
    'Bookings registrados': 'Saved bookings', 'Arrastra aquí la confirmación de booking (PDF)': 'Drop the booking confirmation (PDF) here',
    'Un booking puede asociarse a uno o varios contenedores (órdenes).': 'A booking can be linked to one or more containers (orders).',
    'Sube la confirmación de booking de la naviera: se leen nave, viaje, ETD/ETA, stacking, cierres y N° de booking, y se asocia a una o varias órdenes.': "Upload the carrier's booking confirmation: vessel, voyage, ETD/ETA, stacking, cut-offs and booking No. are read and linked to one or more orders.",
    'Nave': 'Vessel', 'Ruta': 'Route', 'Equipos': 'Equipment', 'Aún no hay bookings importados.': 'No bookings imported yet.', 'Volver a Bookings': 'Back to Bookings',
    'Eliminar booking': 'Delete booking', 'Vessel / viaje': 'Vessel / voyage', 'Cierre documental (SI)': 'Documentation cut-off (SI)', 'Cierre VGM': 'VGM cut-off',
    'Este booking ya existe: al guardar se actualizan sus datos y se agrega este PDF.': 'This booking already exists: saving updates its data and adds this PDF.',
    'Órdenes asociadas': 'Linked orders', 'Tipo': 'Type', 'Avisos': 'Warnings', 'Sugeridas (por reservar, mismo destino y ETD cercana)': 'Suggested (to book, same destination, close ETD)',
    'No hay órdenes pendientes de booking.': 'No orders pending booking.', 'Asociar otra orden': 'Link another order', 'Elegir…': 'Choose…',
    'Cambiar status a "Reservado" en las órdenes por reservar': 'Set status to "Reservado" on orders still to book', 'PDF del booking': 'Booking PDF',
    'Ver booking': 'View booking', 'Stacking': 'Stacking', 'ETD / ETA': 'ETD / ETA', 'Importar booking': 'Import booking', 'Falta el N° de booking.': 'The booking No. is missing.',
    'Booking guardado': 'Booking saved', 'Booking eliminado': 'Booking deleted', '¿Eliminar este booking? Las órdenes mantienen sus datos.': 'Delete this booking? The orders keep their data.',
    'falta N° booking': 'missing booking No.', 'El Draft Packing List y la Proforma Invoice requieren N° de booking.': 'The Draft Packing List and Proforma Invoice require a booking No.',
    'El inicio de stacking es posterior al cierre de stacking.': 'Stacking start is after stacking close.', 'Entrega en puerto fuera del stacking': 'Port delivery outside stacking window',
    'No reconocí el formato de este booking y la lectura con IA no está disponible aquí.': 'This booking format was not recognised and AI reading is not available here.',
    'La IA no encontró el N° de booking en este PDF.': 'The AI did not find the booking No. in this PDF.',
    'Correo agente de aduanas': 'Customs agent email', 'Adjuntos': 'Attachments', 'Descargar correo para Outlook (con adjuntos)': 'Download email for Outlook (with attachments)',
    'Descargar sólo adjuntos (.zip)': 'Download attachments only (.zip)', 'Abrir en mi correo (sin adjuntos)': 'Open in my email (no attachments)',
    'Descargar correo para Outlook baja un .zip con el correo (.eml) ya armado: Para, CC, asunto, texto y los PDF adjuntos. Descomprímelo y abre el .eml con doble clic: Outlook lo abre como mensaje nuevo listo para enviar. Una página web no puede enviar correos ni adjuntar archivos por sí sola.': 'Download email for Outlook gives you a .zip with the ready-made email (.eml): To, CC, subject, text and the PDF attachments. Unzip it and double-click the .eml: Outlook opens it as a new message ready to send. A web page cannot send emails or attach files by itself.',
    'Nombre (saludo)': 'Name (greeting)', 'Correo (Para)': 'Email (To)', 'CC según puerto de carga (una línea por puerto: Puerto: correo; correo)': 'CC by port of loading (one line per port: Port: email; email)',
    'Importar booking': 'Import booking', 'Correo a agente de aduanas preparado': 'Customs agent email prepared', 'No se pudo leer el PDF del booking; adjúntalo a mano.': 'Could not read the booking PDF; attach it manually.',
    'Correos internos Saltwell': 'Saltwell internal emails', 'En copia en los correos de booking y de agente de aduanas (separar con ;)': 'In copy on booking and customs agent emails (separate with ;)',
    'Filtros': 'Filters', 'Columnas': 'Columns', 'Agregar filtro': 'Add filter', 'Quitar filtros': 'Clear filters', 'Guardar como vista…': 'Save as view…',
    'Sin filtros. Agrega uno para buscar por cualquier campo: fechas, puertos, forwarder, producto, peso…': 'No filters. Add one to search by any field: dates, ports, forwarder, product, weight…',
    'Elige las columnas que quieres ver:': 'Choose the columns to show:', 'Columnas por defecto': 'Default columns', 'Mis vistas:': 'My views:', 'Guardar vista': 'Save view',
    'Guarda la búsqueda, filtros, orden y columnas actuales para usarlos con un clic. Las vistas son personales.': 'Saves the current search, filters, sort order and columns so you can use them with one click. Views are personal.',
    'Nombre de la vista': 'View name', 'Ej.: Healy por zarpar': 'E.g.: Healy awaiting departure', 'Vista guardada': 'View saved', 'Borrar vista': 'Delete view',
    'Quitar filtro': 'Remove filter', 'Condición': 'Condition', 'Valor': 'Value', 'Valor hasta': 'Value to', 'contiene': 'contains', 'no contiene': 'does not contain',
    'es igual a': 'equals', 'está vacío': 'is empty', 'no está vacío': 'is not empty', 'mayor que': 'greater than', 'menor que': 'less than', 'entre': 'between', 'es': 'is',
    'después de': 'after', 'antes de': 'before', 'en los próximos (días)': 'in the next (days)', 'en los últimos (días)': 'in the last (days)', 'no es': 'is not', 'y': 'and',
    'Entrega puerto': 'Port delivery', 'Logística nacional': 'Domestic logistics', 'Embarques': 'Shipments',
    'Sube el Draft de BL y luego el BL final (no negociable). Se leen N° de BL, nave, puertos, contenedores, sellos, PO y pesos, y se asocia cada contenedor a su embarque.': 'Upload the draft BL and then the final (non-negotiable) BL. BL No., vessel, ports, containers, seals, PO and weights are read and each container is linked to its shipment.',
    'Arrastra aquí el BL o HBL (PDF)': 'Drop the BL or HBL (PDF) here', 'Un BL puede incluir uno o varios contenedores. El draft se reconoce por la marca de agua DRAFT.': 'A BL can include one or more containers. Drafts are recognised by the DRAFT watermark.',
    'BL registrados': 'Saved BLs', 'Aún no hay BL importados.': 'No BLs imported yet.', 'Volver a BL': 'Back to BL', 'Eliminar BL': 'Delete BL', 'Tipo de documento': 'Document type',
    'BL final / no negociable': 'Final / non-negotiable BL', 'Marca de agua DRAFT detectada': 'DRAFT watermark detected', 'Referencia': 'Reference', 'Lugar de entrega': 'Place of delivery',
    'Fecha de emisión': 'Issue date', 'Flete': 'Freight', 'Flete pagadero en': 'Freight payable at', 'Sello': 'Seal', 'PO / SO': 'PO / SO', 'Peso bruto': 'Gross weight', 'Embarque': 'Shipment',
    'Revisión': 'Check', 'PDF del BL': 'BL PDF', '— Sin asociar —': '— Not linked —', 'Coincide con la orden': 'Matches the order', 'Sin embarque asociado': 'No linked shipment',
    'No encontré contenedores en este BL.': 'No containers found in this BL.', 'En cada embarque se guarda el N° de BL y su estado; contenedor, sello y nave sólo si estaban vacíos.': 'Each shipment gets the BL No. and its status; container, seal and vessel only if they were empty.',
    'BL guardado': 'BL saved', 'BL eliminado': 'BL deleted', '¿Eliminar este BL? Los embarques mantienen el N° de BL.': 'Delete this BL? Shipments keep the BL No.', 'Ver BL': 'View BL', 'Importar BL': 'Import BL',
    'Contenedores en el BL': 'Containers in the BL', 'Estado BL': 'BL status', 'N° BL / HBL': 'BL / HBL No.', 'N° MBL (naviera)': 'MBL No. (carrier)', 'Falta el N° de BL.': 'The BL No. is missing.',
    'No reconocí el formato de este BL y la lectura con IA no está disponible aquí.': 'This BL format was not recognised and AI reading is not available here.', 'La IA no encontró el N° de BL en este PDF.': 'The AI did not find the BL No. in this PDF.',
    'Aún no se ha importado el PDF de este BL.': 'The PDF of this BL has not been imported yet.',
    'Controles': 'Controls', 'Revisión automática de todos los embarques activos: fechas, booking, stacking, BL, pesos, duplicados y datos faltantes. Se recalcula con cada cambio.': 'Automatic check of all active shipments: dates, booking, stacking, BL, weights, duplicates and missing data. Recalculated on every change.',
    'Preguntar a Claude': 'Ask Claude', 'Prioridad alta': 'High priority', 'Prioridad media': 'Medium priority', 'Prioridad baja': 'Low priority', 'Buscar en controles…': 'Search controls…', 'Buscar en controles': 'Search controls',
    'Todas': 'All', 'Alta': 'High', 'Media': 'Medium', 'Baja': 'Low', 'Prioridad': 'Priority', 'Control': 'Check', 'Sin observaciones. Todo en orden.': 'No issues. All in order.',
    'Revisar con Claude': 'Review with Claude', 'Claude está revisando el embarque… (puede tardar hasta un minuto)': 'Claude is reviewing the shipment… (may take up to a minute)', 'Sin observaciones.': 'No issues.',
    'Las correcciones se aplican al formulario; revisa y presiona Guardar para confirmarlas. Claude puede equivocarse: verifica antes de guardar.': 'Fixes are applied to the form; review and press Save to confirm them. Claude can make mistakes: check before saving.',
    'Asistente Claude': 'Claude assistant', 'Pregunta sobre los embarques. Ejemplos:': 'Ask about the shipments. Examples:', 'Escribe tu pregunta…': 'Type your question…', 'Pregunta': 'Question', 'Enviar': 'Send',
    'Sugerir una mejora para la página': 'Suggest an improvement for the page', '¿Qué te gustaría que la página hiciera mejor?': 'What would you like the page to do better?', 'Enviar sugerencia': 'Send suggestion',
    'Usa tu cuenta de Claude. Sólo lee los datos; los cambios los haces tú.': 'Uses your Claude account. It only reads data; you make the changes.', 'Pensando…': 'Thinking…',
    'Gracias. La sugerencia quedó registrada.': 'Thanks. The suggestion was saved.', 'Aplicado al formulario. Revisa y guarda.': 'Applied to the form. Review and save.', 'Controles:': 'Checks:',
    'Pídele a Claude en el chat donde se creó esta página que revise estas sugerencias para implementarlas.': 'Ask Claude in the chat where this page was built to review these suggestions and implement them.',
    'No se dio permiso para usar Claude en esta página.': 'Permission to use Claude on this page was not granted.', 'Límite de uso alcanzado. Espera un momento y vuelve a intentar.': 'Usage limit reached. Wait a moment and try again.',
    'Claude no devolvió una respuesta legible. Intenta de nuevo.': 'Claude returned an unreadable answer. Try again.',
    'La ETA es anterior a la ETD': 'ETA is before ETD', 'Sin ítems de mercadería': 'No goods items', 'Cliente no está en Maestros (sin dirección para documentos)': 'Customer not in Master data (no address for documents)', 'Sin cliente final': 'No final customer',
    "Peso bruto sobre 28 t en contenedor de 20'": "Gross weight over 28 t in a 20' container", 'Booking sin PDF importado': 'Booking PDF not imported', 'Tiene booking pero no forwarder': 'Has a booking but no forwarder',
    'Ya zarpó y no tiene N° de contenedor': 'Departed without container No.', 'Ya zarpó y no tiene BL': 'Departed without BL', 'El BL sigue en draft una semana después del zarpe': 'BL still draft a week after departure',
    'Embarque a USA: el ISF necesita el N° de BL antes del zarpe': 'USA shipment: the ISF needs the BL No. before departure', 'La ETA ya pasó: revisa el status': 'ETA has passed: check the status', 'Despachado sin N° de invoice': 'Shipped without invoice No.',
    'Aún no se ha importado el PDF de este booking.': 'The PDF of this booking has not been imported yet.',
    '(importar)': '(import)', 'Importar SO/PO': 'Import SO/PO', 'Importar Booking': 'Import Booking',
    'Sin conexión a la base de datos': 'No database connection', 'Saludo': 'Greeting', 'Vista previa': 'Preview', 'Copiar correo con formato': 'Copy formatted email',
    'Copiar Para': 'Copy To', 'Copiar CC': 'Copy CC', 'Correo booking (Para)': 'Booking email (To)', 'En copia (CC) — separar con ;': 'In copy (CC) — separate with ;',
    'Abrir en mi correo crea el mensaje con Para, CC, asunto y el texto sin tablas. Para enviarlo con el formato de la hoja Booking, usa Copiar correo con formato y pégalo en el cuerpo del mensaje (Ctrl+V).': 'Open in my email creates the message with To, CC, subject and the text without tables. To send it in the Booking sheet format, use Copy formatted email and paste it into the message body (Ctrl+V).',
    'Si Outlook muestra los CC separados por coma y no los reconoce: en Outlook ve a Archivo › Opciones › Correo › Enviar mensajes y activa la opción de usar comas para separar varios destinatarios. También puedes usar Copiar CC y pegarlos en el campo CC.': 'If Outlook shows the CC addresses separated by commas and does not recognise them: in Outlook go to File › Options › Mail › Send messages and turn on the option to use commas to separate multiple recipients. You can also use Copy CC and paste them into the CC field.',
    'Correo copiado con formato. Pégalo en el cuerpo del mensaje.': 'Formatted email copied. Paste it into the message body.',
    'No se pudo copiar automáticamente: selecciona la vista previa y copia con Ctrl+C.': 'Could not copy automatically: select the preview and copy with Ctrl+C.', 'Contenedores por mes': 'Containers per month'
  };
  const WORDS = { contenedor: 'container', sello: 'seal', tara: 'tare', BL: 'BL' };
  const fieldEn = s => s.split(', ').map(x => D[x] || x).join(', ');
  const P = [
    [/^(.*) · (\d+) contenedores registrados$/, m => `${m[1]} · ${m[2]} containers on record`],
    [/^Contenedores (\d{4}) · (.*) t$/, m => `Containers ${m[1]} · ${m[2]} t`],
    [/^Sin booking y zarpa en (-?\d+) días$/, m => `No booking, departs in ${m[1]} days`],
    [/^(\d+) seleccionados?$/, m => `${m[1]} selected`],
    [/^(\d+) de (\d+) embarques$/, m => `${m[1]} of ${m[2]} shipments`],
    [/^(\d+) de (\d+) embarques · (.*) bolsas · (.*) t$/, m => `${m[1]} of ${m[2]} shipments · ${m[3]} bags · ${m[4]} t`],
    [/^Filtros \((\d+)\)$/, m => `Filters (${m[1]})`],
    [/^Booking (.*) · (\d+) contenedor(es)? · ?(.*)$/, m => `Booking ${m[1] === '— Sin booking —' ? '— No booking —' : m[1]} · ${m[2]} container${m[3] ? 's' : ''}${m[4] ? ' · ' + m[4] : ''}`],
    [/^Seleccionar N° (.*)$/, m => `Select No. ${m[1]}`],
    [/^No encontré el embarque (.*)\. Puede haber sido eliminado\.$/, m => `Shipment ${m[1]} not found. It may have been deleted.`],
    [/^Embarque N° (\d+)$/, m => `Shipment No. ${m[1]}`],
    [/^· falta (.*)$/, m => `· missing ${m[1].split(', ').map(w => WORDS[w] || w).join(', ')}`],
    [/^Mismo booking \((\d+) contenedores\)$/, m => `Same booking (${m[1]} containers)`],
    [/^Copiar datos de booking a los otros (\d+)$/, m => `Copy booking data to the other ${m[1]}`],
    [/^Correo de booking · (\d+) contenedor(es)?$/, m => `Booking email · ${m[1]} container${m[2] ? 's' : ''}`],
    [/^Para \((.*)\)$/, m => `To (${m[1] === 'sin forwarder' ? 'no forwarder' : m[1]})`],
    [/^PO Saltwell AB → SpA (.*)$/, m => `PO Saltwell AB → SpA ${m[1]}`],
    [/^Sales Order cliente (.*)$/, m => `Customer Sales Order ${m[1]}`],
    [/^➕ Nuevo embarque \(N° (\d+)\)$/, m => `➕ New shipment (No. ${m[1]})`],
    [/^Coincide por (.*)$/, m => `Matched by ${m[1] === 'selección manual' ? 'manual selection' : m[1]}`],
    [/^Actualizar N° (\d+)$/, m => `Update No. ${m[1]}`],
    [/^Aplicar (.*)$/, m => `Apply ${D[m[1]] || m[1]}`],
    [/^Exportar a Excel \((\d+)\)$/, m => `Export to Excel (${m[1]})`],
    [/^Contenedores por mes de (ETD|ETA|orden)$/, m => `Containers per month (${m[1] === 'orden' ? 'order date' : m[1]})`],
    [/^(\d{4}-\d{2}): (\d+) contenedores, (.*) t$/, m => `${m[1]}: ${m[2]} containers, ${m[3]} t`],
    [/^¿Eliminar el embarque N° (\d+)\? Esta acción no se puede deshacer\.$/, m => `Delete shipment No. ${m[1]}? This cannot be undone.`],
    [/^Cambiar status de (\d+) embarques?$/, m => `Change status of ${m[1]} shipment${m[1] === '1' ? '' : 's'}`],
    [/^Cargando los embarques del Excel… (\d+) de (\d+)\. No cierres la página\.$/, m => `Loading shipments from the Excel… ${m[1]} of ${m[2]}. Do not close the page.`],
    [/^La fecha de entrega en puerto \((.*)\) debe estar dentro del stacking \((.*) a (.*)\)\.$/, m => `The port delivery date (${m[1]}) must be within the stacking window (${m[2]} to ${m[3]}).`],
    [/^Cierre de stacking en (\d+) días sin fecha de entrega$/, m => `Stacking closes in ${m[1]} days with no delivery date`],
    [/^Tipo distinto: orden (.*) · booking (.*)$/, m => `Different type: order ${m[1]} · booking ${m[2]}`],
    [/^Tiene otro booking: (.*)$/, m => `Has another booking: ${m[1]}`],
    [/^Cambiar la orden a (.*)$/, m => `Change the order to ${m[1]}`],
    [/^Asociar N° (\d+)$/, m => `Link No. ${m[1]}`],
    [/^El booking indica (\d+) contenedor(es)? y hay (\d+) orden(es)? seleccionada(s)?\.$/, m => `The booking is for ${m[1]} container${m[2] ? 's' : ''} and ${m[3]} order${m[4] ? 's are' : ' is'} selected.`],
    [/^(Guardar booking y actualizar|Guardar y actualizar) (\d+) orden(es)?$/, m => `${m[1].startsWith('Guardar booking') ? 'Save booking and update' : 'Save and update'} ${m[2]} order${m[3] ? 's' : ''}`],
    [/^Se copian a cada orden: booking, carrier, forwarder, nave, puertos, ETD\/ETA y stacking(; el BL de la naviera queda como MBL)?\.$/, m => `Copied to each order: booking, carrier, forwarder, vessel, ports, ETD/ETA and stacking${m[1] ? "; the carrier's BL is saved as MBL" : ''}.`],
    [/^guardado y asociado a (\d+) embarques?\.$/, m => `saved and linked to ${m[1]} shipment${m[1] === '1' ? '' : 's'}.`],
    [/^Booking (\S+) asociado \((.*)\)$/, m => `Booking ${m[1]} linked (${m[2]})`],
    [/^Desasociado del booking (.*)$/, m => `Unlinked from booking ${m[1]}`],
    [/^Equipos en el booking:$/, () => 'Equipment in the booking:'],
    [/^No encontré el booking (.*)\.$/, m => `Booking ${m[1]} not found.`],
    [/^Incluir las otras (\d+) órdenes del mismo booking \(N° (.*)\)$/, m => `Include the other ${m[1]} orders on the same booking (No. ${m[2]})`],
    [/^Booking (\S+) · sin PDF importado$/, m => `Booking ${m[1]} · no PDF imported`],
    [/^No se pudo preparar el correo: (.*)$/, m => `Could not prepare the email: ${m[1]}`],
    [/^Este BL ya existe como (Final|Draft)\. Al guardar se agrega este PDF y se actualizan los datos\.( Sin cambios en los datos\.)?$/, m => `This BL already exists as ${m[1]}. Saving adds this PDF and updates the data.${m[2] ? ' No data changes.' : ''}`],
    [/^Cambios respecto a la versión anterior:$/, () => 'Changes from the previous version:'],
    [/^\((Final|Draft)\) guardado y asociado a (\d+) embarques?\.$/, m => `(${m[1]}) saved and linked to ${m[2]} shipment${m[2] === '1' ? '' : 's'}.`],
    [/^Guardar BL y actualizar (\d+) embarques?$/, m => `Save BL and update ${m[1]} shipment${m[1] === '1' ? '' : 's'}`],
    [/^Contenedores \((\d+)\)$/, m => `Containers (${m[1]})`],
    [/^Sello distinto: orden (.*) · BL (.*)$/, m => `Different seal: order ${m[1]} · BL ${m[2]}`],
    [/^PO distinta: orden (.*) · BL (.*)$/, m => `Different PO: order ${m[1]} · BL ${m[2]}`],
    [/^Bolsas: orden (.*) · BL (.*)$/, m => `Bags: order ${m[1]} · BL ${m[2]}`],
    [/^Peso bruto: orden (.*) · BL (.*)$/, m => `Gross weight: order ${m[1]} · BL ${m[2]}`],
    [/^Tipo: orden (.*) · BL (.*)$/, m => `Type: order ${m[1]} · BL ${m[2]}`],
    [/^POD: orden (.*) · BL (.*)$/, m => `POD: order ${m[1]} · BL ${m[2]}`],
    [/^Contenedor en la orden: (.*)$/, m => `Container on the order: ${m[1]}`],
    [/^La orden tiene otro BL: (.*)$/, m => `The order has another BL: ${m[1]}`],
    [/^BL (\S+) \((final|draft)\) asociado$/, m => `BL ${m[1]} (${m[2]}) linked`],
    [/^Desasociado del BL (.*)$/, m => `Unlinked from BL ${m[1]}`],
    [/^No encontré el BL (.*)\.$/, m => `BL ${m[1]} not found.`],
    [/^Abrir N° (\d+)$/, m => `Open No. ${m[1]}`],
    [/^Abrir N° (\d+) · (.*)$/, m => `Open No. ${m[1]} · ${m[2]}`],
    [/^Ver los (\d+) controles$/, m => `See all ${m[1]} checks`],
    [/^Revisión con Claude · N° (\d+)$/, m => `Review with Claude · No. ${m[1]}`],
    [/^Ítem (.*) sin kg por bolsa$/, m => `Item ${m[1]} has no kg per bag`],
    [/^Ítem (.*) sin precio$/, m => `Item ${m[1]} has no price`],
    [/^Tipo de contenedor distinto al booking \((.*) vs (.*)\)$/, m => `Container type differs from booking (${m[1]} vs ${m[2]})`],
    [/^BL: (.*)$/, m => `BL: ${(tr(m[1]) || m[1]).trim()}`],
    [/^(SO|PO|contenedor) (.*) repetido en N° (.*)$/, m => `${m[1] === 'contenedor' ? 'Container' : m[1]} ${m[2]} repeated in No. ${m[3]}`],
    [/^Sugerencias de mejora recibidas \((\d+)\)$/, m => `Improvement suggestions received (${m[1]})`],
    [/^Embarque N° (\d+) creado$/, m => `Shipment No. ${m[1]} created`],
    [/^Actualizados (\d+) contenedores$/, m => `${m[1]} containers updated`],
    [/^Editó (.*?)( y (\d+) más)?$/, m => `Edited ${fieldEn(m[1])}${m[3] ? ` and ${m[3]} more` : ''}`],
    [/^Creado desde PDF (.*)$/, m => `Created from PDF ${m[1]}`],
    [/^Actualizado desde PDF ([^:]*): (.*)$/, m => `Updated from PDF ${m[1]}: ${fieldEn(m[2].replace('…', ''))}`],
    [/^Datos de booking copiados desde N° (\d+)$/, m => `Booking data copied from No. ${m[1]}`],
    [/^Status: (.*)$/, m => `Status: ${m[1]}`],
    [/^No se pudo (guardar|eliminar|actualizar|exportar|descargar|copiar|agregar|generar el documento): (.*)$/, m => `Could not ${{ guardar: 'save', eliminar: 'delete', actualizar: 'update', exportar: 'export', descargar: 'download', copiar: 'copy', agregar: 'add', 'generar el documento': 'generate the document' }[m[1]]}: ${m[2]}`],
    [/^Error al leer embarques: (.*)$/, m => `Error reading shipments: ${m[1]}`],
    [/^El PDF no se pudo adjuntar \((.*)\), pero los datos se guardarán\.$/, m => `The PDF could not be attached (${m[1]}), but the data will be saved.`],
    [/^La carga inicial se interrumpió \((.*)\)\. Se reintentará al volver a abrir la página\.$/, m => `The initial load was interrupted (${m[1]}). It will retry next time the page opens.`]
  ];

  const SV = {"Home": "Start", "Shipments": "Sändningar", "Import PDF": "Importera PDF", "Reports": "Rapporter", "Master data": "Grunddata", "Settings": "Inställningar", "Loading shipments…": "Laddar sändningar…", "Close": "Stäng", "Cancel": "Avbryt", "Apply": "Tillämpa", "Save": "Spara", "Remove": "Ta bort", "Delete": "Radera", "Discard": "Förkasta", "Duplicate": "Duplicera", "All": "Alla", "No data.": "Inga data.", "Copied": "Kopierat", "Saltwell Shipments": "Saltwell Sändningar", "Shipments, orders and export documents": "Sändningar, order och exportdokument", "This page stores shipments in a shared database that only works when opened inside Claude with your account. Open it from the artifact link on claude.ai.": "Den här sidan sparar sändningarna i en delad databas som bara fungerar när den öppnas i Claude med ditt konto. Öppna den från artefaktlänken på claude.ai.", "You have read-only access. To create or edit shipments, ask the page owner to share it with you as an editor.": "Du har läsbehörighet. Be sidans ägare att dela den med dig som redigerare för att skapa eller ändra sändningar.", "Import order PDF": "Importera order-PDF", "New shipment": "Ny sändning", "To book": "Att boka", "Booking requested": "Bokning begärd", "Booked, awaiting departure": "Bokad, väntar på avgång", "In transit": "Under transport", "Upcoming departures (30 days)": "Kommande avgångar (30 dagar)", "Customer": "Kund", "Status": "Status", "No departures in the next 30 days.": "Inga avgångar de närmaste 30 dagarna.", "Needs attention": "Kräver åtgärd", "Booked without container No.": "Bokad utan containernr", "In transit without BL No.": "Under transport utan BL-nr", "All up to date.": "Allt är uppdaterat.", "Upcoming arrivals": "Kommande ankomster", "Container": "Container", "No containers in transit.": "Inga containrar under transport.", "Recent activity": "Senaste aktivitet", "No changes recorded in the app yet.": "Inga ändringar registrerade i appen ännu.", "Updated": "Uppdaterad", "Booked": "Bokad", "Delivered": "Levererad", "At port, awaiting departure": "I hamn, väntar på avgång", "Someone": "Någon", "One record per container (PO/SO). Search by No., order, customer, booking, container or BL.": "En post per container (PO/SO). Sök på nr, order, kund, bokning, container eller BL.", "Search: 232604, Healy, MRKU…": "Sök: 232604, Healy, MRKU…", "Search shipments": "Sök sändningar", "All years": "Alla år", "All customers": "Alla kunder", "Year": "År", "Group by booking": "Gruppera per bokning", "Active": "Aktiva", "Request booking": "Begär bokning", "Change status…": "Ändra status…", "Clear selection": "Rensa urval", "Bags": "Säckar", "No shipments match these filters.": "Inga sändningar matchar filtren.", "— No booking —": "— Ingen bokning —", "Back to list": "Tillbaka till listan", "No customer": "Ingen kund", "Unsaved changes": "Osparade ändringar", "Create shipment": "Skapa sändning", "Documents": "Dokument", "Save before generating to include your latest changes": "Spara innan du genererar för att ta med de senaste ändringarna", "Preview and download as PDF": "Förhandsgranska och ladda ner som PDF", "Final Packing List": "Slutlig packlista", "Save first": "Spara först", "Booking email": "Bokningsmejl", "Order & sale": "Order och försäljning", "Final customer": "Slutkund", "Booking & transport": "Bokning och transport", "Goods": "Gods", "Order date": "Orderdatum", "Sales mode": "Försäljningsform", "Payment terms": "Betalningsvillkor", "Destination Incoterm": "Incoterm på destination", "Invoice No.": "Fakturanr", "Domestic logistics": "Inrikeslogistik", "Stacking opens": "Stacking öppnar", "Stacking closes": "Stacking stänger", "Port delivery date": "Leveransdatum till hamn", "BL No.": "BL-nr", "Container type": "Containertyp", "Tare (kg)": "Tara (kg)", "Address": "Adress", "City": "Ort", "Country": "Land", "This customer is not in Master data: add it so its address appears on the documents.": "Kunden finns inte i grunddata: lägg till den så att adressen visas på dokumenten.", "Select the final customer.": "Välj slutkund.", "no container": "ingen container", "Copies forwarder, carrier, vessel, ports, ETD/ETA, stacking and delivery date.": "Kopierar speditör, rederi, fartyg, hamnar, ETD/ETA, stacking och leveransdatum.", "Add item": "Lägg till artikel", "Description": "Beskrivning", "Bags/pallet": "Säckar/pall", "Kg/bag": "Kg/säck", "Net kg": "Netto kg", "Price USD": "Pris USD", "Batch": "Batch", "Batch(es)": "Batch(er)", "Item code": "Artikelkod", "Bags per pallet": "Säckar per pall", "Kg per bag": "Kg per säck", "Price per bag": "Pris per säck", "Remove item": "Ta bort artikel", "No items. Add one or import the order PDF.": "Inga artiklar. Lägg till en eller importera orderns PDF.", "Net weight kg": "Nettovikt kg", "Pallets weight kg": "Pallvikt kg", "Gross weight kg": "Bruttovikt kg", "Attached PDFs": "Bifogade PDF:er", "Imported PDFs (PO / SO) are kept here.": "Importerade PDF:er (PO / SO) sparas här.", "History": "Historik", "No changes recorded in the app.": "Inga ändringar registrerade i appen.", "Customer SO": "Kund-SO", "Items": "Artiklar", "Shipment created": "Sändning skapad", "Saved": "Sparad", "Booking requested from forwarder": "Bokning begärd hos speditören", "Imported from Ventas_Contenedores.xlsx": "Importerad från Ventas_Contenedores.xlsx", "Data missing for the final Packing List (container, seal or BL). You can still download it.": "Uppgifter saknas för den slutliga packlistan (container, plomb eller BL). Du kan ändå ladda ner den.", "Generating preview…": "Skapar förhandsgranskning…", "Download PDF": "Ladda ner PDF", "The preview could not be shown, but you can download the PDF.": "Förhandsgranskningen kunde inte visas, men du kan ladda ner PDF:en.", "Add the forwarder email in Master data": "Lägg till speditörens e-post i grunddata", "Subject": "Ämne", "Body": "Text", "Copy subject": "Kopiera ämne", "Copy body": "Kopiera text", "Open in my email": "Öppna i min e-post", "Mark as \"Booking requested\"": "Markera som \"Bokning begärd\"", "If the email button does not open your mail app, use Copy subject and Copy body and paste them into Outlook.": "Om e-postknappen inte öppnar ditt e-postprogram, använd Kopiera ämne och Kopiera text och klistra in dem i Outlook.", "Drop the Purchase Orders and Sales Orders you receive. The data is read, matched against the database, and you see what will be created or updated before saving.": "Släpp de inköps- och försäljningsordrar du tar emot här. Uppgifterna läses, matchas mot databasen och du ser vad som skapas eller uppdateras innan du sparar.", "Drop one or more PDFs here": "Släpp en eller flera PDF:er här", "PO from Saltwell AB to Saltwell SpA (SWAB PO Ref) and Sales Order to the final customer (SWAB SO Ref + Customer Ref)": "PO från Saltwell AB till Saltwell SpA (SWAB PO Ref) och försäljningsorder till slutkunden (SWAB SO Ref + Customer Ref)", "Choose files": "Välj filer", "SAP Business One PDFs are read directly. Other formats or scanned PDFs are read by Claude with your account (it asks for permission the first time).": "PDF:er från SAP Business One läses direkt. Andra format eller skannade PDF:er läses av Claude med ditt konto (frågar om tillåtelse första gången).", "SAP Business One PDFs are read directly. AI reading for other formats is not available in this view.": "PDF:er från SAP Business One läses direkt. AI-läsning av andra format är inte tillgänglig i den här vyn.", "Read with AI": "Läst med AI", "Read from PDF": "Läst från PDF", "Reading PDF…": "Läser PDF…", "Reading with AI… (may take up to a minute)": "Läser med AI… (kan ta upp till en minut)", "Read again with AI": "Läs igen med AI", "Saved to": "Sparad i", "Save to": "Spara i", "No shipment found with these references": "Ingen sändning hittades med dessa referenser", "is not in Master data.": "finns inte i grunddata.", "Add to Master data": "Lägg till i grunddata", "Field": "Fält", "Current": "Nuvarande", "From the PDF": "Från PDF:en", "The original PDF is attached to the shipment.": "Original-PDF:en bifogas sändningen.", "The original PDF is attached to the shipment (attaching is not available with your access level).": "Original-PDF:en bifogas sändningen (bifoga är inte tillgängligt med din behörighet).", "Permission to use Claude on this page was not granted.": "Tillåtelse att använda Claude på den här sidan gavs inte.", "Too many reads in a row. Wait a moment and try again.": "För många läsningar i rad. Vänta en stund och försök igen.", "This PDF format was not recognised and AI reading is not available here.": "Formatet på den här PDF:en kändes inte igen och AI-läsning är inte tillgänglig här.", "The AI did not find the order number in this PDF.": "AI:n hittade inte ordernumret i den här PDF:en.", "The AI returned no readable data. Try again.": "AI:n returnerade inga läsbara data. Försök igen.", "The PDF looks scanned (no text) and this view cannot send images to Claude.": "PDF:en verkar skannad (ingen text) och den här vyn kan inte skicka bilder till Claude.", "manual selection": "manuellt val", "Filter shipments and export the detail to Excel with the same columns as the Ventas sheet.": "Filtrera sändningar och exportera detaljerna till Excel med samma kolumner som Ventas-bladet.", "Reference date": "Referensdatum", "Shipment No. year": "År för sändningsnr", "From": "Från", "To": "Till", "Destination port": "Destinationshamn", "Containers": "Containrar", "Net tonnes": "Nettoton", "USD (Saltwell SpA price)": "USD (Saltwell SpA-pris)", "Tonnes by customer": "Ton per kund", "By product": "Per produkt", "Product": "Produkt", "Tonnes": "Ton", "Detail": "Detaljer", "No dates to chart.": "Inga datum att visa.", "Light bars: future months (planned).": "Ljusa staplar: kommande månader (planerat).", "Jan": "jan", "Feb": "feb", "Mar": "mar", "Apr": "apr", "May": "maj", "Jun": "jun", "Jul": "jul", "Aug": "aug", "Sep": "sep", "Oct": "okt", "Nov": "nov", "Dec": "dec", "Customers, products and lists used by the forms and documents (equivalent to the DataBase sheet).": "Kunder, produkter och listor som används i formulär och dokument (motsvarar DataBase-bladet).", "Save master data": "Spara grunddata", "Customers": "Kunder", "Products": "Produkter", "Lists": "Listor", "Name (Final Customer)": "Namn (slutkund)", "City / State": "Ort / delstat", "Postal code": "Postnummer", "Item No.": "Artikelnr", "Price USD/bag": "Pris USD/säck", "Pallet type": "Palltyp", "Weight kg": "Vikt kg", "Contact (email greeting)": "Kontakt (hälsning i mejlet)", "Booking email address": "E-post för bokning", "Ports of loading": "Lastningshamnar", "Ports of discharge": "Lossningshamnar", "Container types": "Containertyper", "Sales modes": "Försäljningsformer", "(one per line)": "(en per rad)", "Add row": "Lägg till rad", "Delete row": "Radera rad", "Fixed data shown on the Draft PL, Proforma, Packing List, ISF and booking email.": "Fasta uppgifter som visas på Draft PL, proformafaktura, packlista, ISF och bokningsmejl.", "Save settings": "Spara inställningar", "Document footer and signature": "Dokumentfot och signatur", "ISF (shipments to USA)": "ISF (sändningar till USA)", "Name": "Namn", "Email": "E-post", "Address line 1": "Adressrad 1", "Address line 2": "Adressrad 2", "Signatory": "Undertecknare", "Title": "Titel", "Export reference (origin declaration)": "Exportreferens (ursprungsdeklaration)", "Proforma currency": "Valuta för proforma", "Manufacturer / stuffing address": "Adress för tillverkare / stuffning", "Seller / consignee address": "Adress för säljare / mottagare", "Countries that require ISF (comma separated)": "Länder som kräver ISF (kommaseparerade)", "Text (1 container)": "Text (1 container)", "Text (several containers)": "Text (flera containrar)", "Signature": "Signatur", "Include scanned signature on documents": "Ta med skannad signatur på dokumenten", "This shipment has unsaved changes. Discard them?": "Den här sändningen har osparade ändringar. Förkasta dem?", "Discard changes": "Förkasta ändringar", "New status": "Ny status", "Changes saved": "Ändringar sparade", "Status updated": "Status uppdaterad", "Shipment deleted": "Sändning raderad", "Master data saved": "Grunddata sparade", "Settings saved": "Inställningar sparade", "Customer added to Master data": "Kund tillagd i grunddata", "Copy created: fill in the references and save.": "Kopia skapad: fyll i referenserna och spara.", "Excel data loaded": "Excel-data inlästa", "Enter at least the customer or an order number.": "Ange åtminstone kunden eller ett ordernummer.", "You do not have permission to save changes.": "Du har inte behörighet att spara ändringar.", "Only PDF files can be imported.": "Endast PDF-filer kan importeras.", "Someone else updated this shipment. Save or discard your changes to see the new version.": "Någon annan uppdaterade den här sändningen. Spara eller förkasta dina ändringar för att se den nya versionen.", "Save this shipment first.": "Spara den här sändningen först.", "Download is not available in this view.": "Nedladdning är inte tillgänglig i den här vyn.", "Select and copy with Ctrl+C": "Markera och kopiera med Ctrl+C", "Saved bookings": "Sparade bokningar", "Drop the booking confirmation (PDF) here": "Släpp bokningsbekräftelsen (PDF) här", "A booking can be linked to one or more containers (orders).": "En bokning kan kopplas till en eller flera containrar (ordrar).", "Upload the carrier's booking confirmation: vessel, voyage, ETD/ETA, stacking, cut-offs and booking No. are read and linked to one or more orders.": "Ladda upp rederiets bokningsbekräftelse: fartyg, resa, ETD/ETA, stacking, stopptider och bokningsnr läses och kopplas till en eller flera ordrar.", "Vessel": "Fartyg", "Route": "Rutt", "Equipment": "Utrustning", "No bookings imported yet.": "Inga bokningar importerade ännu.", "Back to Bookings": "Tillbaka till bokningar", "Delete booking": "Radera bokning", "Vessel / voyage": "Fartyg / resa", "Documentation cut-off (SI)": "Dokumentstopp (SI)", "VGM cut-off": "VGM-stopp", "This booking already exists: saving updates its data and adds this PDF.": "Den här bokningen finns redan: när du sparar uppdateras uppgifterna och PDF:en läggs till.", "Linked orders": "Kopplade ordrar", "Type": "Typ", "Warnings": "Varningar", "Suggested (to book, same destination, close ETD)": "Förslag (att boka, samma destination, närliggande ETD)", "No orders pending booking.": "Inga ordrar väntar på bokning.", "Link another order": "Koppla en annan order", "Choose…": "Välj…", "Set status to \"Reservado\" on orders still to book": "Sätt status till \"Reservado\" på ordrar som ska bokas", "Booking PDF": "Boknings-PDF", "View booking": "Visa bokning", "Stacking": "Stacking", "ETD / ETA": "ETD / ETA", "Import booking": "Importera bokning", "The booking No. is missing.": "Bokningsnumret saknas.", "Booking saved": "Bokning sparad", "Booking deleted": "Bokning raderad", "Delete this booking? The orders keep their data.": "Radera den här bokningen? Ordrarna behåller sina uppgifter.", "missing booking No.": "bokningsnr saknas", "The Draft Packing List and Proforma Invoice require a booking No.": "Draft-packlistan och proformafakturan kräver ett bokningsnr.", "Stacking start is after stacking close.": "Stackingstart är efter stackingstopp.", "Port delivery outside stacking window": "Leverans till hamn utanför stackingfönstret", "This booking format was not recognised and AI reading is not available here.": "Formatet på den här bokningen kändes inte igen och AI-läsning är inte tillgänglig här.", "The AI did not find the booking No. in this PDF.": "AI:n hittade inte bokningsnumret i den här PDF:en.", "Customs agent email": "Mejl till tullombud", "Attachments": "Bilagor", "Download email for Outlook (with attachments)": "Ladda ner mejl för Outlook (med bilagor)", "Download attachments only (.zip)": "Ladda ner endast bilagor (.zip)", "Open in my email (no attachments)": "Öppna i min e-post (utan bilagor)", "Download email for Outlook gives you a .zip with the ready-made email (.eml): To, CC, subject, text and the PDF attachments. Unzip it and double-click the .eml: Outlook opens it as a new message ready to send. A web page cannot send emails or attach files by itself.": "Ladda ner mejl för Outlook ger dig en .zip med det färdiga mejlet (.eml): Till, CC, ämne, text och PDF-bilagorna. Packa upp den och dubbelklicka på .eml-filen: Outlook öppnar det som ett nytt meddelande klart att skicka. En webbsida kan inte själv skicka mejl eller bifoga filer.", "Name (greeting)": "Namn (hälsning)", "Email (To)": "E-post (Till)", "CC by port of loading (one line per port: Port: email; email)": "CC per lastningshamn (en rad per hamn: Hamn: e-post; e-post)", "Customs agent email prepared": "Mejl till tullombud förberett", "Could not read the booking PDF; attach it manually.": "Kunde inte läsa boknings-PDF:en; bifoga den manuellt.", "Saltwell internal emails": "Interna e-postadresser Saltwell", "In copy on booking and customs agent emails (separate with ;)": "Kopia i bokningsmejl och mejl till tullombud (separera med ;)", "Filters": "Filter", "Columns": "Kolumner", "Add filter": "Lägg till filter", "Clear filters": "Rensa filter", "Save as view…": "Spara som vy…", "No filters. Add one to search by any field: dates, ports, forwarder, product, weight…": "Inga filter. Lägg till ett för att söka på valfritt fält: datum, hamnar, speditör, produkt, vikt…", "Choose the columns to show:": "Välj kolumner att visa:", "Default columns": "Standardkolumner", "My views:": "Mina vyer:", "Save view": "Spara vy", "Saves the current search, filters, sort order and columns so you can use them with one click. Views are personal.": "Sparar nuvarande sökning, filter, sortering och kolumner så att du kan använda dem med ett klick. Vyerna är personliga.", "View name": "Vyns namn", "E.g.: Healy awaiting departure": "T.ex.: Healy väntar på avgång", "View saved": "Vy sparad", "Delete view": "Radera vy", "Remove filter": "Ta bort filter", "Condition": "Villkor", "Value": "Värde", "Value to": "Värde till", "contains": "innehåller", "does not contain": "innehåller inte", "equals": "är lika med", "is empty": "är tomt", "is not empty": "är inte tomt", "greater than": "större än", "less than": "mindre än", "between": "mellan", "is": "är", "after": "efter", "before": "före", "in the next (days)": "inom de närmaste (dagar)", "in the last (days)": "inom de senaste (dagar)", "is not": "är inte", "and": "och", "Port delivery": "Leverans till hamn", "Upload the draft BL and then the final (non-negotiable) BL. BL No., vessel, ports, containers, seals, PO and weights are read and each container is linked to its shipment.": "Ladda upp draft-BL och sedan slutlig (ej förhandlingsbar) BL. BL-nr, fartyg, hamnar, containrar, plomber, PO och vikter läses och varje container kopplas till sin sändning.", "Drop the BL or HBL (PDF) here": "Släpp BL eller HBL (PDF) här", "A BL can include one or more containers. Drafts are recognised by the DRAFT watermark.": "En BL kan omfatta en eller flera containrar. Utkast känns igen på vattenstämpeln DRAFT.", "Saved BLs": "Sparade BL", "No BLs imported yet.": "Inga BL importerade ännu.", "Back to BL": "Tillbaka till BL", "Delete BL": "Radera BL", "Document type": "Dokumenttyp", "Final / non-negotiable BL": "Slutlig / ej förhandlingsbar BL", "DRAFT watermark detected": "Vattenstämpel DRAFT upptäckt", "Reference": "Referens", "Place of delivery": "Leveransort", "Issue date": "Utfärdandedatum", "Freight": "Frakt", "Freight payable at": "Frakt betalas i", "Seal": "Plomb", "PO / SO": "PO / SO", "Gross weight": "Bruttovikt", "Shipment": "Sändning", "Check": "Kontroll", "BL PDF": "BL-PDF", "— Not linked —": "— Ej kopplad —", "Matches the order": "Stämmer med ordern", "No linked shipment": "Ingen kopplad sändning", "No containers found in this BL.": "Inga containrar hittades i den här BL:en.", "Each shipment gets the BL No. and its status; container, seal and vessel only if they were empty.": "Varje sändning får BL-nr och dess status; container, plomb och fartyg bara om de var tomma.", "BL saved": "BL sparad", "BL deleted": "BL raderad", "Delete this BL? Shipments keep the BL No.": "Radera den här BL:en? Sändningarna behåller BL-numret.", "View BL": "Visa BL", "Import BL": "Importera BL", "Containers in the BL": "Containrar i BL:en", "BL status": "BL-status", "BL / HBL No.": "BL / HBL-nr", "MBL No. (carrier)": "MBL-nr (rederi)", "The BL No. is missing.": "BL-numret saknas.", "This BL format was not recognised and AI reading is not available here.": "Formatet på den här BL:en kändes inte igen och AI-läsning är inte tillgänglig här.", "The AI did not find the BL No. in this PDF.": "AI:n hittade inte BL-numret i den här PDF:en.", "The PDF of this BL has not been imported yet.": "PDF:en för den här BL:en har inte importerats ännu.", "Controls": "Kontroller", "Automatic check of all active shipments: dates, booking, stacking, BL, weights, duplicates and missing data. Recalculated on every change.": "Automatisk kontroll av alla aktiva sändningar: datum, bokning, stacking, BL, vikter, dubbletter och saknade uppgifter. Räknas om vid varje ändring.", "Ask Claude": "Fråga Claude", "High priority": "Hög prioritet", "Medium priority": "Medelprioritet", "Low priority": "Låg prioritet", "Search controls…": "Sök i kontroller…", "Search controls": "Sök i kontroller", "High": "Hög", "Medium": "Medel", "Low": "Låg", "Priority": "Prioritet", "No issues. All in order.": "Inga anmärkningar. Allt i ordning.", "Review with Claude": "Granska med Claude", "Claude is reviewing the shipment… (may take up to a minute)": "Claude granskar sändningen… (kan ta upp till en minut)", "No issues.": "Inga anmärkningar.", "Fixes are applied to the form; review and press Save to confirm them. Claude can make mistakes: check before saving.": "Korrigeringarna läggs in i formuläret; granska och tryck på Spara för att bekräfta. Claude kan göra fel: kontrollera innan du sparar.", "Claude assistant": "Claude-assistent", "Ask about the shipments. Examples:": "Fråga om sändningarna. Exempel:", "Type your question…": "Skriv din fråga…", "Question": "Fråga", "Send": "Skicka", "Suggest an improvement for the page": "Föreslå en förbättring av sidan", "What would you like the page to do better?": "Vad vill du att sidan ska göra bättre?", "Send suggestion": "Skicka förslag", "Uses your Claude account. It only reads data; you make the changes.": "Använder ditt Claude-konto. Den läser bara data; ändringarna gör du.", "Thinking…": "Tänker…", "Thanks. The suggestion was saved.": "Tack. Förslaget har sparats.", "Applied to the form. Review and save.": "Inlagt i formuläret. Granska och spara.", "Checks:": "Kontroller:", "Ask Claude in the chat where this page was built to review these suggestions and implement them.": "Be Claude i chatten där sidan byggdes att gå igenom förslagen och genomföra dem.", "Usage limit reached. Wait a moment and try again.": "Användningsgränsen är nådd. Vänta en stund och försök igen.", "Claude returned an unreadable answer. Try again.": "Claude returnerade ett oläsbart svar. Försök igen.", "ETA is before ETD": "ETA är före ETD", "No goods items": "Inga godsartiklar", "Customer not in Master data (no address for documents)": "Kunden finns inte i grunddata (ingen adress för dokument)", "No final customer": "Ingen slutkund", "Gross weight over 28 t in a 20' container": "Bruttovikt över 28 t i en 20'-container", "Booking PDF not imported": "Boknings-PDF inte importerad", "Has a booking but no forwarder": "Har bokning men ingen speditör", "Departed without container No.": "Har avgått utan containernr", "Departed without BL": "Har avgått utan BL", "BL still draft a week after departure": "BL är fortfarande utkast en vecka efter avgång", "USA shipment: the ISF needs the BL No. before departure": "Sändning till USA: ISF kräver BL-nr före avgång", "ETA has passed: check the status": "ETA har passerat: kontrollera status", "Shipped without invoice No.": "Avsänd utan fakturanr", "No database connection": "Ingen databasanslutning", "(import)": "(importera)", "Import SO/PO": "Importera SO/PO", "Import Booking": "Importera bokning", "The PDF of this booking has not been imported yet.": "PDF:en för den här bokningen har inte importerats ännu.", "Greeting": "Hälsning", "Preview": "Förhandsgranskning", "Copy formatted email": "Kopiera formaterat mejl", "Copy To": "Kopiera Till", "Copy CC": "Kopiera CC", "Booking email (To)": "Bokningsmejl (Till)", "In copy (CC) — separate with ;": "Kopia (CC) — separera med ;", "Open in my email creates the message with To, CC, subject and the text without tables. To send it in the Booking sheet format, use Copy formatted email and paste it into the message body (Ctrl+V).": "Öppna i min e-post skapar meddelandet med Till, CC, ämne och texten utan tabeller. För att skicka det i Booking-bladets format, använd Kopiera formaterat mejl och klistra in det i meddelandet (Ctrl+V).", "If Outlook shows the CC addresses separated by commas and does not recognise them: in Outlook go to File › Options › Mail › Send messages and turn on the option to use commas to separate multiple recipients. You can also use Copy CC and paste them into the CC field.": "Om Outlook visar CC-adresserna separerade med kommatecken och inte känner igen dem: gå i Outlook till Arkiv › Alternativ › E-post › Skicka meddelanden och aktivera alternativet att använda kommatecken för att separera flera mottagare. Du kan också använda Kopiera CC och klistra in dem i CC-fältet.", "Formatted email copied. Paste it into the message body.": "Formaterat mejl kopierat. Klistra in det i meddelandet.", "Could not copy automatically: select the preview and copy with Ctrl+C.": "Kunde inte kopiera automatiskt: markera förhandsgranskningen och kopiera med Ctrl+C.", "Containers per month": "Containrar per månad"};
  // Patrones inglés → sueco (se aplican sobre la salida en inglés)
  const SVW = s => SV[s] || s;
  const SVP = [
    [/^(.*) · (\d+) containers on record$/, m => `${m[1]} · ${m[2]} registrerade containrar`],
    [/^Containers (\d{4}) · (.*) t$/, m => `Containrar ${m[1]} · ${m[2]} t`],
    [/^No booking, departs in (-?\d+) days$/, m => `Ingen bokning, avgår om ${m[1]} dagar`],
    [/^(\d+) selected$/, m => `${m[1]} markerade`],
    [/^(\d+) of (\d+) shipments · (.*) bags · (.*) t$/, m => `${m[1]} av ${m[2]} sändningar · ${m[3]} säckar · ${m[4]} t`],
    [/^(\d+) of (\d+) shipments$/, m => `${m[1]} av ${m[2]} sändningar`],
    [/^Filters \((\d+)\)$/, m => `Filter (${m[1]})`],
    [/^Select No\. (.*)$/, m => `Markera nr ${m[1]}`],
    [/^Shipment (.*) not found\. It may have been deleted\.$/, m => `Sändning ${m[1]} hittades inte. Den kan ha raderats.`],
    [/^Shipment No\. (\d+) created$/, m => `Sändning nr ${m[1]} skapad`],
    [/^Shipment No\. (\d+)$/, m => `Sändning nr ${m[1]}`],
    [/^· missing (.*)$/, m => `· saknas ${m[1].replace('container', 'container').replace('seal', 'plomb').replace('tare', 'tara').replace('missing booking No.', 'bokningsnr')}`],
    [/^Same booking \((\d+) containers\)$/, m => `Samma bokning (${m[1]} containrar)`],
    [/^Copy booking data to the other (\d+)$/, m => `Kopiera bokningsuppgifter till de andra ${m[1]}`],
    [/^Booking email · (\d+) containers?$/, m => `Bokningsmejl · ${m[1]} container${m[1] === '1' ? '' : 'rar'}`],
    [/^To \((.*)\)$/, m => `Till (${m[1] === 'no forwarder' ? 'ingen speditör' : m[1]})`],
    [/^Booking (.*) · (\d+) containers? ?(?:· (.*))?$/, m => `Bokning ${m[1] === '— No booking —' ? '— Ingen bokning —' : m[1]} · ${m[2]} container${m[2] === '1' ? '' : 'rar'}${m[3] ? ' · ' + m[3] : ''}`],
    [/^Customer Sales Order (.*)$/, m => `Kundens försäljningsorder ${m[1]}`],
    [/^➕ New shipment \(No\. (\d+)\)$/, m => `➕ Ny sändning (nr ${m[1]})`],
    [/^Matched by (.*)$/, m => `Matchad via ${m[1] === 'manual selection' ? 'manuellt val' : m[1]}`],
    [/^Update No\. (\d+)$/, m => `Uppdatera nr ${m[1]}`],
    [/^Apply (.*)$/, m => `Tillämpa ${SVW(m[1])}`],
    [/^Export to Excel \((\d+)\)$/, m => `Exportera till Excel (${m[1]})`],
    [/^Containers per month \((.*)\)$/, m => `Containrar per månad (${m[1] === 'order date' ? 'orderdatum' : m[1]})`],
    [/^(\d{4}-\d{2}): (\d+) containers, (.*) t$/, m => `${m[1]}: ${m[2]} containrar, ${m[3]} t`],
    [/^Delete shipment No\. (\d+)\? This cannot be undone\.$/, m => `Radera sändning nr ${m[1]}? Det går inte att ångra.`],
    [/^Change status of (\d+) shipments?$/, m => `Ändra status för ${m[1]} sändning${m[1] === '1' ? '' : 'ar'}`],
    [/^Loading shipments from the Excel… (\d+) of (\d+)\. Do not close the page\.$/, m => `Läser in sändningar från Excel… ${m[1]} av ${m[2]}. Stäng inte sidan.`],
    [/^The port delivery date \((.*)\) must be within the stacking window \((.*) to (.*)\)\.$/, m => `Leveransdatumet till hamnen (${m[1]}) måste ligga inom stackingfönstret (${m[2]} till ${m[3]}).`],
    [/^Stacking closes in (\d+) days with no delivery date$/, m => `Stacking stänger om ${m[1]} dagar utan leveransdatum`],
    [/^Different type: order (.*) · booking (.*)$/, m => `Annan typ: order ${m[1]} · bokning ${m[2]}`],
    [/^Has another booking: (.*)$/, m => `Har en annan bokning: ${m[1]}`],
    [/^Change the order to (.*)$/, m => `Ändra ordern till ${m[1]}`],
    [/^Link No\. (\d+)$/, m => `Koppla nr ${m[1]}`],
    [/^The booking is for (\d+) containers? and (\d+) orders? (?:is|are) selected\.$/, m => `Bokningen gäller ${m[1]} container${m[1] === '1' ? '' : 'rar'} och ${m[2]} order${m[2] === '1' ? '' : 'rar'} är valda.`],
    [/^(Save booking and update|Save and update) (\d+) orders?$/, m => `${m[1] === 'Save and update' ? 'Spara och uppdatera' : 'Spara bokning och uppdatera'} ${m[2]} order${m[2] === '1' ? '' : 'rar'}`],
    [/^Copied to each order: booking, carrier, forwarder, vessel, ports, ETD\/ETA and stacking(; the carrier's BL is saved as MBL)?\.$/, m => `Kopieras till varje order: bokning, rederi, speditör, fartyg, hamnar, ETD/ETA och stacking${m[1] ? '; rederiets BL sparas som MBL' : ''}.`],
    [/^\((Final|Draft)\) saved and linked to (\d+) shipments?\.$/, m => `(${m[1] === 'Final' ? 'Slutlig' : 'Utkast'}) sparad och kopplad till ${m[2]} sändning${m[2] === '1' ? '' : 'ar'}.`],
    [/^saved and linked to (\d+) shipments?\.$/, m => `sparad och kopplad till ${m[1]} sändning${m[1] === '1' ? '' : 'ar'}.`],
    [/^Booking (\S+) linked \((.*)\)$/, m => `Bokning ${m[1]} kopplad (${m[2]})`],
    [/^Unlinked from booking (.*)$/, m => `Bortkopplad från bokning ${m[1]}`],
    [/^Equipment in the booking:$/, () => 'Utrustning i bokningen:'],
    [/^Booking (.*) not found\.$/, m => `Bokning ${m[1]} hittades inte.`],
    [/^Include the other (\d+) orders on the same booking \(No\. (.*)\)$/, m => `Ta med de andra ${m[1]} ordrarna i samma bokning (nr ${m[2]})`],
    [/^Booking (\S+) · no PDF imported$/, m => `Bokning ${m[1]} · ingen PDF importerad`],
    [/^Could not prepare the email: (.*)$/, m => `Kunde inte förbereda mejlet: ${m[1]}`],
    [/^This BL already exists as (Final|Draft)\. Saving adds this PDF and updates the data\.( No data changes\.)?$/, m => `Den här BL:en finns redan som ${m[1] === 'Final' ? 'slutlig' : 'utkast'}. När du sparar läggs PDF:en till och uppgifterna uppdateras.${m[2] ? ' Inga ändringar i uppgifterna.' : ''}`],
    [/^Changes from the previous version:$/, () => 'Ändringar jämfört med föregående version:'],
    [/^Save BL and update (\d+) shipments?$/, m => `Spara BL och uppdatera ${m[1]} sändning${m[1] === '1' ? '' : 'ar'}`],
    [/^Containers \((\d+)\)$/, m => `Containrar (${m[1]})`],
    [/^Different seal: order (.*) · BL (.*)$/, m => `Annan plomb: order ${m[1]} · BL ${m[2]}`],
    [/^Different PO: order (.*) · BL (.*)$/, m => `Annan PO: order ${m[1]} · BL ${m[2]}`],
    [/^Bags: order (.*) · BL (.*)$/, m => `Säckar: order ${m[1]} · BL ${m[2]}`],
    [/^Gross weight: order (.*) · BL (.*)$/, m => `Bruttovikt: order ${m[1]} · BL ${m[2]}`],
    [/^Type: order (.*) · BL (.*)$/, m => `Typ: order ${m[1]} · BL ${m[2]}`],
    [/^POD: order (.*) · BL (.*)$/, m => `POD: order ${m[1]} · BL ${m[2]}`],
    [/^Container on the order: (.*)$/, m => `Container på ordern: ${m[1]}`],
    [/^The order has another BL: (.*)$/, m => `Ordern har en annan BL: ${m[1]}`],
    [/^BL (\S+) \((final|draft)\) linked$/, m => `BL ${m[1]} (${m[2] === 'final' ? 'slutlig' : 'utkast'}) kopplad`],
    [/^Unlinked from BL (.*)$/, m => `Bortkopplad från BL ${m[1]}`],
    [/^BL (.*) not found\.$/, m => `BL ${m[1]} hittades inte.`],
    [/^Open No\. (\d+) · (.*)$/, m => `Öppna nr ${m[1]} · ${m[2]}`],
    [/^Open No\. (\d+)$/, m => `Öppna nr ${m[1]}`],
    [/^See all (\d+) checks$/, m => `Se alla ${m[1]} kontroller`],
    [/^Review with Claude · No\. (\d+)$/, m => `Granskning med Claude · nr ${m[1]}`],
    [/^Item (.*) has no kg per bag$/, m => `Artikel ${m[1]} saknar kg per säck`],
    [/^Item (.*) has no price$/, m => `Artikel ${m[1]} saknar pris`],
    [/^Container type differs from booking \((.*) vs (.*)\)$/, m => `Containertypen skiljer sig från bokningen (${m[1]} mot ${m[2]})`],
    [/^BL: (.*)$/, m => `BL: ${svTr(m[1]) || m[1]}`],
    [/^(SO|PO|Container) (.*) repeated in No\. (.*)$/, m => `${m[1] === 'Container' ? 'Container' : m[1]} ${m[2]} upprepas i nr ${m[3]}`],
    [/^Improvement suggestions received \((\d+)\)$/, m => `Mottagna förbättringsförslag (${m[1]})`],
    [/^(\d+) containers updated$/, m => `${m[1]} containrar uppdaterade`],
    [/^Edited (.*?)( and (\d+) more)?$/, m => `Ändrade ${m[1].split(', ').map(SVW).join(', ')}${m[3] ? ` och ${m[3]} till` : ''}`],
    [/^Created from PDF (.*)$/, m => `Skapad från PDF ${m[1]}`],
    [/^Updated from PDF ([^:]*): (.*)$/, m => `Uppdaterad från PDF ${m[1]}: ${m[2].split(', ').map(SVW).join(', ')}`],
    [/^Booking data copied from No\. (\d+)$/, m => `Bokningsuppgifter kopierade från nr ${m[1]}`],
    [/^Could not (save|delete|update|export|download|copy|add|generate the document): (.*)$/, m => `Kunde inte ${{ save: 'spara', delete: 'radera', update: 'uppdatera', export: 'exportera', download: 'ladda ner', copy: 'kopiera', add: 'lägga till', 'generate the document': 'skapa dokumentet' }[m[1]]}: ${m[2]}`],
    [/^Error reading shipments: (.*)$/, m => `Fel vid läsning av sändningar: ${m[1]}`],
    [/^The PDF could not be attached \((.*)\), but the data will be saved\.$/, m => `PDF:en kunde inte bifogas (${m[1]}), men uppgifterna sparas.`],
    [/^The initial load was interrupted \((.*)\)\. It will retry next time the page opens\.$/, m => `Den första inläsningen avbröts (${m[1]}). Den försöker igen nästa gång sidan öppnas.`]
  ];
  function svTr(en) {
    if (!en) return null;
    const lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0], core = en.trim();
    if (Object.prototype.hasOwnProperty.call(SV, core)) return lead + SV[core] + trail;
    for (const [re, fn] of SVP) { const mm = core.match(re); if (mm) return lead + fn(mm) + trail; }
    return null;
  }

  function trLang(s) {
    if (I18N.lang === 'en') return tr(s);
    if (I18N.lang === 'sv') { const e = tr(s); if (e != null) return svTr(e) || e; return svTr(s); }
    return null;
  }
  function tr(s) {
    if (!s) return null;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    if (!core) return null;
    if (Object.prototype.hasOwnProperty.call(D, core)) return lead + D[core] + trail;
    for (const [re, fn] of P) { const m = core.match(re); if (m) return lead + fn(m) + trail; }
    return null;
  }

  const origText = new WeakMap(), origAttr = new WeakMap();
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const skip = el => el && el.closest && el.closest('[data-notr],textarea,script,style,input');
  function translateTree(root) {
    if (I18N.lang === 'es' || !root) return;
    if (root.nodeType === 3) { translateText(root); return; }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; const list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(translateText);
    const els = [root].concat(Array.from(root.querySelectorAll('[placeholder],[title],[aria-label]')));
    for (const el of els) {
      if (!el.getAttribute || (el.closest && el.closest('[data-notr]'))) continue;
      for (const a of ATTRS) {
        const v = el.getAttribute(a); if (!v) continue;
        const t = trLang(v);
        if (t && t !== v) { const o = origAttr.get(el) || {}; if (!(a in o)) o[a] = v; origAttr.set(el, o); el.setAttribute(a, t); }
      }
    }
  }
  function translateText(node) {
    const p = node.parentElement;
    if (!p || skip(p)) return;
    // las opciones de listas maestras son datos: sólo se traducen las marcadas como interfaz
    if (p.tagName === 'OPTION' && !p.hasAttribute('data-ui')) return;
    const t = trLang(node.nodeValue);
    if (t && t !== node.nodeValue) { if (!origText.has(node)) origText.set(node, node.nodeValue); node.nodeValue = t; }
  }
  function restoreAll() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (origText.has(n)) { n.nodeValue = origText.get(n); origText.delete(n); }
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el => { const o = origAttr.get(el); if (o) { Object.entries(o).forEach(([a, v]) => el.setAttribute(a, v)); origAttr.delete(el); } });
  }

  const I18N = window.I18N = {
    lang: 'es',
    t(s) { return I18N.lang === 'es' ? s : (trLang(s) || s).trim(); },
    locale() { return I18N.lang === 'en' ? 'en-GB' : I18N.lang === 'sv' ? 'sv-SE' : 'es-CL'; },
    set(lang) {
      I18N.lang = ['en', 'sv'].includes(lang) ? lang : 'es';
      document.documentElement.lang = I18N.lang;
      restoreAll();
      translateTree(document.body);
      document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === I18N.lang));
    }
  };
  new MutationObserver(muts => {
    if (I18N.lang === 'es') return;
    for (const m of muts) m.addedNodes.forEach(translateTree);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
