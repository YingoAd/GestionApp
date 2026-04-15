import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useAuth } from '../hooks/useAuth'
import { getLunes, addDays, d2s, fDate, fARS, fUSD, getAlert } from '../utils/helpers'
import TablaExcel from '../components/TablaExcel'

export default function Dashboard() {
  const { data, update } = useStore()
  const [weekOffset, setWeekOffset] = useState(0)

  const lb = addDays(getLunes(), weekOffset * 7)
  const wId = d2s(lb)
  const dom = addDays(lb, 6)
  const esHoy = weekOffset === 0

  const ps = data.pagos.filter(p => d2s(getLunes(new Date(p.fechaCarga + 'T00:00:00'))) === wId)
  const arr = weekOffset >= 0
    ? data.pagos.filter(p => d2s(getLunes(new Date(p.fechaCarga + 'T00:00:00'))) < wId && p.estado === 'Pendiente')
    : []

  const tpARS = [...ps, ...arr].filter(p => p.estado === 'Pendiente' && p.gastoARS).reduce((s, p) => s + p.gastoARS, 0)
  const tpgARS = ps.filter(p => p.estado === 'Pagado' && p.gastoARS).reduce((s, p) => s + p.gastoARS, 0)
  const tusd = [...ps, ...arr].filter(p => p.estado === 'Pendiente' && p.gastoUSD).reduce((s, p) => s + p.gastoUSD, 0)
  const alCount = [...ps, ...arr].filter(p => getAlert(p, data.alertConfig) === 'red').length

  const toggleEstado = (id, nuevoEstado) => {
    update(d => ({
      ...d,
      pagos: d.pagos.map(p => p.id === id
        ? { ...p, estado: nuevoEstado, fechaPago: nuevoEstado === 'Pagado' && !p.fechaPago ? d2s(new Date()) : p.fechaPago }
        : p
      )
    }))
  }

  const deletePago = (id) => {
    update(d => ({ ...d, pagos: d.pagos.filter(p => p.id !== id) }))
  }

  return (
    <div>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>
            Anterior
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{esHoy ? 'Semana actual' : weekOffset > 0 ? `+${weekOffset} sem.` : `${Math.abs(weekOffset)} sem. atras`}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fDate(wId)} -- {fDate(d2s(dom))}</div>
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>
            Siguiente
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '5px 12px', fontSize: 12 }}>
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Pendiente semana', value: fARS(tpARS), sub: `${ps.filter(p => p.estado === 'Pendiente').length} pago(s)`, color: 'var(--text)' },
          { label: 'Pagado semana', value: fARS(tpgARS), sub: `${ps.filter(p => p.estado === 'Pagado').length} pago(s)`, color: 'var(--green)' },
          { label: 'USD pendiente', value: tusd > 0 ? fUSD(tusd) : '--', sub: `${arr.length} arrastrado(s)`, color: tusd > 0 ? 'var(--yellow)' : 'var(--text)' },
          { label: 'Alertas', value: alCount, sub: alCount > 0 ? 'Atencion requerida' : 'Todo OK', color: alCount > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Arrastre warning */}
      {arr.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--rs)', border: '1px solid var(--yellow-border)', background: 'var(--yellow-bg)', marginBottom: 16, fontSize: 12 }}>
          <strong>{arr.length} pago(s) arrastrado(s)</strong> de semanas anteriores sin ejecutar
        </div>
      )}

      {/* Tabla semana */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          Pagos de la semana
          <span style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>{ps.length}</span>
        </div>
        <TablaExcel pagos={ps} cfg={data.alertConfig} onToggle={toggleEstado} onDelete={deletePago} />
      </div>

      {/* Arrastre tabla */}
      {arr.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--yellow)' }}>
            Arrastre pendiente
            <span style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px', marginLeft: 8 }}>{arr.length}</span>
          </div>
          <TablaExcel pagos={arr} cfg={data.alertConfig} onToggle={toggleEstado} onDelete={deletePago} />
        </div>
      )}
    </div>
  )
}