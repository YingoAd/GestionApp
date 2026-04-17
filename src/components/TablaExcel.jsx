import { fDate, fARS, fUSD, getAlert } from '../utils/helpers'

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
  const al = getAlert(pago, cfg)
  const esDiferido = pago.tipoPago === 'CHQ' || (pago.tipoPago && pago.tipoPago.startsWith('Echeq'))

  if (pago.estado === 'Pagado' || pago.estado === 'Emitido') {
    const label = esDiferido ? 'Emitido' : 'Pagado'
    return (
      <button
        onClick={() => onToggle(pago.id, 'Pendiente')}
        style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--green-border)', background: 'var(--green-bg)', color: 'var(--green)', whiteSpace: 'nowrap' }}>
        {label}
      </button>
    )
  }
  if (pago.estado === 'Debitado') {
    return (
      <button
        onClick={() => onToggle(pago.id, 'Pendiente')}
        style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--blue-border)', background: 'var(--blue-bg)', color: 'var(--blue)', whiteSpace: 'nowrap' }}>
        Debitado
      </button>
    )
  }
  if (pago.estado === 'Vencido' || al === 'red') {
    return (
      <button
        onClick={() => onToggle(pago.id, esDiferido ? 'Emitido' : 'Pagado')}
        style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--red-border)', background: 'var(--red-bg)', color: 'var(--red)', whiteSpace: 'nowrap' }}>
        {al === 'red' && pago.estado !== 'Vencido' ? 'Atrasado' : 'Vencido'}
      </button>
    )
  }
  if (al === 'yellow') {
    return (
      <button
        onClick={() => onToggle(pago.id, esDiferido ? 'Emitido' : 'Pagado')}
        style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--yellow-border)', background: 'var(--yellow-bg)', color: 'var(--yellow)', whiteSpace: 'nowrap' }}>
        Proximo
      </button>
    )
  }
  return (
    <button
      onClick={() => onToggle(pago.id, esDiferido ? 'Emitido' : 'Pagado')}
      style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
      Pendiente
    </button>
  )
}

export default function TablaExcel({ pagos, cfg, onToggle, onDelete, onEdit, compact }) {
  if (!pagos.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      Sin pagos en este periodo
    </div>
  )

  const tdStyle = (extra = {}) => ({
    padding: '7px 10px',
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid rgba(46,54,80,.5)',
    fontSize: 12,
    verticalAlign: 'middle',
    ...extra
  })

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
        <thead>
          <tr style={{ background: '#0d1520' }}>
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
            return (
              <tr key={p.id} style={{ opacity: rowOpacity }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,124,255,.06)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
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
  )
}