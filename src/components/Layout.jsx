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

  const alertCount = (data.pagos || []).filter(p =>
    p.estado !== 'Pagado' && ['red','yellow'].includes(getAlert(p, data.alertConfig))
  ).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: 215, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>GestPagos</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '.8px' }}>v4 · Constructora</div>
        </div>

        <nav style={{ padding: '10px 6px', flex: 1 }}>
          {navItems.map(item => {
            const active = location.pathname === item.path
            const isAlertas = item.path === '/alertas'
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                  borderRadius: 'var(--rs)', cursor: 'pointer', width: '100%', textAlign: 'left',
                  border: 'none', marginBottom: 1, fontSize: 12, fontWeight: 500,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--text2)',
                  transition: 'all .15s'
                }}
              >
                <span style={{ fontSize: 14, width: 16, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
                {isAlertas && alertCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--red)', color: '#fff',
                    borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700
                  }}>{alertCount}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{user?.name}</div>
          <button
            onClick={logout}
            style={{
              fontSize: 11, color: 'var(--text3)', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--rs)',
              padding: '4px 10px', cursor: 'pointer', width: '100%'
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          padding: '0 20px', height: 52, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {navItems.find(n => n.path === location.pathname)?.label || 'GestPagos'}
          </div>
          {location.pathname !== '/ingresos' && (
            <button
              onClick={() => navigate('/pagos')}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 'var(--rs)', padding: '6px 14px', fontSize: 12,
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              + Nuevo pago
            </button>
          )}
        </div>
        <div style={{ padding: 20, flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}