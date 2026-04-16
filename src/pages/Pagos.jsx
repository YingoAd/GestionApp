import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getLunes, d2s, fDate, genId, getAlert } from '../utils/helpers'
import TablaExcel from '../components/TablaExcel'

const TIPOS = ["Efectivo", "Transferencia", "Echeq"]
const ECHEQ_VARS = ["Echeq","Echeq-n1","Echeq-n2","Echeq-n3","Echeq-n4","Echeq-n5","Echeq-n6","Echeq-n7","Echeq-n8","Echeq-n9","Echeq-n10"]
const FORMAS = ["Efectivo en mano","Cheque propio","Cheque tercero","Transferencia bancaria","Echeq emitido","Echeq recibido","Tarjeta"]
const CUENTAS = ["BCOOP-024049/5","BCOOP-013170/4","BCOOP-023030/2","BCOOP-023519/2","BGAL-0376/9","BNACION-427310","BNACION-26157","BPROV-91613/2","CAJA JERE","MARTIN.P-USD"]
const ESTADOS = ["Pendiente","Pagado","Vencido"]
const RECIBOS = ["Factura A","Factura B","Factura C","Recibo","Remito","Otro"]

function emptyPago(obras, rubros) {
  return {
    fechaCarga: d2s(getLunes()),
    fechaPago: '',
    proveedor: '',
    obra: obras[0] || '',
    rubro: rubros[0] || '',
    concepto: '',
    detalle: '',
    recibo: 'Factura A',
    nroComprobante: '',
    tipoPago: 'Transferencia',
    formaPago: 'Transferencia bancaria',
    cuenta: CUENTAS[0],
    gastoARS: '',
    gastoUSD: '',
    estado: 'Pendiente',
    obs: ''
  }
}

