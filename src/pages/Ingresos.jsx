import { useState } from 'react'
import { useStore } from '../store/useStore'
import { genId, d2s, getLunes, s2d, fDate, fARS, fUSD } from '../utils/helpers'

const UF_CONDS = ["Vacante","Reservada","Vendida","Canje","Pago de tierra","Desarrollador","Beneficio","Construye al Costo"]
const FORMAS = ["Efectivo en mano","Cheque propio","Transferencia bancaria","Echeq emitido","Otro"]
const CUENTAS = ["Caja principal","Caja obra","Banco Nacion Cta.Cte.","Banco Galicia Cta.Cte.","Banco Santander Cta.Cte.","Otra cuenta"]
const ING_CONC = ["Cuota de venta","Anticipo","Sena","Cuota echeq","Ajuste","Devolucion","Honorarios cobrados","Alquiler","Otro"]

function condColor(c) {
  if (c === 'Vendida') return 'var(--green)'
  if (c === 'Reservada') return 'var(--yellow)'
  if (c === 'Canje') return 'var(--purple)'
  if (c === 'Pago de tierra') return 'var(--orange)'
  if (['Desarrollador','Beneficio','Construye al Costo'].includes(c)) return 'var(--teal)'
  return 'var(--border2)'
}

function condBadgeStyle(c) {
  const m = {
    Vendida: { bg: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' },
    Reservada: { bg: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)' },
    Vacante: { bg: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' },
    Canje: { bg: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid #4c1d95' },
    'Pago de tierra': { bg: 'var(--orange-bg)', color: 'var(--orange)', border: '1px solid var(--orange-border)' },
    Desarrollador: { bg: 'var(--teal-bg)', color: 'var(--teal)', border: '1px solid var(--teal-border)' },
    Beneficio: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)' },
    'Construye al Costo': { bg: 'var(--teal-bg)', color: 'var(--teal)', border: '1px solid var(--teal-border)' },
  }
  return m[c] || m.Vacante
}

function CondBadge({ c }) {
  const s = condBadgeStyle(c)
  return <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, border: s.border, whiteSpace: 'nowrap' }}>{c || 'Vacante'}</span>
}

