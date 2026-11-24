import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import Login from '../pages/Login'

// Mock de axiosClient: se reemplaza por completo para no ejecutar la instancia
// real (que depende de import.meta.env.VITE_API_URL, resuelto por Vite).
jest.mock('../api/axiosClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}))

// Harness que monta <Login/> dentro de un MemoryRouter con una ruta de destino
// para poder validar la navegación tras un login exitoso.
function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard de prueba</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})

describe('Login', () => {
  test('renderiza el formulario con inputs y botón de envío', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()

    // Los inputs deben iniciar vacíos y ser de los tipos esperados.
    expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute('type', 'password')
  })

  test('muestra un mensaje de error cuando el login falla', async () => {
    axiosClient.post.mockRejectedValue({
      response: { data: { message: 'Credenciales inválidas' } },
    })

    renderLogin()

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'correo@invalido.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'contrasena-incorrecta' },
    })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    // Se espera el role="alert" con el mensaje devuelto por el backend.
    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('Credenciales inválidas')
  })

  test('login exitoso guarda el token y navega al dashboard', async () => {
    axiosClient.post.mockResolvedValue({
      data: {
        token: 'token-de-prueba',
        user: { email: 'correo@valido.com', name: 'Usuario Prueba' },
      },
    })

    renderLogin()

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'correo@valido.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'secreto123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    // Valida que se llamó a POST /auth/login con las credenciales.
    expect(await screen.findByText('Dashboard de prueba')).toBeInTheDocument()
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'correo@valido.com',
      password: 'secreto123',
    })

    // El store (useAuth) persiste el token en localStorage.
    expect(localStorage.getItem('token')).toBe('token-de-prueba')
  })

  test('muestra error si la respuesta no incluye token', async () => {
    axiosClient.post.mockResolvedValue({ data: { user: { email: 'a@b.com' } } })

    renderLogin()

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent(/no se recibió un token/i)
  })
})
