import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import Dashboard from '../pages/Dashboard'

// Mock de axiosClient (mismo criterio que en Login.test.jsx).
jest.mock('../api/axiosClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}))

const books = [
  {
    _id: 'b1',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    category: 'Novela',
    publishedYear: 1967,
    stock: 3,
  },
  {
    _id: 'b2',
    title: '1984',
    author: 'George Orwell',
    category: 'Ficción',
    publishedYear: 1949,
    stock: 0,
  },
]

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})

describe('Dashboard', () => {
  test('renderiza el título y el catálogo de libros', async () => {
    axiosClient.get.mockImplementation((url) => {
      if (url === '/books') return Promise.resolve({ data: books })
      if (url === '/transactions/me') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })

    renderDashboard()

    expect(
      screen.getByRole('heading', { name: /catálogo de libros/i }),
    ).toBeInTheDocument()

    // El catálogo se carga de forma asíncrona (GET /books).
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument()
    expect(screen.getByText('1984')).toBeInTheDocument()
    expect(axiosClient.get).toHaveBeenCalledWith('/books')
    expect(axiosClient.get).toHaveBeenCalledWith('/transactions/me')
  })

  test('muestra el mensaje de préstamos vacíos cuando no hay activos', async () => {
    axiosClient.get.mockImplementation((url) => {
      if (url === '/books') return Promise.resolve({ data: books })
      if (url === '/transactions/me') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })

    renderDashboard()

    expect(await screen.findByText(/no tienes préstamos activos/i)).toBeInTheDocument()
  })

  test('solicita un préstamo al hacer clic en "Prestar"', async () => {
    axiosClient.get.mockImplementation((url) => {
      if (url === '/books') return Promise.resolve({ data: books })
      if (url === '/transactions/me') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    axiosClient.post.mockResolvedValue({ data: { _id: 't1' } })

    renderDashboard()

    const borrowButtons = await screen.findAllByRole('button', { name: /prestar/i })
    fireEvent.click(borrowButtons[0])

    await waitFor(() =>
      expect(axiosClient.post).toHaveBeenCalledWith('/transactions', { book: 'b1' }),
    )

    // Mensaje de éxito mostrado al usuario.
    expect(await screen.findByText(/préstamo registrado/i)).toBeInTheDocument()
  })

  test('registra una devolución al hacer clic en "Devolver"', async () => {
    const tx = {
      _id: 't1',
      book: { _id: 'b1', title: 'Cien años de soledad' },
    }

    axiosClient.get.mockImplementation((url) => {
      if (url === '/books') return Promise.resolve({ data: books })
      if (url === '/transactions/me') return Promise.resolve({ data: [tx] })
      return Promise.resolve({ data: [] })
    })
    axiosClient.patch.mockResolvedValue({ data: {} })

    renderDashboard()

    // La lista de préstamos activos muestra el libro prestado.
    expect(await screen.findByText(/mis préstamos activos/i)).toBeInTheDocument()

    const returnButton = await screen.findByRole('button', { name: /devolver/i })
    fireEvent.click(returnButton)

    await waitFor(() =>
      expect(axiosClient.patch).toHaveBeenCalledWith('/transactions/t1/return'),
    )

    expect(await screen.findByText(/devolución registrada correctamente/i)).toBeInTheDocument()
  })
})
