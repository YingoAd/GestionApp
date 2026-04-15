import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { jwtDecode } from 'jwt-decode'

const EMAILS_AUTORIZADOS = [
  'yingoadministracion@gmail.com',
]

export default function Login() {
  const { login } = useAuth()

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential)
    const email = decoded.email

   const EMAILS_AUTORIZADOS = [
  'yingoadministracion@gmail.com',
  'emmanuelmillar.5@gmail.com',
]

    login({
      name: decoded.name,
      email: decoded.email,
      avatar: decoded.picture,
    })
  }

  const handleError = () => {
    alert('Error al iniciar sesión con Google. Intentá de nuevo.')
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
          Ingresá con tu cuenta de Google
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="filled_black"
            shape="rectangular"
            text="signin_with"
            locale="es"
          />
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>
          Solo emails autorizados pueden acceder
        </div>
      </div>
    </div>
  )
}