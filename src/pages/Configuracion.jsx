import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function Configuracion() {
  const { data, update } = useStore()
  const [tab, setTab] = useState('alertas')
  const [saved, setSaved] = useState(false)

  const [cfg, setCfg] = useState(data.alertConfig)
  const [obrasTxt, setObrasTxt] = useState(data.obras.join('\n'))
  const [rubros, setRubros] = useState(data.rubros)
  const [newRubro, setNewRubro] = useState('')
  const [conceptos, setConceptos] = useState(data.conceptos)
  const [newConcepto, setNewConcepto] = useState('')
const [cuentas, setCuentas] = useState(data.cuentas || [
  { nombre: "Caja principal", desc: "" },
  { nombre: "Caja obra", desc: "" },
  { nombre: "Banco Nacion Cta.Cte.", desc: "" },
  { nombre: "Banco Galicia Cta.Cte.", desc: "" },
  { nombre: "Banco Santander Cta.Cte.", desc: "" },
  { nombre: "Banco BBVA Cta.Cte.", desc: "" },
  { nombre: "Banco Macro Cta.Cte.", desc: "" },
  { nombre: "Otra cuenta", desc: "" },
])
const [newCuenta, setNewCuenta] = useState({ nombre: '', desc: '' })
  const save = () => {
  update(d => ({
    ...d,
    alertConfig: cfg,
    obras: obrasTxt.split('\n').map(o => o.trim()).filter(Boolean),
    rubros,
    conceptos,
    _configChanged: true,
    _pagoChanged: null,
    _pagoDeleted: null,
    _proveedorChanged: null,
    _proveedorDeleted: null,
    _ingresoChanged: null,
    _ingresoDeleted: null,
  }))
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}

  const addRubro = () => {
    const r = newRubro.trim()
    if (r && !rubros.includes(r)) { setRubros(l => [...l, r].sort()); setNewRubro('') }
  }

  const addConcepto = () => {
    const c = newConcepto.trim()
    if (c && !conceptos.includes(c)) { setConceptos(l => [...l, c]); setNewConcepto('') }
  }

  const addCuenta = () => {
    const c = newCuenta.trim()
    if (c && !cuentas.includes(c)) { setCuentas(l => [...l, c]); setNewCuenta('') }
  }

  const tabs = [
    { id: 'alertas', label: 'Alertas' },
    { id: 'obras', label: 'Obras' },
    { id: 'rubros', label: 'Rubros' },
    { id: 'conceptos', label: 'Conceptos' },
    { id: 'cuentas', label: 'Cuentas/Cajas' },
  ]

  const Label = ({ text }) => (
    <label style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{text}</label>
  )

  const ListEditor = ({ items, onRemove, newVal, setNewVal, onAdd, placeholder }) => (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={newVal}
          onChange={ev => setNewVal(ev.target.value)}
          onKeyDown={ev => ev.key === 'Enter' && onAdd()}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <button onClick={onAdd} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Agregar
        </button>
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{item}</span>
            <button onClick={() => onRemove(i)} style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--rs)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>x</button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Configuracion</div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--rs) var(--rs) 0 0', fontSize: 12, fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer',
              border: 'none', background: 'transparent',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all .15s'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 20, maxWidth: 560 }}>
        {tab === 'alertas' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Parametros de alertas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Label text="Dias de demora para alerta amarilla" />
              <input type="number" min="1" max="60" value={cfg.diasAlertaDemora}
                onChange={ev => setCfg(c => ({ ...c, diasAlertaDemora: parseInt(ev.target.value) || 7 }))}
                style={{ width: '100%' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>El doble de dias = alerta roja</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Label text="Dias previos al vencimiento para alerta Echeq" />
              <input type="number" min="1" max="30" value={cfg.diasAlertaEcheq}
                onChange={ev => setCfg(c => ({ ...c, diasAlertaEcheq: parseInt(ev.target.value) || 5 }))}
                style={{ width: '100%' }} />
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--rs)', padding: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Resumen</div>
              <div style={{ color: 'var(--green)', marginBottom: 4 }}>Verde — menos de {cfg.diasAlertaDemora} dias sin ejecutar</div>
              <div style={{ color: 'var(--yellow)', marginBottom: 4 }}>Amarillo — {cfg.diasAlertaDemora}+ dias, o Echeq a {cfg.diasAlertaEcheq} dias</div>
              <div style={{ color: 'var(--red)' }}>Rojo — {cfg.diasAlertaDemora * 2}+ dias, o Echeq vencido</div>
            </div>
          </div>
        )}

        {tab === 'obras' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Obras / Proyectos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Label text="Una obra por linea" />
              <textarea
                value={obrasTxt}
                onChange={ev => setObrasTxt(ev.target.value)}
                style={{ width: '100%', minHeight: 220, fontFamily: 'var(--mono)', fontSize: 12 }}
              />
            </div>
          </div>
        )}

        {tab === 'rubros' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Rubros ({rubros.length})</div>
            <ListEditor
              items={rubros}
              onRemove={i => setRubros(l => l.filter((_, j) => j !== i))}
              newVal={newRubro}
              setNewVal={setNewRubro}
              onAdd={addRubro}
              placeholder="Nuevo rubro..."
            />
          </div>
        )}

        {tab === 'conceptos' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Conceptos de gastos ({conceptos.length})</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
              Aparecen como lista desplegable al cargar un pago.
            </div>
            <ListEditor
              items={conceptos}
              onRemove={i => setConceptos(l => l.filter((_, j) => j !== i))}
              newVal={newConcepto}
              setNewVal={setNewConcepto}
              onAdd={addConcepto}
              placeholder="Nuevo concepto..."
            />
          </div>
        )}

        {tab === 'cuentas' && (
  <div>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Cuentas / Cajas ({cuentas.length})</div>
    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
      Aparecen como opciones al cargar un pago en el campo Caja/Cuenta.
    </div>
    {/* Agregar nueva */}
    <div style={{ display: 'grid', gap: 8, marginBottom: 14, padding: 12, background: 'var(--bg3)', borderRadius: 'var(--rs)', border: '1px solid var(--border)' }}>
      <input
        value={newCuenta.nombre}
        onChange={e => setNewCuenta(c => ({ ...c, nombre: e.target.value }))}
        placeholder="Nombre de la cuenta / caja..."
        style={{ width: '100%' }}
      />
      <input
        value={newCuenta.desc}
        onChange={e => setNewCuenta(c => ({ ...c, desc: e.target.value }))}
        placeholder="Descripcion (ej: titular, banco, uso)..."
        style={{ width: '100%' }}
      />
      <button
        onClick={addCuenta}
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
        + Agregar
      </button>
    </div>
    {/* Lista */}
    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
      {cuentas.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.nombre}</div>
            {c.desc && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.desc}</div>}
          </div>
          <button
            onClick={() => setCuentas(l => l.filter((_, j) => j !== i))}
            style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--rs)', padding: '3px 8px', fontSize: 11, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
            x
          </button>
        </div>
      ))}
    </div>
  </div>
)}

      <div style={{ marginTop: 18 }}>
        <button onClick={save}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}