import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import useAuth from '../store/useAuth'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAuth((state) => state.login)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await axiosClient.post('/auth/login', { email, password })

      const token = data?.token || data?.accessToken || data?.access_token
      if (!token) {
        setError('Respuesta inesperada del servidor: no se recibió un token.')
        return
      }

      let user = data?.user || data?.usuario || null

      // Si el backend solo devuelve el token, obtenemos el usuario con GET /auth/me.
      if (!user) {
        try {
          const { data: meData } = await axiosClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          user = meData?.user || meData?.data || meData
        } catch {
          user = { email }
        }
      }

      login(user, token)
      navigate('/dashboard')
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Credenciales inválidas. Inténtalo de nuevo.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">Iniciar sesión</h1>
        <p className="login-subtitle">Bienvenido a la Biblioteca</p>

        <div className="form-group">
          <label htmlFor="input-email">Correo electrónico</label>
          <input
            id="input-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="input-password">Contraseña</label>
          <input
            id="input-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error ? (
          <p id="login-error" className="login-error" role="alert">
            {error}
          </p>
        ) : null}

        <button id="btn-login" type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

export default Login
