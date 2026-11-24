import { create } from 'zustand'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialToken = localStorage.getItem(TOKEN_KEY) || null

// Base funcional del store de autenticación.
// Firma esperada: user, token, isAuthenticated, login(userData, token), logout()
const useAuth = create((set) => ({
  user: readUser(),
  token: initialToken,
  isAuthenticated: Boolean(initialToken),

  login: (userData, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    set({ user: userData, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export default useAuth
