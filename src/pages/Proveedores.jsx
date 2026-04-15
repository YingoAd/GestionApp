import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { genId } from '../utils/helpers'

function ProvForm({ init, rubros, onSave, onClose }) {
  const [f, setF] = useState(init)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div onClick={ev => { if (ev.target === ev.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '28px 16px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{init.id ? 'Editar proveedor' : 'Nuevo proveedor'}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 10px', cursor: 'pointer' }}>X</button>
        </div>
        <div style={{ padding: 22, display: 'grid', gap: 12 }}>
          {[
            { k: 'nombre', label: 'Nombre / Alias', placeholder: 'Como lo identificas' },
            { k: 'razonSocial', label: 'Razon Social', placeholder: 'Razon social o CUIT' },
          ].map(({ k, label, placeholder }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</label>
              <input value={f[k] || ''} onChange={ev => set(k, ev.target.value)} placeholder={placeholder} style={{ width: '100%' }} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Rubro al que se dedica</label>
            <select value={f.rubro || ''} onChange={ev => set('rubro', ev.target.value)} style={{ width: '100%' }}>
              <option value="">-- Seleccionar --</option>
              {rubros.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Descripcion</label>
            <textarea value={f.desc || ''} onChange={ev => set('desc', ev.target.value)} placeholder="Telefono, contacto, notas..." style={{ width: '100%', minHeight: 70 }} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onSave(f)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{init.id ? 'Guardar' : 'Agregar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Proveedores() {
  const { data, update } = useStore()
  const [modal, setModal] = useState(null)
  const [q, setQ] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const filtered = useMemo(() => {
    if (!q) return data.proveedores
    const ql = q.toLowerCase()
    return data.proveedores.filter(p => p.nombre.toLowerCase().includes(ql) || (p.razonSocial || '').toLowerCase().includes(ql))
  }, [data.proveedores, q])

  const saveProv = (pv) => {
    update(d => ({
      ...d,
      proveedores: pv.id
        ? d.proveedores.map(p => p.id === pv.id ? pv : p)
        : [{ ...pv, id: genId() }, ...d.proveedores]
    }))
    setModal(null)
  }

  const deleteProv = (id) => {
    update(d => ({ ...d, proveedores: d.proveedores.filter(p => p.id !== id) }))
    setConfirmDel(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          Proveedores <span style={{ color: 'var(--text3)', fontSize: 12 }}>({filtered.length})</span>
        </div>
        <button onClick={() => setModal({ nombre: '', razonSocial: '', rubro: '', desc: '' })}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Nuevo proveedor
        </button>
      </div>

      <input placeholder="Buscar por nombre o razon social..." value={q} onChange={ev => setQ(ev.target.value)} style={{ marginBottom: 16, minWidth: 280 }} />

      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          {q ? 'Sin resultados' : 'No hay proveedores cargados. Agrega el primero.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{p.nombre}</div>
                  {p.razonSocial && p.razonSocial !== p.nombre && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{p.razonSocial}</div>
                  )}
                  {p.rubro && (
                    <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{p.rubro}</span>
                  )}
                  {p.desc && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>{p.desc}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                  <button onClick={() => setModal({ ...p })} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>e</button>
                  <button onClick={() => setConfirmDel(p.id)} style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--rs)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>x</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ProvForm init={modal} rubros={data.rubros} onSave={saveProv} onClose={() => setModal(null)} />}

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Eliminar proveedor</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Esta accion no se puede deshacer.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => deleteProv(confirmDel)} style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--rs)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}