import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import { getAlert, fARS, fDate, d2s, getLunes } from '../utils/helpers'
import { exportarPagosExcel } from '../utils/exportExcel'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◼' },
  { path: '/pagos', label: 'Pagos', icon: '💳' },
  { path: '/ingresos', label: 'Ingresos', icon: '💰' },
  { path: '/proveedores', label: 'Proveedores', icon: '🏢' },
  { path: '/configuracion', label: 'Configuracion', icon: '⚙️' },
]

function AlertasPanel({ pagos, alertConfig, onClose, onToggle }) {
  const rojos = pagos.filter(p => p.estado !== 'Pagado' && getAlert(p, alertConfig) === 'red')
  const amarillos = pagos.filter(p => p.estado !== 'Pagado' && getAlert(p, alertConfig) === 'yellow')
  const echeqs = pagos.filter(p => p.tipoPago && p.tipoPago.startsWith('Echeq') && p.estado !== 'Pagado')

  const AlertItem = ({ p }) => (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.proveedor}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{p.concepto} — {p.obra}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fDate(p.fechaPago)} · {p.tipoPago}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fARS(p.gastoARS)}</div>
        <button
          onClick={() => onToggle(p.id, 'Pagado')}
          style={{ marginTop: 4, background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)', borderRadius: 'var(--rs)', padding: '3px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          Marcar pagado
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, width: 340, maxHeight: '80vh',
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
      boxShadow: 'var(--shadow)', zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Alertas activas</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {!rojos.length && !amarillos.length ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            Sin alertas activas
          </div>
        ) : (
          <>
            {rojos.length > 0 && (
              <>
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.5px', background: 'var(--red-bg)' }}>
                  Vencidos / Atrasados ({rojos.length})
                </div>
                {rojos.map(p => <AlertItem key={p.id} p={p} />)}
              </>
            )}
            {amarillos.length > 0 && (
              <>
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '.5px', background: 'var(--yellow-bg)' }}>
                  Proximos a vencer ({amarillos.length})
                </div>
                {amarillos.map(p => <AlertItem key={p.id} p={p} />)}
              </>
            )}
            {echeqs.length > 0 && (
              <>
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.5px', background: 'var(--purple-bg)' }}>
                  Echeqs pendientes ({echeqs.length})
                </div>
                {echeqs.map(p => <AlertItem key={p.id} p={p} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Layout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

useEffect(() => {
  const handler = () => setIsMobile(window.innerWidth <= 768)
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])
  const { user, logout } = useAuth()
  const { data, update } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertasOpen, setAlertasOpen] = useState(false)

  const alertCount = (data.pagos || []).filter(p =>
    p.estado !== 'Pagado' && ['red','yellow'].includes(getAlert(p, data.alertConfig))
  ).length

  const handleNav = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR desktop */}
      <div style={{
  width: 215, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
  display: isMobile ? 'none' : 'flex', flexDirection: 'column', flexShrink: 0,
  position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
}}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>GestPagos</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '.8px' }}>v4 · Constructora</div>
        </div>
        <nav style={{ padding: '10px 6px', flex: 1 }}>
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <button key={item.path} onClick={() => handleNav(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                  borderRadius: 'var(--rs)', cursor: 'pointer', width: '100%', textAlign: 'left',
                  border: 'none', marginBottom: 1, fontSize: 12, fontWeight: 500,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--text2)', transition: 'all .15s'
                }}>
                <span style={{ fontSize: 14, width: 16, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{user?.name}</div>
          <button onClick={logout} style={{ fontSize: 11, color: 'var(--text3)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '4px 10px', cursor: 'pointer', width: '100%' }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <div style={{
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          padding: '0 16px', height: 52, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hamburguesa mobile */}
            {isMobile && (
  <button onClick={() => setMenuOpen(v => !v)}
    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--rs)', padding: '6px 10px', fontSize: 16, cursor: 'pointer' }}>
    ☰
  </button>
)}
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {navItems.find(n => n.path === location.pathname)?.label || 'GestPagos'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
            {/* Campana alertas */}
            <button
              onClick={() => setAlertasOpen(v => !v)}
              style={{
                position: 'relative', background: alertCount > 0 ? 'var(--red-bg)' : 'var(--bg3)',
                border: `1px solid ${alertCount > 0 ? 'var(--red-border)' : 'var(--border)'}`,
                color: alertCount > 0 ? 'var(--red)' : 'var(--text2)',
                borderRadius: 'var(--rs)', padding: '6px 10px', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
              🔔
              {alertCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700 }}>{alertCount}</span>
              )}
            </button>

            {alertasOpen && (
              <>
                <div onClick={() => setAlertasOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <AlertasPanel
                  pagos={data.pagos || []}
                  alertConfig={data.alertConfig}
                  onClose={() => setAlertasOpen(false)}
                  onToggle={toggleEstado}
                />
              </>
            )}

            {location.pathname !== '/ingresos' && (
              <button onClick={() => handleNav('/pagos')}
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <button
  onClick={() => {
    const semanaLabel = `S${new Date().toLocaleDateString('es-AR').replace(/\//g,'-')}`
    exportarPagosExcel(data.pagos || [], semanaLabel)
  }}
  style={{ background: 'var(--teal-bg)', color: 'var(--teal)', border: '1px solid var(--teal-border)', borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
  Exportar Excel
</button>
                + Nuevo pago
              </button>
            )}
          </div>
        </div>

        {/* MENU MOBILE overlay */}
        {menuOpen && (
          <div onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50 }} />
        )}
        <div className="mobile-menu" style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
          background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          zIndex: 60, transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s ease', display: 'flex', flexDirection: 'column',
          boxShadow: menuOpen ? 'var(--shadow)' : 'none'
        }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>GestPagos</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px' }}>v4 · Constructora</div>
            </div>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <nav style={{ padding: '10px 6px', flex: 1 }}>
            {navItems.map(item => {
              const navItems = [
  { path: '/', label: 'Dashboard', icon: '◼' },
  { path: '/pagos', label: 'Pagos', icon: '💳' },
  { path: '/ingresos', label: 'Ingresos', icon: '💰' },
  { path: '/proveedores', label: 'Proveedores', icon: '🏢' },
  { path: '/informes', label: 'Informes', icon: '📊' },
  { path: '/configuracion', label: 'Configuracion', icon: '⚙️' },
]
              const active = location.pathname === item.path
              return (
                <button key={item.path} onClick={() => handleNav(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
                    borderRadius: 'var(--rs)', cursor: 'pointer', width: '100%', textAlign: 'left',
                    border: 'none', marginBottom: 2, fontSize: 13, fontWeight: 500,
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#fff' : 'var(--text2)'
                  }}>
                  <span style={{ fontSize: 16, width: 20, flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{user?.name}</div>
            <button onClick={logout} style={{ fontSize: 12, color: 'var(--text3)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '6px 12px', cursor: 'pointer', width: '100%' }}>
              Cerrar sesion
            </button>
          </div>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}