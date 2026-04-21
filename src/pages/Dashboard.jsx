import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '../store/useStore'
import { getLunes, addDays, d2s, fDate, fARS, getAlert } from '../utils/helpers'
import TablaExcel from '../components/TablaExcel'

const TIPO_COLORS = {
  Efectivo: '#22c55e',
  Transferencia: '#60a5fa',
  Echeq: '#a78bfa',
}

const DIAS = ['Lun','Mar','Mie','Jue','Vie']

function formatYAxis(value) {
  if (value >= 1000000) return '$' + (value/1000000).toFixed(1) + 'M'
  if (value >= 1000) return '$' + (value/1000).toFixed(0) + 'K'
  return '$' + value
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{label}</div>
      {payload.map(p => p.value > 0 && (
        <div key={p.dataKey} style={{ color: TIPO_COLORS[p.dataKey], marginBottom: 2 }}>
          {p.dataKey}: {fARS(p.value)}
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontWeight: 700, color: 'var(--text)' }}>
        Total: {fARS(total)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, update } = useStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeTipos, setActiveTipos] = useState({ Efectivo: true, Transferencia: true, Echeq: true })
  const [selectedDay, setSelectedDay] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const lb = addDays(getLunes(), weekOffset * 7)
  const wId = d2s(lb)
  const dom = addDays(lb, 6)
  const esHoy = weekOffset === 0

  const pagosSemana = useMemo(() => data.pagos.filter(p => {
    const fechaRef = p.fechaPago || p.fechaCarga
    if (!fechaRef) return false
    const lp = d2s(getLunes(new Date(fechaRef + 'T00:00:00')))
    return lp === wId
  }), [data.pagos, wId])

  const arrastre = weekOffset >= 0
    ? data.pagos.filter(p => d2s(getLunes(new Date(p.fechaCarga + 'T00:00:00'))) < wId && p.estado === 'Pendiente')
    : []

  const tpARS = [...pagosSemana, ...arrastre].filter(p => p.estado === 'Pendiente' && p.gastoARS).reduce((s, p) => s + p.gastoARS, 0)
  const tpgARS = pagosSemana.filter(p => p.estado === 'Pagado' && p.gastoARS).reduce((s, p) => s + p.gastoARS, 0)

 const chartData = useMemo(() => {
    const hoy = d2s(new Date())
    return DIAS.map((dia, i) => {
      const fecha = d2s(addDays(lb, i))
      const pagosDelDia = pagosSemana.filter(p => {
        if (p.estado === 'Pagado') return p.fechaPago === fecha
        if (p.estado === 'Emitido') return p.fechaPago === fecha
        if (p.estado === 'Pendiente') {
          if (p.fechaPago && p.fechaPago <= hoy) return fecha === hoy
          return p.fechaPago === fecha
        }
        return p.fechaPago === fecha
      })
      if (i === 0) console.log('Lunes pagosDelDia:', pagosDelDia.length, 'pagosSemana:', pagosSemana.length, 'hoy:', hoy, 'fecha:', fecha)
      const efectivo = pagosDelDia.filter(p => p.tipoPago === 'Efectivo').reduce((s, p) => s + (p.gastoARS || 0), 0)
      const transferencia = pagosDelDia.filter(p => p.tipoPago === 'Transferencia').reduce((s, p) => s + (p.gastoARS || 0), 0)
      const echeq = pagosDelDia.filter(p => p.tipoPago && p.tipoPago.startsWith('Echeq')).reduce((s, p) => s + (p.gastoARS || 0), 0)
      return { dia, fecha, Efectivo: efectivo, Transferencia: transferencia, Echeq: echeq, total: efectivo + transferencia + echeq, pagos: pagosDelDia }
    })
  }, [pagosSemana, weekOffset])
  
  const pagosDelDiaSeleccionado = selectedDay ? chartData.find(d => d.dia === selectedDay)?.pagos || [] : []

  const toggleTipo = (tipo) => setActiveTipos(prev => ({ ...prev, [tipo]: !prev[tipo] }))

  const handleBarClick = (d) => {
    if (!d || !d.activeLabel) return
    setSelectedDay(prev => prev === d.activeLabel ? null : d.activeLabel)
  }

  const toggleEstado = (id, nuevoEstado) => {
    update(d => {
      const pago = d.pagos.find(p => p.id === id)
      const updated = { ...pago, estado: nuevoEstado, fechaPago: nuevoEstado === 'Pagado' && !pago.fechaPago ? d2s(new Date()) : pago.fechaPago }
      return { ...d, pagos: d.pagos.map(p => p.id === id ? updated : p), _pagoChanged: updated, _pagoDeleted: null, _proveedorChanged: null, _proveedorDeleted: null, _ingresoChanged: null, _ingresoDeleted: null, _configChanged: null }
    })
  }

  const deletePago = (id) => {
    update(d => ({ ...d, pagos: d.pagos.filter(p => p.id !== id), _pagoDeleted: id, _pagoChanged: null, _proveedorChanged: null, _proveedorDeleted: null, _ingresoChanged: null, _ingresoDeleted: null, _configChanged: null }))
  }

  const statPend = pagosSemana.filter(p => p.estado === 'Pendiente').length
  const statPago = pagosSemana.filter(p => p.estado === 'Pagado').length

  return (
    <div>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8 }}>
        <button onClick={() => { setWeekOffset(w => w - 1); setSelectedDay(null) }}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
          Anterior
        </button>
        <div style={{ textAlign: 'center', flex: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{esHoy ? 'Semana actual' : weekOffset > 0 ? '+' + weekOffset + ' sem.' : Math.abs(weekOffset) + ' sem. atras'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fDate(wId)} - {fDate(d2s(dom))}</div>
        </div>
        <button onClick={() => { setWeekOffset(w => w + 1); setSelectedDay(null) }}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
          Siguiente
        </button>
      </div>
      {weekOffset !== 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => { setWeekOffset(0); setSelectedDay(null) }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
            Hoy
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pendiente', value: fARS(tpARS), sub: statPend + ' pago(s)', color: 'var(--yellow)' },
          { label: 'Pagado', value: fARS(tpgARS), sub: statPago + ' pago(s)', color: 'var(--green)' },
          { label: 'Pend. anteriores', value: arrastre.length, sub: arrastre.length > 0 ? 'sin ejecutar' : 'Al dia', color: arrastre.length > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {console.log('pagosSemana:', pagosSemana.length, 'chartData:', chartData)}
      {/* Grafico */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 20px 10px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginRight: 4 }}>Forma de pago:</div>
          {Object.entries(TIPO_COLORS).map(([tipo, color]) => (
            <button key={tipo} onClick={() => toggleTipo(tipo)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                borderRadius: 20, border: '1px solid ' + (activeTipos[tipo] ? color : 'var(--border)'),
                background: activeTipos[tipo] ? color + '22' : 'var(--bg3)',
                color: activeTipos[tipo] ? color : 'var(--text3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                textDecoration: activeTipos[tipo] ? 'none' : 'line-through'
              }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: activeTipos[tipo] ? color : 'var(--border)', display: 'inline-block' }}></span>
              {tipo}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={280} style={{ outline: 'none' }}>
          <BarChart
            data={chartData}
            onClick={!isMobile ? handleBarClick : undefined}
            onTouchEnd={isMobile ? handleBarClick : undefined}
            style={{ cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis hide={isMobile} tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} width={isMobile ? 0 : 60} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,124,255,.08)' }} />
            {activeTipos.Efectivo && (
              <Bar dataKey="Efectivo" fill={TIPO_COLORS.Efectivo} radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={selectedDay === entry.dia ? TIPO_COLORS.Efectivo : TIPO_COLORS.Efectivo + 'cc'} />
                ))}
              </Bar>
            )}
            {activeTipos.Transferencia && (
              <Bar dataKey="Transferencia" fill={TIPO_COLORS.Transferencia} radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={selectedDay === entry.dia ? TIPO_COLORS.Transferencia : TIPO_COLORS.Transferencia + 'cc'} />
                ))}
              </Bar>
            )}
            {activeTipos.Echeq && (
              <Bar dataKey="Echeq" fill={TIPO_COLORS.Echeq} radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={selectedDay === entry.dia ? TIPO_COLORS.Echeq : TIPO_COLORS.Echeq + 'cc'} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle del dia seleccionado */}
      {selectedDay && pagosDelDiaSeleccionado.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent)', borderRadius: 'var(--r)', padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Pagos del {selectedDay}
            <span style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>
              {pagosDelDiaSeleccionado.length}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text2)', fontWeight: 400 }}>
              Total: {fARS(pagosDelDiaSeleccionado.reduce((s, p) => s + (p.gastoARS || 0), 0))}
            </span>
          </div>
          <TablaExcel pagos={pagosDelDiaSeleccionado} cfg={data.alertConfig} onToggle={toggleEstado} onDelete={deletePago} />
        </div>
      )}

      {selectedDay && pagosDelDiaSeleccionado.length === 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 20, marginBottom: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          Sin pagos el {selectedDay}
        </div>
      )}

      {/* Arrastre */}
      {arrastre.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Arrastre pendiente
            <span style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>{arrastre.length}</span>
          </div>
          <TablaExcel pagos={arrastre} cfg={data.alertConfig} onToggle={toggleEstado} onDelete={deletePago} />
        </div>
      )}
    </div>
  )
}