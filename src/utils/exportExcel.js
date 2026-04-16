import * as XLSX from 'xlsx'

function fmtDate(d) {
  if (!d) return ''
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return d }
}

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return ''
  return parseFloat(v) || ''
}

const COLS = ['FECHA','FECHA R','CAJA','OBRA','RUBRO','CONCEPTO','DETALLE','RECIBO/FACT.','PROVEEDOR/CLIENTE','F.PAGO','CBANTE','MONTO $','MONTO USD']

function pagoToRow(p) {
  return [
    fmtDate(p.fechaCarga),
    fmtDate(p.fechaPago),
    p.cuenta || '',
    p.obra || '',
    p.rubro || '',
    p.concepto || '',
    p.detalle || '',
    p.recibo || '',
    p.proveedor || '',
    p.tipoPago || '',
    p.nroComprobante || '',
    fmtNum(p.gastoARS),
    fmtNum(p.gastoUSD),
  ]
}

function buildSheet(wb, sheetName, pagos, title1, title2, subtotalLabel, semanaLabel) {
  const rows = []
  rows.push(['', `INF-PAGOS — ${semanaLabel}`])
  rows.push(['', title1])
  rows.push(['', ...COLS])

  // Agrupar por obra
  const obras = {}
  for (const p of pagos) {
    const o = p.obra || 'Sin obra'
    if (!obras[o]) obras[o] = []
    obras[o].push(p)
  }

  let totalARS = 0
  let totalUSD = 0

  for (const [obra, ps] of Object.entries(obras).sort()) {
    rows.push(['', `📌 ${obra}`])
    for (const p of ps) {
      rows.push(['', ...pagoToRow(p)])
      totalARS += p.gastoARS || 0
      totalUSD += p.gastoUSD || 0
    }
    rows.push([])
  }

  rows.push(['', subtotalLabel, '', '', '', '', '', '', '', '', '', totalARS || 0, totalUSD || 0])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Anchos de columna
  ws['!cols'] = [
    { wch: 3 }, { wch: 13 }, { wch: 13 }, { wch: 18 }, { wch: 15 },
    { wch: 24 }, { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 30 },
    { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
}

function buildEcheqSheet(wb, pagosPend, pagosEmit, semanaLabel) {
  const rows = []
  rows.push(['', `INF-PAGOS — ${semanaLabel}`])
  rows.push(['', '🔵 eCHEQS — PENDIENTES Y EMITIDOS'])
  rows.push([])

  rows.push(['', '❓ PENDIENTES — A COBRAR / DEPOSITAR'])
  rows.push(['', ...COLS])

  const obrasPend = {}
  for (const p of pagosPend) {
    const o = p.obra || 'Sin obra'
    if (!obrasPend[o]) obrasPend[o] = []
    obrasPend[o].push(p)
  }
  let tARS_p = 0; let tUSD_p = 0
  for (const [obra, ps] of Object.entries(obrasPend).sort()) {
    rows.push(['', `📌 ${obra}`])
    for (const p of ps) { rows.push(['', ...pagoToRow(p)]); tARS_p += p.gastoARS || 0; tUSD_p += p.gastoUSD || 0 }
    rows.push([])
  }
  rows.push(['', 'TOTAL PENDIENTES', '', '', '', '', '', '', '', '', '', tARS_p, tUSD_p])
  rows.push([])
  rows.push([])

  rows.push(['', '✅ EMITIDOS — A PAGAR'])
  rows.push(['', ...COLS])

  const obrasEmit = {}
  for (const p of pagosEmit) {
    const o = p.obra || 'Sin obra'
    if (!obrasEmit[o]) obrasEmit[o] = []
    obrasEmit[o].push(p)
  }
  let tARS_e = 0; let tUSD_e = 0
  for (const [obra, ps] of Object.entries(obrasEmit).sort()) {
    rows.push(['', `📌 ${obra}`])
    for (const p of ps) { rows.push(['', ...pagoToRow(p)]); tARS_e += p.gastoARS || 0; tUSD_e += p.gastoUSD || 0 }
    rows.push([])
  }
  rows.push(['', 'TOTAL EMITIDOS', '', '', '', '', '', '', '', '', '', tARS_e, tUSD_e])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 3 }, { wch: 13 }, { wch: 13 }, { wch: 18 }, { wch: 15 },
    { wch: 24 }, { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 30 },
    { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'INF-eCHEQ')
}

export function exportarPagosExcel(pagos, semanaLabel) {
  const wb = XLSX.utils.book_new()

  const pendientes    = pagos.filter(p => p.estado === 'Pendiente')
  const transferencias = pagos.filter(p => p.tipoPago === 'Transferencia')
  const efectivo      = pagos.filter(p => p.tipoPago === 'Efectivo')
  const tarjeta       = pagos.filter(p => p.tipoPago === 'Tarjeta')
  const echeqPend     = pagos.filter(p => p.tipoPago?.startsWith('Echeq') && p.estado === 'Pendiente')
  const echeqEmit     = pagos.filter(p => p.tipoPago?.startsWith('Echeq') && p.estado === 'Pagado')

  buildSheet(wb, 'INF-PEND', pendientes, '❓ PENDIENTES — TODOS LOS TIPOS', '', 'SUBTOTAL PENDIENTES', semanaLabel)
  buildSheet(wb, 'INF-TRF', transferencias, '🏦 TRANSFERENCIAS', '', 'SUBTOTAL TRANSFERENCIAS', semanaLabel)
  buildSheet(wb, 'INF-EFT', efectivo, '💵 EFECTIVO', '', 'SUBTOTAL EFECTIVO', semanaLabel)
  buildSheet(wb, 'INF-TRJ', tarjeta, '💳 TARJETA', '', 'SUBTOTAL TARJETA', semanaLabel)
  buildEcheqSheet(wb, echeqPend, echeqEmit, semanaLabel)

  const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-')
  XLSX.writeFile(wb, `GestPagos-${semanaLabel}-${fecha}.xlsx`)
}