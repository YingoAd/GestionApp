import { useStore } from '../store/useStore'
import { getAlert, diasDesde, fARS, fDate } from '../utils/helpers'
import TablaExcel from '../components/TablaExcel'
import { d2s } from '../utils/helpers'

export default function Alertas() {
  const { data, update } = useStore()
  const cfg = data.alertConfig

  // Alertas generales (EFT/TRF/TRJ)
  const rojos = data.pagos.filter(p => p.estado !== 'Pagado' && getAlert(p, cfg) === 'red')
  const amarillos = data.pagos.filter(p => p.estado !== 'Pagado' && getAlert(p, cfg) === 'yellow')

  // Alertas de cheques vencidos sin debitar
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const chequesSinDebitar = data.pagos.filter(p => {
    const esDif = p.tipoPago === 'CHQ' || (p.tipoPago && p.tipoPago.startsWith('Echeq'))
    if (!esDif || p.estado === 'Debitado') return false
    if (!p.fechaPago) return false
    const vcto = new Date(p.fechaPago + 'T00:00:00')
    const diasVencido = Math.floor((hoy - vcto) / 86400000)
    return diasVencido >= (cfg.diasAlertaCheque || 20)
  })

  // Alertas cheques sin numerar
  const chequesSinNumerar = data.pagos.filter(p => {
    const esDif = p.tipoPago === 'CHQ' || (p.tipoPago && p.tipoPago.startsWith('Echeq'))
    if (!esDif || p.estado === 'Debitado') return false
    if (p.nroComprobante && p.nroComprobante.trim() !== '') return false
    return diasDesde(p.fechaCarga) >= (cfg.diasSinNumerar || 5)
  })

  const toggleEstado = (id, nuevoEstado) => {
    update(d => {
      const pago = d.pagos.find(p => p.id === id)
      const updated = { ...pago, estado: nuevoEstado, fechaPago: nuevoEstado === 'Pagado' && !pago.fechaPago ? d2s(new Date()) : pago.fechaPago }
      return {
        ...d,
        pagos: d.pagos.map(p => p.id === id ? updated : p),
        _pagoChanged: updated,
        _pagoDeleted: null, _proveedorChanged: null, _proveedorDeleted: null,
        _ingresoChanged: null, _ingresoDeleted: null, _configChanged: null,
      }
    })
  }

  const deletePago = (id) => {
    update(d => ({ ...d, pagos: d.pagos.filter(p => p.id !== id), _pagoDeleted: id, _pagoChanged: null, _proveedorChanged: null, _proveedorDeleted: null, _ingresoChanged: null, _ingresoDeleted: null, _configChanged: null }))
  }

  const sinAlertas = !rojos.length && !amarillos.length && !chequesSinDebitar.length && !chequesSinNumerar.length

  const Section = ({ title, color, pagos, compact }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        {title} ({pagos.length})
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <TablaExcel pagos={pagos} cfg={cfg} onToggle={toggleEstado} onDelete={deletePago} compact={compact} />
      </div>
    </div>
  )

  const ChequeSinNumerar = ({ pagos }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        Cheques sin numerar ({pagos.length})
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--orange-border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#0d1520' }}>
              {['Tipo','Proveedor','Obra','Concepto','Fecha carga','Dias sin numerar'].map(h => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 10, color: '#a0b0cc', textTransform: 'uppercase', letterSpacing: '.7px', fontWeight: 800, borderBottom: '2px solid var(--border2)', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagos.map(p => (
              <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background='rgba(251,146,60,.06)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ background: 'var(--orange-bg)', color: 'var(--orange)', border: '1px solid var(--orange-border)', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>{p.tipoPago}</span>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 12 }}>{p.proveedor}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: '#7dd3fc' }}>{p.obra}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11 }}>{p.concepto}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)' }}>{fDate(p.fechaCarga)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--orange)' }}>{diasDesde(p.fechaCarga)} dias</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Panel de alertas</div>

      {sinAlertas && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Sin alertas activas</div>
          <div style={{ color: 'var(--text3)', marginTop: 4, fontSize: 12 }}>Todos los pagos estan al dia</div>
        </div>
      )}

      {rojos.length > 0 && <Section title="Vencidos / Atrasados" color="var(--red)" pagos={rojos} compact />}
      {amarillos.length > 0 && <Section title="Proximos a vencer" color="var(--yellow)" pagos={amarillos} compact />}
      {chequesSinDebitar.length > 0 && <Section title={'Cheques/Echeqs vencidos sin debitar (+ ' + (cfg.diasAlertaCheque||20) + ' dias)'} color="var(--purple)" pagos={chequesSinDebitar} compact />}
      {chequesSinNumerar.length > 0 && <ChequeSinNumerar pagos={chequesSinNumerar} />}
    </div>
  )
}