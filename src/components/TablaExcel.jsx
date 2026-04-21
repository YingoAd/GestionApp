import { fDate, fARS, fUSD, getAlert } from '../utils/helpers'
import { useState } from 'react'

function TipoBadge({ tipo }) {
  if (!tipo) return null
  const styles = {
    Efectivo: { bg: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' },
    Transferencia: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)' },
  }
  const s = tipo.startsWith('Echeq')
    ? { bg: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid #4c1d95' }
    : styles[tipo] || { bg: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: s.border, whiteSpace: 'nowrap' }}>
      {tipo}
    </span>
  )
}

function EstadoBtn({ pago, onToggle, cfg }) {
  const [open, setOpen] = useState(false)
  const esDiferido = pago.tipoPago === 'CHQ' || (pago.tipoPago && pago.tipoPago.startsWith('Echeq'))
  
  const estadosDisponibles = esDiferido
  ? ['Pendiente', 'Emitido', 'Debitado']
  : ['Pendiente', 'Pagado']

const colorEstado = {
  Pendiente: { bg: 'var(--bg3)', color: 'var(--text2)', border: 'var(--border2)' },
  Pagado: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
  Emitido: { bg: 'var(--yellow-bg)', color: 'var(--yellow)', border: 'var(--yellow-border)' },
  Debitado: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue-border)' },
}

const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
const estadoVisual = !esDiferido && pago.estado === 'Pendiente' && pago.fechaPago && pago.fechaPago < hoy
  ? 'Arrastre'
  : pago.estado

const colorArrastre = { bg: 'rgba(251,146,60,.15)', color: '#fb923c', border: '#fb923c' }
const colors = estadoVisual === 'Arrastre' ? colorArrastre : (colorEstado[pago.estado] || colorEstado['Pendiente'])

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: colors.border, background: colors.bg, color: colors.color, whiteSpace: 'nowrap' }}>
        {estadoVisual}
        <span style={{ fontSize: 8 }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', padding: '4px 0', minWidth: 120, marginTop: 4 }}>
            {estadosDisponibles.map(e => (
              <button key={e} onClick={() => { onToggle(pago.id, e); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: pago.estado === e ? 'var(--bg3)' : 'transparent', border: 'none', color: colorEstado[e]?.color || 'var(--text)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function TablaExcel({ pagos, cfg, onToggle, onDelete, onEdit, compact, onBulkToggle }) {
  const [seleccionados, setSeleccionados] = useState([])
  const [estadoMasivo, setEstadoMasivo] = useState('')

  if (!pagos.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      Sin pagos en este periodo
    </div>
  )

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleTodos = () => {
    setSeleccionados(prev => prev.length === pagos.length ? [] : pagos.map(p => p.id))
  }

  const aplicarMasivo = () => {
    if (!estadoMasivo || !seleccionados.length) return
    seleccionados.forEach(id => onToggle(id, estadoMasivo))
    setSeleccionados([])
    setEstadoMasivo('')
  }

  const tdStyle = (extra = {}) => ({
    padding: '7px 10px',
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid rgba(46,54,80,.5)',
    fontSize: 12,
    verticalAlign: 'middle',
    ...extra
  })

  return (
    <div>
      {/* Barra de seleccion masiva */}
      {seleccionados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--blue-bg)', border: '1px solid var(--accent)', borderRadius: 'var(--r)', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{seleccionados.length} seleccionados</span>
          <select value={estadoMasivo} onChange={e => setEstadoMasivo(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', minWidth: 140 }}>
            <option value="">Cambiar estado a...</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
            <option value="Emitido">Emitido</option>
            <option value="Debitado">Debitado</option>
          </select>
          <button onClick={aplicarMasivo}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Aplicar
          </button>
          <button onClick={() => setSeleccionados([])}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
          <thead>
            <tr style={{ background: '#0d1520' }}>
              <th style={{ padding: '9px 10px', borderBottom: '2px solid var(--border2)', width: 36 }}>
                <input type="checkbox" checked={seleccionados.length === pagos.length} onChange={toggleTodos}
                  style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
              </th>
              {['Estado','Fecha','Fecha R.','Caja','Obra','Rubro','Concepto','Detalle','Recibo','Proveedor/Cliente','Tipo Pago','Cbante','USD','ARS',''].map(h => (
                <th key={h} style={{ padding: '9px 10px', fontSize: 10, color: '#a0b0cc', textTransform: 'uppercase', letterSpacing: '.7px', fontWeight: 800, borderBottom: '2px solid var(--border2)', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', textAlign: h === 'USD' || h === 'ARS' ? 'right' : 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagos.map(p => {
              const al = getAlert(p, cfg)
              const borderColor = p.estado === 'Pagado' ? 'var(--green)' : al === 'red' ? 'var(--red)' : al === 'yellow' ? 'var(--yellow)' : 'transparent'
              const rowOpacity = p.estado === 'Pagado' ? 0.65 : 1
              const isSelected = seleccionados.includes(p.id)
              return (
                <tr key={p.id} style={{ opacity: rowOpacity, background: isSelected ? 'rgba(79,124,255,.1)' : '' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(79,124,255,.06)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '' }}>
                  <td style={{ ...tdStyle(), textAlign: 'center' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSeleccion(p.id)}
                      style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                  </td>
                  <td style={{ ...tdStyle(), borderLeft: `3px solid ${borderColor}` }}>
                    <EstadoBtn pago={p} onToggle={onToggle} cfg={cfg} />
                  </td>
                  <td style={tdStyle({ whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 11 })}>{fDate(p.fechaCarga)}</td>
                  <td style={tdStyle({ whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 11 })}>{fDate(p.fechaPago)}</td>
                  <td style={tdStyle({ fontSize: 11, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={p.cuenta}>{p.cuenta}</td>
                  <td style={tdStyle({ fontSize: 11, fontWeight: 600, color: '#7dd3fc', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{p.obra}</td>
                  <td style={tdStyle({ fontSize: 11, color: 'var(--text2)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{p.rubro}</td>
                  <td style={tdStyle({ fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{p.concepto}</td>
                  <td style={tdStyle({ color: 'var(--text2)', fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={p.detalle}>{p.detalle || '--'}</td>
                  <td style={tdStyle({ fontSize: 11, color: 'var(--text2)' })}>{p.recibo}</td>
                  <td style={tdStyle({ fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={p.proveedor}>{p.proveedor}</td>
                  <td style={tdStyle()}><TipoBadge tipo={p.tipoPago} /></td>
                  <td style={tdStyle({ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' })}>{p.nroComprobante || '--'}</td>
                  <td style={tdStyle({ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' })}>{fUSD(p.gastoUSD)}</td>
                  <td style={tdStyle({ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, whiteSpace: 'nowrap' })}>{fARS(p.gastoARS)}</td>
                  <td style={tdStyle({ borderRight: 'none' })}>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                      {onEdit && (
                        <button onClick={() => onEdit(p)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>e</button>
                      )}
                    <button onClick={() => onDelete(p.id)} style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--rs)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>x</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}