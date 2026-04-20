import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { getLunes, addDays, d2s, fDate, fARS, fUSD } from '../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const TIPO_COLORS = {
  CHQ: '#f59e0b',
  Echeq: '#a78bfa',
}

const DIAS = ['Lun','Mar','Mie','Jue','Vie']
const SEMANAS = ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5']

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
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map(p => p.value > 0 && (
        <div key={p.dataKey} style={{ color: TIPO_COLORS[p.dataKey] || '#60a5fa', marginBottom: 2 }}>
          {p.dataKey}: {fARS(p.value)}
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
        Total: {fARS(total)}
      </div>
    </div>
  )
}

export default function Diferidos() {
  const { data, update } = useStore()
  const [vistaGrafico, setVistaGrafico] = useState('semanal')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [filt, setFilt] = useState({ obra: '', proveedor: '', estado: '', nroCheque: '', orden: 'asc' })
  const fSet = (k, v) => setFilt(p => ({ ...p, [k]: v }))
  const [debitadoModal, setDebitadoModal] = useState(null)
  const [debitadoFecha, setDebitadoFecha] = useState('')

  // Solo CHQ y Echeq con estado Emitido o Debitado
  const diferidos = useMemo(() => data.pagos.filter(p => {
    const esDif = p.tipoPago === 'CHQ' || (p.tipoPago && p.tipoPago.startsWith('Echeq'))
    const estadoOk = p.estado === 'Emitido' || p.estado === 'Debitado'
    return esDif && estadoOk
  }), [data.pagos])

  // Filtros
  const filtrados = useMemo(() => {
  let result = diferidos.filter(p => {
    if (filt.obra && p.obra !== filt.obra) return false
    if (filt.proveedor && !p.proveedor.toLowerCase().includes(filt.proveedor.toLowerCase())) return false
    if (filt.estado && p.estado !== filt.estado) return false
    if (filt.nroCheque && !(p.nroComprobante || '').toLowerCase().includes(filt.nroCheque.toLowerCase())) return false
    return true
  })
  result.sort((a, b) => {
    const fa = a.fechaPago || a.fechaCarga || ''
    const fb = b.fechaPago || b.fechaCarga || ''
    return filt.orden === 'asc' ? fa.localeCompare(fb) : fb.localeCompare(fa)
  })
  return result
}, [diferidos, filt])
const [debitadoModal, setDebitadoModal] = useState(null)
const [debitadoFecha, setDebitadoFecha] = useState('')
  // Stats
  const totalEmitido = filtrados.filter(p => p.estado === 'Emitido').reduce((s, p) => s + (p.gastoARS || 0), 0)
  const totalDebitado = filtrados.filter(p => p.estado === 'Debitado').reduce((s, p) => s + (p.gastoARS || 0), 0)
  const countEmitido = filtrados.filter(p => p.estado === 'Emitido').length
  const countDebitado = filtrados.filter(p => p.estado === 'Debitado').length


  // --- GRAFICO SEMANAL ---
  const lb = addDays(getLunes(), weekOffset * 7)
  const wId = d2s(lb)
  const dom = d2s(addDays(lb, 6))

  const chartSemanal = useMemo(() => {
    return DIAS.map((dia, i) => {
      const fecha = d2s(addDays(lb, i))
      const pagosDelDia = filtrados.filter(p => p.fechaPago === fecha && p.estado === 'Emitido')
      const chq = pagosDelDia.filter(p => p.tipoPago === 'CHQ').reduce((s, p) => s + (p.gastoARS || 0), 0)
      const echeq = pagosDelDia.filter(p => p.tipoPago?.startsWith('Echeq')).reduce((s, p) => s + (p.gastoARS || 0), 0)
      return { dia, fecha, CHQ: chq, Echeq: echeq, total: chq + echeq, pagos: pagosDelDia }
    })
  }, [filtrados, lb])

  // --- GRAFICO MENSUAL ---
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + monthOffset, 1)

  const chartMensual = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const semStart = addDays(new Date(primerDiaMes), i * 7)
      const semEnd = addDays(semStart, 6)
      const pagosDelPeriodo = filtrados.filter(p => {
        if (!p.fechaPago) return false
        return p.fechaPago >= d2s(semStart) && p.fechaPago <= d2s(semEnd) && p.estado === 'Emitido'
      })
      const chq = pagosDelPeriodo.filter(p => p.tipoPago === 'CHQ').reduce((s, p) => s + (p.gastoARS || 0), 0)
      const echeq = pagosDelPeriodo.filter(p => p.tipoPago?.startsWith('Echeq')).reduce((s, p) => s + (p.gastoARS || 0), 0)
      return {
        label: 'Sem ' + (i + 1),
        fechaInicio: d2s(semStart),
        fechaFin: d2s(semEnd),
        CHQ: chq, Echeq: echeq,
        total: chq + echeq,
        pagos: pagosDelPeriodo,
      }
    })
  }, [filtrados, primerDiaMes])

  const chartData = vistaGrafico === 'semanal' ? chartSemanal : chartMensual
  const dataKey = vistaGrafico === 'semanal' ? 'dia' : 'label'

  const pagosDelPeriodoSeleccionado = selectedPeriod
    ? chartData.find(d => (d.dia || d.label) === selectedPeriod)?.pagos || []
    : []

  const handleBarClick = (d) => {
    if (!d || !d.activeLabel) return
    setSelectedPeriod(prev => prev === d.activeLabel ? null : d.activeLabel)
  }

  const marcarDebitado = (id, nuevoEstado) => {
  if (nuevoEstado === 'Debitado') {
    setDebitadoFecha(new Date().toISOString().split('T')[0])
    setDebitadoModal(id)
    return
  }
  update(d => {
    const pago = d.pagos.find(p => p.id === id)
    const updated = { ...pago, estado: nuevoEstado }
    return {
      ...d,
      pagos: d.pagos.map(p => p.id === id ? updated : p),
      _pagoChanged: updated,
      _pagoDeleted: null, _proveedorChanged: null, _proveedorDeleted: null,
      _ingresoChanged: null, _ingresoDeleted: null, _configChanged: null,
    }
  })
}