function UFEditModal({ uf, onSave, onClose }) {
  const [f, setF] = useState({ ...uf })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div onClick={ev => { if (ev.target === ev.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, overflowY: 'auto', padding: '28px 16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Editar {uf.uf}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 10px', cursor: 'pointer' }}>X</button>
        </div>
        <div style={{ padding: 22, display: 'grid', gap: 12 }}>
          {[
            { k: 'condicion', label: 'Condicion', type: 'select', opts: UF_CONDS },
            { k: 'propietario', label: 'Propietario / Asignado', type: 'input', placeholder: 'Nombre del titular' },
            { k: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Observaciones...' },
          ].map(({ k, label, type, opts, placeholder }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</label>
              {type === 'select' && <select value={f[k] || 'Vacante'} onChange={ev => set(k, ev.target.value)} style={{ width: '100%' }}>{opts.map(o => <option key={o}>{o}</option>)}</select>}
              {type === 'input' && <input value={f[k] || ''} onChange={ev => set(k, ev.target.value)} placeholder={placeholder} style={{ width: '100%' }} />}
              {type === 'textarea' && <textarea value={f[k] || ''} onChange={ev => set(k, ev.target.value)} placeholder={placeholder} style={{ width: '100%', minHeight: 60 }} />}
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onSave(f)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

function IngresoForm({ uf, obraNombre, init, onSave, onClose }) {
  const [f, setF] = useState(init)
  const [errs, setErrs] = useState({})
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const validate = () => {
    const e = {}
    if (!f.montoARS && !f.montoUSD) e.monto = 'Ingrese monto ARS o USD'
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const submit = () => {
    if (!validate()) return
    onSave({ ...f, montoARS: f.montoARS ? parseFloat(f.montoARS) : null, montoUSD: f.montoUSD ? parseFloat(f.montoUSD) : null })
  }
  return (
    <div onClick={ev => { if (ev.target === ev.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, overflowY: 'auto', padding: '28px 16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 540, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{init.id ? 'Editar ingreso' : 'Registrar ingreso'}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{obraNombre} - {uf.uf}{uf.propietario ? ' - ' + uf.propietario : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 10px', cursor: 'pointer' }}>X</button>
        </div>
        <div style={{ padding: 22, display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Fecha</label>
              <input type="date" value={f.fecha} onChange={ev => set('fecha', ev.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Concepto</label>
              <select value={f.concepto} onChange={ev => set('concepto', ev.target.value)} style={{ width: '100%' }}>
                {ING_CONC.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Detalle</label>
            <input value={f.detalle || ''} onChange={ev => set('detalle', ev.target.value)} placeholder="Descripcion del cobro" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Monto ARS</label>
              <input type="number" min="0" value={f.montoARS || ''} onChange={ev => set('montoARS', ev.target.value)} placeholder="0" style={{ width: '100%' }} />
              {errs.monto && <span style={{ fontSize: 10, color: 'var(--red)' }}>{errs.monto}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Monto USD</label>
              <input type="number" min="0" step=".01" value={f.montoUSD || ''} onChange={ev => set('montoUSD', ev.target.value)} placeholder="0.00" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Forma de pago</label>
              <select value={f.formaPago} onChange={ev => set('formaPago', ev.target.value)} style={{ width: '100%' }}>
                {FORMAS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Cuenta destino</label>
              <select value={f.cuenta} onChange={ev => set('cuenta', ev.target.value)} style={{ width: '100%' }}>
                {CUENTAS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Observaciones</label>
            <textarea value={f.obs || ''} onChange={ev => set('obs', ev.target.value)} style={{ width: '100%', minHeight: 60 }} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submit} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{init.id ? 'Guardar' : 'Registrar'}</button>
        </div>
      </div>
    </div>
  )
}

function UFDetalle({ uf, obraNombre, ingresos, planPago, onClose, onSaveIngreso, onDeleteIngreso }) {
  const [tab, setTab] = useState('ingresos')
  const [ingModal, setIngModal] = useState(null)
  const ufIngs = ingresos[uf.id] || []
  const totARS = ufIngs.reduce((s, i) => s + (i.montoARS || 0), 0)
  const totUSD = ufIngs.reduce((s, i) => s + (i.montoUSD || 0), 0)
  const emptyIng = () => ({ ufId: uf.id, fecha: d2s(new Date()), concepto: 'Cuota de venta', detalle: '', montoARS: '', montoUSD: '', formaPago: 'Transferencia bancaria', cuenta: CUENTAS[0], obs: '' })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 150, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 860, boxShadow: 'var(--shadow)' }}>
        <div style={{ background: 'var(--bg3)', padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderRadius: '12px 12px 0 0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{uf.uf}</span>
              <CondBadge c={uf.condicion} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              {obraNombre}{uf.propietario ? ' - ' + uf.propietario : ' - Sin propietario'}
            </div>
            {uf.notas && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{uf.notas}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 10px', cursor: 'pointer' }}>X</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Cobrado ARS</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{totARS ? fARS(totARS) : '--'}</div>
          </div>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Cobrado USD</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{totUSD ? fUSD(totUSD) : '--'}</div>
          </div>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Pagos registrados</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{ufIngs.length}</div>
          </div>
        </div>

        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Historial de ingresos</div>
            <button onClick={() => setIngModal(emptyIng())} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Registrar ingreso
            </button>
          </div>
          {!ufIngs.length ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text3)' }}>Sin ingresos registrados</div>
          ) : (
            <div>
              {[...ufIngs].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((ing, i) => (
                <div key={ing.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{fDate(ing.fecha)} - Semana del {fDate(d2s(getLunes(s2d(ing.fecha))))}</div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{ing.concepto}</div>
                    {ing.detalle && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{ing.detalle}</div>}
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{ing.formaPago} - {ing.cuenta}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      {ing.montoARS && <div style={{ fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{fARS(ing.montoARS)}</div>}
                      {ing.montoUSD && <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 11 }}>{fUSD(ing.montoUSD)}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button onClick={() => setIngModal({ ...ing })} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>e</button>
                      <button onClick={() => onDeleteIngreso(uf.id, ing.id)} style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--rs)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>x</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {ingModal && <IngresoForm uf={uf} obraNombre={obraNombre} init={ingModal} onSave={v => { onSaveIngreso(uf.id, v); setIngModal(null) }} onClose={() => setIngModal(null)} />}
    </div>
  )
}

export default function Ingresos() {
  const { data, update } = useStore()
  const [obraId, setObraId] = useState('PELLEGRINI')
  const [torre, setTorre] = useState('OESTE')
  const [selUF, setSelUF] = useState(null)
  const [editUF, setEditUF] = useState(null)

  const obrasUF = data.obrasUF || {}
  const obra = obrasUF[obraId]

  if (!obra) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      No hay obras configuradas
    </div>
  )

  const niveles = obra.torres
    ? (obra.torres.find(t => t.id === torre) || obra.torres[0]).niveles
    : obra.niveles || []
  const obraNombre = obra.nombre + (obra.torres ? ' - ' + (obra.torres.find(t => t.id === torre) || { nombre: '' }).nombre : '')
  const allUFs = niveles.flatMap(n => n.ufs)
  const vendidas = allUFs.filter(u => u.condicion === 'Vendida').length
  const reservadas = allUFs.filter(u => u.condicion === 'Reservada').length
  const totalARS = allUFs.flatMap(u => data.ingresos[u.id] || []).reduce((s, i) => s + (i.montoARS || 0), 0)

  const saveIngreso = (ufId, v) => {
    update(d => {
      const cur = d.ingresos[ufId] || []
      const updated = v.id ? cur.map(i => i.id === v.id ? v : i) : [{ ...v, id: genId() }, ...cur]
      return { ...d, ingresos: { ...d.ingresos, [ufId]: updated } }
    })
  }

  const deleteIngreso = (ufId, id) => {
    update(d => ({ ...d, ingresos: { ...d.ingresos, [ufId]: (d.ingresos[ufId] || []).filter(i => i.id !== id) } }))
  }

  const updateUF = (uf) => {
    update(d => {
      const o = { ...d.obrasUF }
      const ob = o[obraId]
      if (ob.torres) {
        o[obraId] = { ...ob, torres: ob.torres.map(t => t.id === torre ? { ...t, niveles: t.niveles.map(n => ({ ...n, ufs: n.ufs.map(u => u.id === uf.id ? uf : u) })) } : t) }
      } else {
        o[obraId] = { ...ob, niveles: ob.niveles.map(n => ({ ...n, ufs: n.ufs.map(u => u.id === uf.id ? uf : u) })) }
      }
      return { ...d, obrasUF: o }
    })
  }

  return (
    <div>
      {/* Obra tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.values(obrasUF).map(o => (
          <button key={o.id}
            onClick={() => { setObraId(o.id); setSelUF(null); if (o.torres) setTorre(o.torres[0].id) }}
            style={{ padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all .15s', background: obraId === o.id ? 'var(--accent)' : 'var(--bg3)', borderColor: obraId === o.id ? 'var(--accent)' : 'var(--border)', color: obraId === o.id ? '#fff' : 'var(--text2)' }}>
            {o.nombre}
          </button>
        ))}
      </div>

      {/* Torre tabs */}
      {obra.torres && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {obra.torres.map(t => (
            <button key={t.id} onClick={() => { setTorre(t.id); setSelUF(null) }}
              style={{ padding: '6px 14px', borderRadius: 'var(--rs)', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: torre === t.id ? 'var(--accent)' : 'transparent', borderColor: torre === t.id ? 'var(--accent)' : 'var(--border)', color: torre === t.id ? '#fff' : 'var(--text2)' }}>
              {t.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Total UFs', value: allUFs.length, color: 'var(--text)' },
          { label: 'Vendidas', value: vendidas, color: 'var(--green)' },
          { label: 'Reservadas', value: reservadas, color: 'var(--yellow)' },
          { label: 'Cobrado ARS', value: totalARS ? fARS(totalARS) : '--', color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--text3)', alignItems: 'center' }}>
        {[['Vendida','var(--green)'],['Reservada','var(--yellow)'],['Vacante','var(--border2)'],['Canje','var(--purple)'],['Pago de tierra','var(--orange)'],['Desarrollador','var(--teal)']].map(([l,c]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }}></span>{l}
          </span>
        ))}
      </div>

      {/* Niveles */}
      {niveles.map((niv, ni) => (
        <div key={ni} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, padding: '6px 0', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{niv.nombre}</span>
            <span style={{ fontSize: 10, fontWeight: 400 }}>({niv.ufs.length} UFs)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 8 }}>
            {niv.ufs.map(uf => {
              const ufIngs = data.ingresos[uf.id] || []
              const cob = ufIngs.reduce((s, i) => s + (i.montoARS || 0), 0)
              return (
                <div key={uf.id}
                  onClick={() => setSelUF(uf)}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px', cursor: 'pointer', transition: 'all .15s', position: 'relative' }}
                  onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: condColor(uf.condicion) }} />
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{uf.uf}</div>
                  {uf.propietario
                    ? <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={uf.propietario}>{uf.propietario}</div>
                    : <div style={{ fontSize: 10, color: 'var(--text3)' }}>Vacante</div>
                  }
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 6 }}>
                    <CondBadge c={uf.condicion || 'Vacante'} />
                    {ufIngs.length > 0 && <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'var(--teal-bg)', color: 'var(--teal)', border: '1px solid var(--teal-border)' }}>{ufIngs.length} pago{ufIngs.length > 1 ? 's' : ''}</span>}
                  </div>
                  {cob > 0 && <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 5, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fARS(cob)}</div>}
                  <button
                    onClick={ev => { ev.stopPropagation(); setEditUF({ ...uf }) }}
                    style={{ marginTop: 8, fontSize: 10, width: '100%', padding: '4px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', cursor: 'pointer' }}>
                    Editar UF
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {selUF && (
        <UFDetalle
          uf={selUF} obraNombre={obraNombre}
          ingresos={data.ingresos} planPago={data.planPago}
          onClose={() => setSelUF(null)}
          onSaveIngreso={saveIngreso}
          onDeleteIngreso={deleteIngreso}
        />
      )}

      {editUF && (
        <UFEditModal
          uf={editUF}
          onSave={v => { updateUF(v); setEditUF(null) }}
          onClose={() => setEditUF(null)}
        />
      )}
    </div>
  )
}