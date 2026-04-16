import { useState } from 'react'
import { useStore } from '../store/useStore'
import { getLunes, addDays, d2s, fDate, fARS } from '../utils/helpers'
import { exportarPagosExcel } from '../utils/exportExcel'

export default function Informes() {
  const { data } = useStore()
  const [modo, setModo] = useState('semana')
  const [weekOffset, setWeekOffset] = useState(0)
  const [obraFilt, setObraFilt] = useState('')
  const [tipoFilt, setTipoFilt] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const lb = addDays(getLunes(), weekOffset * 7)
  const wId = d2s(lb)
  const dom = d2s(addDays(lb, 6))

  const TIPOS = ['Efectivo','Transferencia','Echeq']

  const filtrarPagos = () => {
    let pagos = [...data.pagos]
    if (modo === 'semana') {
      pagos = pagos.filter(p => {
        const fechaRef = p.fechaPago || p.fechaCarga
        const lp = d2s(getLunes(new Date(fechaRef + 'T00:00:00')))
        return lp === wId
      })
    }
    if (modo === 'obra' && obraFilt) {
      pagos = pagos.filter(p => p.obra === obraFilt)
    }
    if (modo === 'tipo' && tipoFilt) {
      pagos = pagos.filter(p => tipoFilt === 'Echeq' ? p.tipoPago?.startsWith('Echeq') : p.tipoPago === tipoFilt)
    }
    if (modo === 'rango') {
      if (fechaDesde) pagos = pagos.filter(p => (p.fechaPago || p.fechaCarga) >= fechaDesde)
      if (fechaHasta) pagos = pagos.filter(p => (p.fechaPago || p.fechaCarga) <= fechaHasta)
    }
    return pagos
  }

  const pagosPreview = filtrarPagos()

  const getSemanaLabel = () => {
    if (modo === 'semana') return 'S-' + wId
    if (modo === 'obra') return obraFilt || 'TODAS'
    if (modo === 'tipo') return tipoFilt || 'TODOS'
    if (modo === 'rango') return (fechaDesde || 'inicio') + '_' + (fechaHasta || 'hoy')
    return 'INFORME'
  }

  const handleExportar = () => {
    const pagos = filtrarPagos()
    if (!pagos.length) { alert('No hay pagos para exportar con los filtros seleccionados.'); return }
    exportarPagosExcel(pagos, getSemanaLabel())
  }

  const totalARS = pagosPreview.reduce((s, p) => s + (p.gastoARS || 0), 0)
  const totalUSD = pagosPreview.reduce((s, p) => s + (p.gastoUSD || 0), 0)
  const pendientes = pagosPreview.filter(p => p.estado === 'Pendiente').length
  const pagados = pagosPreview.filter(p => p.estado === 'Pagado').length

  const Label = ({ text }) => (
    <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>{text}</label>
  )

  const modos = [
    { id: 'semana', label: 'Por semana', icon: '📅' },
    { id: 'obra', label: 'Por obra', icon: '🏗' },
    { id: 'tipo', label: 'Por tipo de pago', icon: '💳' },
    { id: 'rango', label: 'Por rango de fechas', icon: '📆' },
  ]

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Informes y exportacion</div>

      {/* Selector de modo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {modos.map(m => (
          <button key={m.id} onClick={() => setModo(m.id)}
            style={{
              padding: '14px 10px', borderRadius: 'var(--r)', border: '1px solid',
              borderColor: modo === m.id ? 'var(--accent)' : 'var(--border)',
              background: modo === m.id ? 'var(--blue-bg)' : 'var(--bg3)',
              color: modo === m.id ? 'var(--accent)' : 'var(--text2)',
              cursor: 'pointer', fontWeight: 600, fontSize: 12, textAlign: 'center',
              transition: 'all .15s'
            }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
            {m.label}
          </button>
        ))}
      </div>

      {/* Filtros segun modo */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 20, marginBottom: 20 }}>
        
        {modo === 'semana' && (
          <div>
            <Label text="Seleccionar semana" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setWeekOffset(w => w - 1)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Anterior
              </button>
              <div style={{ textAlign: 'center', minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{weekOffset === 0 ? 'Semana actual' : weekOffset > 0 ? '+' + weekOffset + ' sem.' : Math.abs(weekOffset) + ' sem. atras'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{fDate(wId)} - {fDate(dom)}</div>
              </div>
              <button onClick={() => setWeekOffset(w => w + 1)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Siguiente
              </button>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>
                  Hoy
                </button>
              )}
            </div>
          </div>
        )}

        {modo === 'obra' && (
          <div>
            <Label text="Seleccionar obra" />
            <select value={obraFilt} onChange={e => setObraFilt(e.target.value)}
              style={{ width: '100%', maxWidth: 300 }}>
              <option value="">Todas las obras</option>
              {data.obras.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        )}

        {modo === 'tipo' && (
          <div>
            <Label text="Seleccionar tipo de pago" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['', ...TIPOS].map(t => (
                <button key={t} onClick={() => setTipoFilt(t)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, border: '1px solid',
                    borderColor: tipoFilt === t ? 'var(--accent)' : 'var(--border)',
                    background: tipoFilt === t ? 'var(--blue-bg)' : 'var(--bg3)',
                    color: tipoFilt === t ? 'var(--accent)' : 'var(--text2)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>
                  {t || 'Todos'}
                </button>
              ))}
            </div>
          </div>
        )}

        {modo === 'rango' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 400 }}>
            <div>
              <Label text="Desde" />
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <Label text="Hasta" />
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total pagos', value: pagosPreview.length, color: 'var(--text)' },
          { label: 'Pendientes', value: pendientes, color: 'var(--yellow)' },
          { label: 'Pagados', value: pagados, color: 'var(--green)' },
          { label: 'Total ARS', value: fARS(totalARS), color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Boton exportar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={handleExportar}
          style={{
            background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)',
            borderRadius: 'var(--rs)', padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
          Descargar Excel
        </button>
        {totalUSD > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            + {fARS(totalUSD).replace('$','USD ')} en dolares
          </div>
        )}
        {!pagosPreview.length && (
          <div style={{ fontSize: 12, color: 'var(--red)' }}>Sin pagos para exportar</div>
        )}
      </div>
    </div>
  )
}