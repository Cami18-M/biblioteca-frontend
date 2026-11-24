import { useNavigate } from 'react-router-dom'
import useAuth from '../store/useAuth'

function Navbar() {
  const user = useAuth((state) => state.user)
  const logout = useAuth((state) => state.logout)
  const navigate = useNavigate()

  const displayName = user?.name || user?.email || ''

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">📚 Biblioteca</span>
      <div className="navbar-user">
        {displayName ? <span className="navbar-name">Hola, {displayName}</span> : null}
        <button type="button" className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

export default Navbar
