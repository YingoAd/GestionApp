import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pagos from './pages/Pagos'
import Ingresos from './pages/Ingresos'
import Alertas from './pages/Alertas'
import Proveedores from './pages/Proveedores'
import Configuracion from './pages/Configuracion'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f1117',color:'#e8eaf0',fontSize:14}}>
      Cargando...
    </div>
  )

  if (!user) return <Login />

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="ingresos" element={<Ingresos />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

export default App