function PagoForm({ init, obras, rubros, conceptos, cuentas, proveedores, onSave, onClose }) {  
  const [f, setF] = useState(init)
  const [errs, setErrs] = useState({})
  const [showProv, setShowProv] = useState(false)
  const [provQ, setProvQ] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const fps = useMemo(() => {
    if (!provQ) return proveedores
    const q = provQ.toLowerCase()
    return proveedores.filter(p => p.nombre.toLowerCase().includes(q))
  }, [proveedores, provQ])

  const validate = () => {
    const e = {}
    if (!f.proveedor.trim()) e.proveedor = 'Requerido'
    if (!f.concepto.trim()) e.concepto = 'Requerido'
    if (!f.gastoARS && !f.gastoUSD) e.gastoARS = 'Ingrese ARS o USD'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const submit = () => {
    if (!validate()) return
    onSave({ ...f, gastoARS: f.gastoARS ? parseFloat(f.gastoARS) : null, gastoUSD: f.gastoUSD ? parseFloat(f.gastoUSD) : null })
  }

  const esEcheq = (f.tipoPago || '').startsWith('Echeq')
  const concs = conceptos || []

  const inp = (k, opts = {}) => (
    <input
      style={{ width: '100%', marginTop: errs[k] ? 0 : 0 }}
      className={errs[k] ? 'err' : ''}
      value={f[k] || ''}
      onChange={ev => set(k, ev.target.value)}
      {...opts}
    />
  )

  const sel = (k, options) => (
    <select value={f[k]} onChange={ev => set(k, ev.target.value)} style={{ width: '100%' }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )

  const label = (text, required) => (
    <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
      {text}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
    </label>
  )

  const fg = (children) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
  const err = (k) => errs[k] && <span style={{ fontSize: 10, color: 'var(--red)' }}>{errs[k]}</span>

  return (
    <div
      onClick={ev => { if (ev.target === ev.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '28px 16px' }}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 820, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{init.id ? 'Editar pago' : 'Nuevo pago'}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 10px', cursor: 'pointer' }}>X</button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Fila 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {fg(<>{label('Semana (lunes)')}{inp('fechaCarga', { type: 'date' })}</>)}
              {fg(<>{label('Fecha R./Vcto')}{inp('fechaPago', { type: 'date' })}</>)}
              {fg(<>{label('Obra')}{sel('obra', obras)}</>)}
              {fg(<>{label('Estado')}{sel('estado', ESTADOS)}</>)}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {/* Proveedor */}
            {fg(
              <>
                {label('Proveedor / Cliente', true)}
                <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                  <input value={f.proveedor} onChange={ev => set('proveedor', ev.target.value)} placeholder="Nombre" style={{ flex: 1 }} />
                  <button onClick={() => setShowProv(v => !v)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                    Lista
                  </button>
                  {showProv && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', maxHeight: 200, overflow: 'auto', marginTop: 4 }}>
                      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                        <input placeholder="Buscar..." value={provQ} onChange={ev => setProvQ(ev.target.value)} style={{ width: '100%' }} autoFocus />
                      </div>
                      {fps.map(p => (
                        <div key={p.id} onClick={() => { set('proveedor', p.nombre); setShowProv(false); setProvQ('') }}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg3)'}
                          onMouseLeave={ev => ev.currentTarget.style.background = ''}>
                          <div style={{ fontWeight: 700, fontSize: 12 }}>{p.nombre}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.razonSocial}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {err('proveedor')}
              </>
            )}

            {/* Rubro + Concepto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fg(<>{label('Rubro')}{sel('rubro', rubros)}</>)}
              {fg(
                <>
                  {label('Concepto', true)}
                  <select value={concs.includes(f.concepto) ? f.concepto : ''} onChange={ev => set('concepto', ev.target.value)} style={{ width: '100%' }}>
                    <option value="">-- Seleccionar --</option>
                    {concs.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={f.concepto} onChange={ev => set('concepto', ev.target.value)} placeholder="O escribi aqui" style={{ marginTop: 4 }} />
                  {err('concepto')}
                </>
              )}
            </div>

            {fg(<>{label('Detalle')}{inp('detalle', { placeholder: 'Descripcion especifica' })}</>)}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fg(<>{label('Recibo/Factura')}{sel('recibo', RECIBOS)}</>)}
              {fg(<>{label('Nro. Comprobante')}{inp('nroComprobante', { placeholder: 'FA-A-0000-00000001' })}</>)}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {fg(
                <>
                  {label('Tipo pago')}
                  <select value={f.tipoPago} onChange={ev => {
                    const v = ev.target.value
                    set('tipoPago', v)
                    if (v.startsWith('Echeq')) set('formaPago', 'Echeq emitido')
                    else if (v === 'Transferencia') set('formaPago', 'Transferencia bancaria')
                    else set('formaPago', 'Efectivo en mano')
                  }} style={{ width: '100%' }}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </>
              )}
              {fg(
                <>
                  {label('Variante Echeq')}
                  <select value={esEcheq ? f.tipoPago : 'Echeq'} onChange={ev => set('tipoPago', ev.target.value)} disabled={!esEcheq} style={{ width: '100%', opacity: esEcheq ? 1 : .4 }}>
                    {ECHEQ_VARS.map(v => <option key={v}>{v}</option>)}
                  </select>
                </>
              )}
              {fg(
  <>
    {label('Caja/Cuenta')}
    <select className="fs" value={f.cuenta} onChange={ev=>set('cuenta',ev.target.value)}>
      {(cuentas||CUENTAS).map(c => {
  const nombre = typeof c === 'string' ? c : c.nombre
  const desc = typeof c === 'string' ? '' : c.desc
  return <option key={nombre} value={nombre}>{nombre}{desc ? ` — ${desc}` : ''}</option>
})}
    </select>
  </>
)}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fg(
                <>
                  {label('Gastos ARS')}
                  <input type="number" min="0" value={f.gastoARS || ''} onChange={ev => set('gastoARS', ev.target.value)} placeholder="0" style={{ width: '100%' }} />
                  {err('gastoARS')}
                </>
              )}
              {fg(<>{label('GasUSD')}<input type="number" min="0" step=".01" value={f.gastoUSD || ''} onChange={ev => set('gastoUSD', ev.target.value)} placeholder="0.00" style={{ width: '100%' }} /></>)}
            </div>

            {fg(<>{label('Observaciones')}<textarea value={f.obs || ''} onChange={ev => set('obs', ev.target.value)} style={{ width: '100%', minHeight: 60 }} /></>)}
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submit} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{init.id ? 'Guardar cambios' : 'Registrar pago'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Pagos() {
  const { data, update } = useStore()
  const location = useLocation()
  const [modal, setModal] = useState(null)
  const [filt, setFilt] = useState({ obra: '', rubro: '', tipo: '', estado: '', q: '' })
  const fSet = (k, v) => setFilt(p => ({ ...p, [k]: v }))

  const filtered = useMemo(() => data.pagos.filter(p => {
    if (filt.obra && p.obra !== filt.obra) return false
    if (filt.rubro && p.rubro !== filt.rubro) return false
    if (filt.tipo && !p.tipoPago.startsWith(filt.tipo)) return false
    if (filt.estado && p.estado !== filt.estado) return false
    if (filt.q) {
      const q = filt.q.toLowerCase()
      if (!p.proveedor.toLowerCase().includes(q) && !p.concepto.toLowerCase().includes(q) && !(p.nroComprobante || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [data.pagos, filt])

  const openNew = () => setModal(emptyPago(data.obras, data.rubros))
  const openEdit = (p) => setModal({ ...p })

 const savePago = (fd) => {
  const pagoFinal = fd.id ? fd : { ...fd, id: genId() }
  update(d => ({
    ...d,
    pagos: fd.id
      ? d.pagos.map(p => p.id === fd.id ? pagoFinal : p)
      : [pagoFinal, ...d.pagos],
    _pagoChanged: pagoFinal,
    _pagoDeleted: null,
    _proveedorChanged: null,
    _proveedorDeleted: null,
    _ingresoChanged: null,
    _ingresoDeleted: null,
    _configChanged: null,
  }))
  setModal(null)
}

  const deletePago = (id) => {
  update(d => ({
    ...d,
    pagos: d.pagos.filter(p => p.id !== id),
    _pagoDeleted: id,
    _pagoChanged: null,
    _proveedorChanged: null,
    _proveedorDeleted: null,
    _ingresoChanged: null,
    _ingresoDeleted: null,
    _configChanged: null,
  }))
}

  const toggleEstado = (id, nuevoEstado) => {
  update(d => {
    const pago = d.pagos.find(p => p.id === id)
    const updated = { ...pago, estado: nuevoEstado, fechaPago: nuevoEstado === 'Pagado' && !pago.fechaPago ? d2s(new Date()) : pago.fechaPago }
    return {
      ...d,
      pagos: d.pagos.map(p => p.id === id ? updated : p),
      _pagoChanged: updated,
      _pagoDeleted: null,
      _proveedorChanged: null,
      _proveedorDeleted: null,
      _ingresoChanged: null,
      _ingresoDeleted: null,
      _configChanged: null,
    }
  })
}

  const any = Object.values(filt).some(v => v)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          Todos los pagos <span style={{ color: 'var(--text3)', fontSize: 12 }}>({filtered.length})</span>
        </div>
        <button onClick={openNew} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Nuevo pago
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input placeholder="Buscar proveedor, concepto, cbante..." value={filt.q} onChange={ev => fSet('q', ev.target.value)} style={{ minWidth: 220 }} />
        <select value={filt.obra} onChange={ev => fSet('obra', ev.target.value)} style={{ minWidth: 130 }}>
          <option value="">Todas las obras</option>
          {data.obras.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={filt.tipo} onChange={ev => fSet('tipo', ev.target.value)} style={{ minWidth: 120 }}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filt.estado} onChange={ev => fSet('estado', ev.target.value)} style={{ minWidth: 120 }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filt.rubro} onChange={ev => fSet('rubro', ev.target.value)} style={{ minWidth: 130 }}>
          <option value="">Todos los rubros</option>
          {data.rubros.map(r => <option key={r}>{r}</option>)}
        </select>
        {any && (
          <button onClick={() => setFilt({ obra: '', rubro: '', tipo: '', estado: '', q: '' })} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 'var(--rs)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
            X Limpiar
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <TablaExcel pagos={filtered} cfg={data.alertConfig} onToggle={toggleEstado} onDelete={deletePago} onEdit={openEdit} />
      </div>

     {modal && (
  <PagoForm
    init={modal}
    obras={data.obras}
    rubros={data.rubros}
    conceptos={data.conceptos}
    cuentas={data.cuentas}
    proveedores={data.proveedores}
    onSave={savePago}
    onClose={() => setModal(null)}
  />
)}
    </div>
  )
}