import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import { getAlert } from '../utils/helpers'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◼' },
  { path: '/pagos', label: 'Pagos', icon: '💳' },
  { path: '/alertas', label: 'Alertas', icon: '🔔' },
  { path: '/ingresos', label: 'Ingresos', icon: '💰' },
  { path: '/proveedores', label: 'Proveedores', icon: '🏢' },
  { path: '/configuracion', label: 'Configuracion', icon: '⚙️' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { data } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const alertCount = (data.pagos || []).filter(p =>
    p.estado !== 'Pagado' && ['red','yellow'].includes(getAlert(p, data.alertConfig))
  ).length

  const handleNav = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR — solo desktop */}
      <div style={{
        width: 215, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }} className="sidebar-desktop">
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
                {item.path === '/alertas' && alertCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{alertCount}</span>
                )}
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
          {/* Hamburguesa — solo mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)',
              borderRadius: 'var(--rs)', padding: '6px 10px', fontSize: 16, cursor: 'pointer',
              display: 'none'
            }}>
            ☰
          </button>

          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {navItems.find(n => n.path === location.pathname)?.label || 'GestPagos'}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {alertCount > 0 && (
              <button onClick={() => handleNav('/alertas')}
                style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 'var(--rs)', padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                🔔 {alertCount}
              </button>
            )}
            {location.pathname !== '/ingresos' && (
              <button onClick={() => handleNav('/pagos')}
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + Nuevo pago
              </button>
            )}
          </div>
        </div>

        {/* MENU MOBILE — overlay */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50 }}
          />
        )}
        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
          background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          zIndex: 60, transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s ease', display: 'flex', flexDirection: 'column',
          boxShadow: menuOpen ? 'var(--shadow)' : 'none'
        }} className="mobile-menu">
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>GestPagos</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px' }}>v4 · Constructora</div>
            </div>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--rs)', padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <nav style={{ padding: '10px 6px', flex: 1 }}>
            {navItems.map(item => {
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
                  {item.path === '/alertas' && alertCount > 0 && (
                    <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{alertCount}</span>
                  )}
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

      {/* CSS responsive */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </div>
  )
}