import { useStore } from '../store/useStore'
import { getAlert } from '../utils/helpers'
import TablaExcel from '../components/TablaExcel'
import { d2s, getLunes } from '../utils/helpers'

export default function Alertas() {
  const { data, update } = useStore()

  const rojos = data.pagos.filter(p => p.estado !== 'Pagado' && getAlert(p, data.alertConfig) === 'red')
  const amarillos = data.pagos.filter(p => p.estado !== 'Pagado' && getAlert(p, data.alertConfig) === 'yellow')
  const echeqs = data.pagos.filter(p => p.tipoPago && p.tipoPago.startsWith('Echeq') && p.estado !== 'Pagado')

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

  if (!rojos.length && !amarillos.length) return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Panel de alertas</div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Sin alertas activas</div>
        <div style={{ color: 'var(--text3)', marginTop: 4, fontSize: 12 }}>Todos los pagos estan al dia</div>
      </div>
    </div>
  )

  const Section = ({ title, color, pagos }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        {title} ({pagos.length})
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <TablaExcel pagos={pagos} cfg={data.alertConfig} onToggle={toggleEstado} onDelete={deletePago} compact />
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Panel de alertas</div>
      {rojos.length > 0 && <Section title="Vencidos / Atrasados" color="var(--red)" pagos={rojos} />}
      {amarillos.length > 0 && <Section title="Proximos a vencer" color="var(--yellow)" pagos={amarillos} />}
      {echeqs.length > 0 && <Section title="Echeqs pendientes" color="var(--purple)" pagos={echeqs} />}
    </div>
  )
}