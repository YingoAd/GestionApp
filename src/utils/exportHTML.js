function fmtDate(d) {
  if (!d) return ''
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return d }
}

function fmtARS(v) {
  if (!v && v !== 0) return ''
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(v)
}

function fmtUSD(v) {
  if (!v && v !== 0) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v)
}

function groupByObra(pagos) {
  const obras = {}
  for (const p of pagos) {
    const o = p.obra || 'Sin obra'
    if (!obras[o]) obras[o] = []
    obras[o].push(p)
  }
  return obras
}

function buildTablaHTML(pagos, titulo, subtotalLabel, bgColor) {
  const obras = groupByObra(pagos)
  let totalARS = 0
  let totalUSD = 0

  let rows = ''
  for (const [obra, ps] of Object.entries(obras).sort()) {
    rows += `
      <tr class="obra-row">
        <td colspan="13">📌 ${obra}</td>
      </tr>`
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i]
      const cls = i % 2 === 0 ? 'data-row' : 'data-row alt'
      totalARS += p.gastoARS || 0
      totalUSD += p.gastoUSD || 0
      rows += `
      <tr class="${cls}">
        <td>${fmtDate(p.fechaCarga)}</td>
        <td>${fmtDate(p.fechaPago)}</td>
        <td>${p.cuenta || ''}</td>
        <td>${p.obra || ''}</td>
        <td>${p.rubro || ''}</td>
        <td>${p.concepto || ''}</td>
        <td>${p.detalle || ''}</td>
        <td>${p.recibo || ''}</td>
        <td>${p.proveedor || ''}</td>
        <td>${p.tipoPago || ''}</td>
        <td>${p.nroComprobante || ''}</td>
        <td class="num">${p.gastoARS ? fmtARS(p.gastoARS) : ''}</td>
        <td class="num">${p.gastoUSD ? fmtUSD(p.gastoUSD) : ''}</td>
      </tr>`
    }
  }

  return `
    <div class="sheet" style="--accent:${bgColor}">
      <div class="sheet-title">${titulo}</div>
      <table>
        <thead>
          <tr class="hdr-row">
            <th>FECHA</th><th>FECHA R</th><th>CAJA</th><th>OBRA</th>
            <th>RUBRO</th><th>CONCEPTO</th><th>DETALLE</th><th>RECIBO/FACT.</th>
            <th>PROVEEDOR/CLIENTE</th><th>F.PAGO</th><th>CBANTE</th>
            <th class="num">MONTO $</th><th class="num">MONTO USD</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="subtotal-row">
            <td colspan="11">${subtotalLabel}</td>
            <td class="num">${fmtARS(totalARS)}</td>
            <td class="num">${totalUSD ? fmtUSD(totalUSD) : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>`
}

function buildEcheqHTML(pagosPend, pagosEmit) {
  const secPend = buildTablaHTML(pagosPend, '❓ PENDIENTES — A COBRAR / DEPOSITAR', 'TOTAL PENDIENTES', '#f59e0b')
  const secEmit = buildTablaHTML(pagosEmit, '✅ EMITIDOS — A PAGAR', 'TOTAL EMITIDOS', '#a78bfa')
  return `
    <div class="sheet" style="--accent:#a78bfa">
      <div class="sheet-title">🔵 eCHEQS</div>
      ${secPend}
      <div style="height:32px"></div>
      ${secEmit}
    </div>`
}

