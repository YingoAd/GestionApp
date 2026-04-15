import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { jwtDecode } from 'jwt-decode'

const EMAILS_AUTORIZADOS = [
  'yingoadministracion@gmail.com',
  'emmanuelmillar.5@gmail.com',
]

export default function Login() {
  const { login } = useAuth()

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential)
    const email = decoded.email

    // ✅ Acá está la validación que faltaba
    if (!EMAILS_AUTORIZADOS.includes(email)) {
      alert(`El email ${email} no tiene acceso autorizado.`)
      return // ⛔ Corta la ejecución, no hace login
    }

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
    // ... tu JSX igual que antes
  )
}