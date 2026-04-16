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

function buildTablaRows(pagos) {
  const obras = groupByObra(pagos)
  let rows = ''
  let totalARS = 0
  let totalUSD = 0
  for (const [obra, ps] of Object.entries(obras).sort()) {
    rows += `<tr style="background:#1F3864"><td colspan="13" style="color:#fff;font-weight:700;padding:6px 8px;font-size:11px">📌 ${obra}</td></tr>`
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i]
      const bg = i % 2 === 0 ? '#ffffff' : '#f0f4f8'
      totalARS += p.gastoARS || 0
      totalUSD += p.gastoUSD || 0
      rows += `<tr style="background:${bg}">
        <td>${fmtDate(p.fechaCarga)}</td>
        <td>${fmtDate(p.fechaPago)}</td>
        <td>${p.cuenta || ''}</td>
        <td>${p.obra || ''}</td>
        <td style="font-size:10px">${p.rubro || ''}</td>
        <td style="font-weight:600">${p.concepto || ''}</td>
        <td style="font-size:10px">${p.detalle || ''}</td>
        <td style="font-size:10px">${p.recibo || ''}</td>
        <td style="font-weight:600">${p.proveedor || ''}</td>
        <td>${p.tipoPago || ''}</td>
        <td style="font-size:10px">${p.nroComprobante || ''}</td>
        <td style="text-align:right;font-weight:700;color:#15803d">${p.gastoARS ? fmtARS(p.gastoARS) : ''}</td>
        <td style="text-align:right;font-weight:700;color:#1d4ed8">${p.gastoUSD ? fmtUSD(p.gastoUSD) : ''}</td>
      </tr>`
    }
  }
  rows += `<tr style="background:#FFFF00">
    <td colspan="11" style="text-align:right;font-weight:700;font-size:11px;padding:7px 8px">SUBTOTAL</td>
    <td style="text-align:right;font-weight:700;font-size:12px">${fmtARS(totalARS)}</td>
    <td style="text-align:right;font-weight:700;font-size:12px">${totalUSD ? fmtUSD(totalUSD) : ''}</td>
  </tr>`
  return rows
}

function buildSeccion(titulo, pagos, colorBorde) {
  if (!pagos.length) return ''
  return `
    <div style="margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;color:${colorBorde};border-left:4px solid ${colorBorde};padding:6px 12px;background:#f8fafc;margin-bottom:8px">${titulo}</div>
      <table>
        <thead>
          <tr style="background:#0f172a">
            <th>FECHA</th><th>FECHA R</th><th>CAJA</th><th>OBRA</th>
            <th>RUBRO</th><th>CONCEPTO</th><th>DETALLE</th><th>RECIBO/FACT.</th>
            <th>PROVEEDOR/CLIENTE</th><th>F.PAGO</th><th>CBANTE</th>
            <th style="text-align:right">MONTO $</th><th style="text-align:right">MONTO USD</th>
          </tr>
        </thead>
        <tbody>${buildTablaRows(pagos)}</tbody>
      </table>
    </div>`
}

function buildHTML(pagos, semanaLabel) {
  const pendientes     = pagos.filter(p => p.estado === 'Pendiente')
  const transferencias = pagos.filter(p => p.tipoPago === 'Transferencia')
  const efectivo       = pagos.filter(p => p.tipoPago === 'Efectivo')
  const tarjeta        = pagos.filter(p => p.tipoPago === 'Tarjeta')
  const echeqPend      = pagos.filter(p => p.tipoPago?.startsWith('Echeq') && p.estado === 'Pendiente')
  const echeqEmit      = pagos.filter(p => p.tipoPago?.startsWith('Echeq') && p.estado === 'Pagado')

  const totalARS = pagos.reduce((s, p) => s + (p.gastoARS || 0), 0)
  const totalUSD = pagos.reduce((s, p) => s + (p.gastoUSD || 0), 0)

  const contenido = `
    ${buildSeccion('❓ PENDIENTES — TODOS LOS TIPOS', pendientes, '#ef4444')}
    ${buildSeccion('🏦 TRANSFERENCIAS', transferencias, '#3b82f6')}
    ${buildSeccion('💵 EFECTIVO', efectivo, '#22c55e')}
    ${buildSeccion('💳 TARJETA', tarjeta, '#f97316')}
    ${echeqPend.length ? buildSeccion('🔵 eCHEQS PENDIENTES', echeqPend, '#a78bfa') : ''}
    ${echeqEmit.length ? buildSeccion('✅ eCHEQS EMITIDOS', echeqEmit, '#6d28d9') : ''}
  `

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>GestPagos — ${semanaLabel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;font-size:11px}
body{background:#f0f4f8;color:#1f2937;padding:20px}
h1{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px}
.sub{font-size:11px;color:#64748b;margin-bottom:20px}
.resumen{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.res-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;min-width:140px}
.res-card .val{font-size:18px;font-weight:700;color:#0f172a}
.res-card .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.btns{display:flex;gap:10px;margin-bottom:24px}
.btn{padding:9px 20px;border-radius:6px;border:none;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.btn-pdf{background:#0f172a;color:#fff}
.btn-xls{background:#15803d;color:#fff}
table{width:100%;border-collapse:collapse;background:#fff;margin-bottom:4px;font-size:10px}
th{background:#0f172a;color:#e2e8f0;padding:7px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;border-right:1px solid #1e293b}
td{padding:6px 8px;border-bottom:1px solid #f1f5f9;border-right:1px solid #f8fafc;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
@media print{.noprint{display:none!important}body{background:#fff;padding:10px}.resumen{display:flex}}
</style>
</head>
<body>
<h1>GestPagos — Informe de pagos</h1>
<div class="sub">${semanaLabel} &nbsp;·&nbsp; Generado el ${new Date().toLocaleDateString('es-AR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>

<div class="resumen">
  <div class="res-card"><div class="lbl">Total pagos</div><div class="val">${pagos.length}</div></div>
  <div class="res-card"><div class="lbl">Pendientes</div><div class="val" style="color:#dc2626">${pendientes.length}</div></div>
  <div class="res-card"><div class="lbl">Total ARS</div><div class="val" style="color:#15803d">${fmtARS(totalARS)}</div></div>
  ${totalUSD ? `<div class="res-card"><div class="lbl">Total USD</div><div class="val" style="color:#1d4ed8">${fmtUSD(totalUSD)}</div></div>` : ''}
</div>

<div class="btns noprint">
  <button class="btn btn-pdf" onclick="window.print()">🖨 Imprimir / PDF</button>
  <button class="btn btn-xls" onclick="exportXLS()">📊 Abrir en Excel</button>
</div>

${contenido}

<p style="font-size:10px;color:#94a3b8;margin-top:16px">GestPagos v4 · ${new Date().toLocaleString('es-AR')}</p>

<script>
function exportXLS(){
  var html=document.documentElement.outerHTML;
  var blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='GestPagos-${semanaLabel}.xls';
  a.click();
  URL.revokeObjectURL(url);
}
</script>
</body>
</html>`
}

function dlBlob(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportarPagosHTML(pagos, semanaLabel) {
  const html = buildHTML(pagos, semanaLabel)
  dlBlob(html, 'GestPagos-' + semanaLabel + '.html')
}