export function exportarPagosHTML(pagos, semanaLabel) {
  const pendientes     = pagos.filter(p => p.estado === 'Pendiente')
  const transferencias = pagos.filter(p => p.tipoPago === 'Transferencia')
  const efectivo       = pagos.filter(p => p.tipoPago === 'Efectivo')
  const tarjeta        = pagos.filter(p => p.tipoPago === 'Tarjeta')
  const echeqPend      = pagos.filter(p => p.tipoPago?.startsWith('Echeq') && p.estado === 'Pendiente')
  const echeqEmit      = pagos.filter(p => p.tipoPago?.startsWith('Echeq') && p.estado === 'Pagado')

  const secciones = [
    buildTablaHTML(pendientes, '❓ PENDIENTES — TODOS LOS TIPOS DE PAGO', 'SUBTOTAL PENDIENTES', '#ef4444'),
    buildTablaHTML(transferencias, '🏦 TRANSFERENCIAS', 'SUBTOTAL TRANSFERENCIAS', '#60a5fa'),
    buildTablaHTML(efectivo, '💵 EFECTIVO', 'SUBTOTAL EFECTIVO', '#22c55e'),
    buildTablaHTML(tarjeta, '💳 TARJETA', 'SUBTOTAL TARJETA', '#fb923c'),
    buildEcheqHTML(echeqPend, echeqEmit),
  ]

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GestPagos — ${semanaLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    background: #f8fafc;
    color: #1e293b;
    padding: 20px;
  }
  .main-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .main-sub {
    font-size: 11px;
    color: #64748b;
    margin-bottom: 28px;
  }
  .tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .tab-btn {
    padding: 8px 18px;
    border-radius: 20px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
  }
  .tab-btn.active {
    background: #0f172a;
    color: #fff;
    border-color: #0f172a;
  }
  .sheet { display: none; }
  .sheet.active { display: block; }
  .sheet-title {
    font-size: 13px;
    font-weight: 800;
    color: var(--accent);
    margin-bottom: 14px;
    padding: 10px 14px;
    background: #fff;
    border-left: 4px solid var(--accent);
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    box-shadow: 0 1px 6px rgba(0,0,0,.08);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .hdr-row th {
    background: #0f172a;
    color: #e2e8f0;
    padding: 8px 10px;
    text-align: left;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .6px;
    white-space: nowrap;
    border-right: 1px solid #1e293b;
  }
  .hdr-row th:last-child { border-right: none; }
  .obra-row td {
    background: #1e293b;
    color: #f1f5f9;
    font-weight: 700;
    font-size: 11px;
    padding: 7px 10px;
    letter-spacing: .3px;
  }
  .data-row td {
    padding: 7px 10px;
    border-bottom: 1px solid #f1f5f9;
    border-right: 1px solid #f8fafc;
    color: #334155;
    font-size: 10px;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .data-row.alt td { background: #f8fafc; }
  .data-row td:last-child { border-right: none; }
  .subtotal-row td {
    background: #0f172a;
    color: #4ade80;
    font-weight: 800;
    font-size: 11px;
    padding: 9px 10px;
    text-align: right;
  }
  .subtotal-row td:first-child {
    text-align: right;
    color: #94a3b8;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .print-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #fff;
    border: none;
    border-radius: 50px;
    padding: 12px 24px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,.25);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 100;
  }
  .print-btn:hover { background: #1e293b; }
  @media print {
    .tabs, .print-btn { display: none !important; }
    .sheet { display: block !important; page-break-after: always; }
    body { padding: 10px; background: #fff; }
  }
</style>
</head>
<body>
<div class="main-title">GestPagos — Informe de pagos</div>
<div class="main-sub">${semanaLabel} &nbsp;·&nbsp; Generado el ${new Date().toLocaleDateString('es-AR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>

<div class="tabs">
  <button class="tab-btn active" onclick="showTab(0)">❓ Pendientes</button>
  <button class="tab-btn" onclick="showTab(1)">🏦 Transferencias</button>
  <button class="tab-btn" onclick="showTab(2)">💵 Efectivo</button>
  <button class="tab-btn" onclick="showTab(3)">💳 Tarjeta</button>
  <button class="tab-btn" onclick="showTab(4)">🔵 eCheqs</button>
</div>

${secciones.map((s, i) => `<div class="sheet${i === 0 ? ' active' : ''}" id="sheet-${i}">${s}</div>`).join('')}

<button class="print-btn" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>

<script>
function showTab(idx) {
  document.querySelectorAll('.sheet').forEach((s,i) => s.classList.toggle('active', i === idx))
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i === idx))
}
</script>
</body>
</html>`

  // Descargar como HTML
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const nuevaVentana = window.open('', '_blank')
nuevaVentana.document.write(html)
nuevaVentana.document.close()
}