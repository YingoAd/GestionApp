import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()

  const handleDemo = () => {
    login({
      name: 'Administrador',
      email: 'yingoadministracion@gmail.com',
      avatar: null
    })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 24
    }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>GestPagos</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>Constructora — Sistema de gestión</div>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '32px 40px', width: 340, textAlign: 'center', boxShadow: 'var(--shadow)'
      }}>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
          Ingresá a tu cuenta para continuar
        </div>

        <button
          onClick={handleDemo}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 'var(--rs)',
            background: 'var(--accent)', color: '#fff', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}
        >
          Ingresar como Administrador
        </button>

        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>
          Google Auth se configurará próximamente
        </div>
      </div>
    </div>
  )
}