const confirmarDebitado = () => {
  const id = debitadoModal
  update(d => {
    const pago = d.pagos.find(p => p.id === id)
    const updated = { ...pago, estado: 'Debitado', fechaPago: debitadoFecha || pago.fechaPago }
    return {
      ...d,
      pagos: d.pagos.map(p => p.id === id ? updated : p),
      _pagoChanged: updated,
      _pagoDeleted: null, _proveedorChanged: null, _proveedorDeleted: null,
      _ingresoChanged: null, _ingresoDeleted: null, _configChanged: null,
    }
  })
  setDebitadoModal(null)
  setDebitadoFecha('')
}

  const nombreMes = primerDiaMes.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Diferidos — Cheques y eCheqs</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Emitidos', value: countEmitido, sub: 'en circulacion', color: 'var(--yellow)' },
          { label: 'Total emitido ARS', value: fARS(totalEmitido), sub: 'riesgo de debito', color: 'var(--yellow)' },
          { label: 'Debitados', value: countDebitado, sub: 'confirmados', color: 'var(--green)' },
          { label: 'Total debitado ARS', value: fARS(totalDebitado), sub: 'ejecutados', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Grafico */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px', marginBottom: 16 }}>

        {/* Selector vista + nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['semanal','mensual'].map(v => (
              <button key={v} onClick={() => { setVistaGrafico(v); setSelectedPeriod(null) }}
                style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderColor: vistaGrafico === v ? 'var(--accent)' : 'var(--border)', background: vistaGrafico === v ? 'var(--blue-bg)' : 'var(--bg3)', color: vistaGrafico === v ? 'var(--accent)' : 'var(--text2)' }}>
                {v === 'semanal' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {vistaGrafico === 'semanal' ? (
              <>
                <button onClick={() => { setWeekOffset(w => w - 1); setSelectedPeriod(null) }}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Anterior
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>
                  {fDate(wId)} - {fDate(dom)}
                </div>
                <button onClick={() => { setWeekOffset(w => w + 1); setSelectedPeriod(null) }}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Siguiente
                </button>
                {weekOffset !== 0 && <button onClick={() => { setWeekOffset(0); setSelectedPeriod(null) }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>Hoy</button>}
              </>
            ) : (
              <>
                <button onClick={() => { setMonthOffset(m => m - 1); setSelectedPeriod(null) }}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Anterior
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {nombreMes}
                </div>
                <button onClick={() => { setMonthOffset(m => m + 1); setSelectedPeriod(null) }}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Siguiente
                </button>
                {monthOffset !== 0 && <button onClick={() => { setMonthOffset(0); setSelectedPeriod(null) }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>Hoy</button>}
              </>
            )}
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(TIPO_COLORS).map(([tipo, color]) => (
              <span key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }}></span>
                {tipo}
              </span>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} onClick={handleBarClick} style={{ cursor: 'pointer' }} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={dataKey} tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} width={60} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,124,255,.08)' }} />
            <Bar dataKey="CHQ" fill={TIPO_COLORS.CHQ} radius={[4,4,0,0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={selectedPeriod === (entry.dia||entry.label) ? TIPO_COLORS.CHQ : TIPO_COLORS.CHQ + 'aa'} />
              ))}
            </Bar>
            <Bar dataKey="Echeq" fill={TIPO_COLORS.Echeq} radius={[4,4,0,0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={selectedPeriod === (entry.dia||entry.label) ? TIPO_COLORS.Echeq : TIPO_COLORS.Echeq + 'aa'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle del periodo seleccionado */}
      {selectedPeriod && pagosDelPeriodoSeleccionado.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent)', borderRadius: 'var(--r)', padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>
            Diferidos del {selectedPeriod}
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text2)' }}>
              Total: {fARS(pagosDelPeriodoSeleccionado.reduce((s, p) => s + (p.gastoARS || 0), 0))}
            </span>
          </div>
          <TablaDiferidos pagos={pagosDelPeriodoSeleccionado} onDebitado={marcarDebitado} />
        </div>
      )}

     {/* Filtros */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Todos los diferidos ({filtrados.length})</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          <input placeholder="Buscar proveedor..." value={filt.proveedor} onChange={e => fSet('proveedor', e.target.value)} style={{ minWidth: 160, height: 34, fontSize: 12 }} />
          <input placeholder="Nro. cheque / echeq..." value={filt.nroCheque} onChange={e => fSet('nroCheque', e.target.value)} style={{ minWidth: 160, height: 34, fontSize: 12, fontFamily: 'var(--mono)' }} />
          <select value={filt.obra} onChange={e => fSet('obra', e.target.value)} style={{ minWidth: 160, height: 34, fontSize: 12 }}>
            <option value="">Todas las obras</option>
            {data.obras.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filt.estado} onChange={e => fSet('estado', e.target.value)} style={{ minWidth: 140, height: 34, fontSize: 12 }}>
            <option value="">Todos los estados</option>
            <option>Emitido</option>
            <option>Debitado</option>
          </select>
          <select value={filt.orden} onChange={e => fSet('orden', e.target.value)} style={{ minWidth: 190, height: 34, fontSize: 12 }}>
            <option value="asc">Fecha: mas antiguo primero</option>
            <option value="desc">Fecha: mas reciente primero</option>
          </select>
          {Object.values(filt).some(v => v && v !== 'asc') && (
            <button onClick={() => setFilt({ obra: '', proveedor: '', estado: '', nroCheque: '', orden: 'asc' })}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              X Limpiar
            </button>
          )}
        </div>

        </div>
        <TablaDiferidos pagos={filtrados} onDebitado={marcarDebitado} />
      </div>
  )
}

function TablaDiferidos({ pagos, onDebitado }) {
  if (!pagos.length) return (
    <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text3)' }}>Sin diferidos en este periodo</div>
  )
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr style={{ background: '#0d1520' }}>
            {['Tipo','Estado','Nro. Cheque','Proveedor','Obra','Concepto','Fecha carga','Fecha R / Vcto','Monto ARS','Monto USD','Accion'].map(h => (
              <th key={h} style={{ padding: '8px 10px', fontSize: 10, color: '#a0b0cc', textTransform: 'uppercase', letterSpacing: '.7px', fontWeight: 800, borderBottom: '2px solid var(--border2)', textAlign: h.includes('Monto') ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagos.map(p => {
            const vencido = p.fechaPago && p.fechaPago < d2s(new Date()) && p.estado === 'Emitido'
            return (
              <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,124,255,.06)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.tipoPago === 'CHQ' ? 'var(--yellow-bg)' : 'var(--purple-bg)', color: p.tipoPago === 'CHQ' ? 'var(--yellow)' : 'var(--purple)', border: '1px solid', borderColor: p.tipoPago === 'CHQ' ? 'var(--yellow-border)' : '#4c1d95' }}>
                    {p.tipoPago}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.estado === 'Debitado' ? 'var(--green-bg)' : vencido ? 'var(--red-bg)' : 'var(--yellow-bg)', color: p.estado === 'Debitado' ? 'var(--green)' : vencido ? 'var(--red)' : 'var(--yellow)', border: '1px solid', borderColor: p.estado === 'Debitado' ? 'var(--green-border)' : vencido ? 'var(--red-border)' : 'var(--yellow-border)' }}>
                    {vencido && p.estado === 'Emitido' ? 'VENCIDO' : p.estado}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{p.nroComprobante || '--'}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.proveedor}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: '#7dd3fc' }}>{p.obra}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11 }}>{p.concepto}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fDate(p.fechaCarga)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, whiteSpace: 'nowrap', color: vencido ? 'var(--red)' : 'var(--text)', fontWeight: vencido ? 700 : 400 }}>{fDate(p.fechaPago)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{p.gastoARS ? fARS(p.gastoARS) : '--'}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--green)' }}>{p.gastoUSD ? fUSD(p.gastoUSD) : '--'}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', gap: 4 }}>
  {p.estado === 'Emitido' && (
    <button onClick={() => onDebitado(p.id, 'Debitado')}
      style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)', borderRadius: 'var(--rs)', padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      Marcar debitado
    </button>
  )}
  {p.estado === 'Debitado' && (
    <button onClick={() => onDebitado(p.id, 'Emitido')}
      style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', color: 'var(--yellow)', borderRadius: 'var(--rs)', padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      Revertir
    </button>
  )}
</div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {debitadoModal && (
  <div onClick={e => { if(e.target===e.currentTarget) setDebitadoModal(null) }}
    style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100 }}>
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,width:'100%',maxWidth:400,padding:24 }}>
      <div style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Confirmar debito</div>
      <div style={{ fontSize:12,color:'var(--text2)',marginBottom:12 }}>
        Selecciona la fecha real en que fue debitado el cheque.
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:4,marginBottom:20 }}>
        <label style={{ fontSize:10,color:'var(--text2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px' }}>
          Fecha de debito
        </label>
        <input
          type="date"
          value={debitadoFecha}
          onChange={e => setDebitadoFecha(e.target.value)}
          style={{ width:'100%' }}
        />
      </div>
      <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
        <button onClick={() => setDebitadoModal(null)}
          style={{ background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:'var(--rs)',padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer' }}>
          Cancelar
        </button>
        <button onClick={confirmarDebitado}
          style={{ background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer' }}>
          Confirmar debito
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}