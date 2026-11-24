import { useCallback, useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import Navbar from '../components/Navbar'

function toList(data, key) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data[key])) return data[key]
  if (data && Array.isArray(data.data)) return data.data
  return []
}

function Dashboard() {
  const [books, setBooks] = useState([])
  const [loans, setLoans] = useState([])
  const [status, setStatus] = useState('')
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loadingLoans, setLoadingLoans] = useState(true)

  const loadBooks = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/books')
      setBooks(toList(data, 'books'))
    } catch {
      setBooks([])
    } finally {
      setLoadingBooks(false)
    }
  }, [])

  const loadLoans = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/transactions/me')
      setLoans(toList(data, 'transactions'))
    } catch {
      setLoans([])
    } finally {
      setLoadingLoans(false)
    }
  }, [])

  useEffect(() => {
    loadBooks()
    loadLoans()
  }, [loadBooks, loadLoans])

  async function handleBorrow(book) {
    setStatus('')
    try {
      await axiosClient.post('/transactions', { book: book._id })
      await Promise.all([loadBooks(), loadLoans()])
      setStatus(`Préstamo registrado: "${book.title}".`)
    } catch (err) {
      setStatus(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'No se pudo realizar el préstamo.',
      )
    }
  }

  async function handleReturn(tx) {
    setStatus('')
    try {
      await axiosClient.patch(`/transactions/${tx._id}/return`)
      await Promise.all([loadBooks(), loadLoans()])
      setStatus('Devolución registrada correctamente.')
    } catch (err) {
      setStatus(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'No se pudo registrar la devolución.',
      )
    }
  }

  function loanTitle(tx) {
    const book = tx?.book
    if (book && typeof book === 'object' && book.title) return book.title
    const id = typeof book === 'string' ? book : book?._id
    const found = books.find((b) => b._id === id)
    return found ? found.title : 'Libro'
  }

  return (
    <>
      <Navbar />

      <main className="dashboard">
        <h1 id="dashboard-title">Catálogo de Libros</h1>
        <p id="status-message" role="status" aria-live="polite">
          {status}
        </p>

        {loadingBooks ? (
          <p>Cargando catálogo…</p>
        ) : (
          <table className="books-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>Año</th>
                <th>Ejemplares</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan="6">No hay libros disponibles.</td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book._id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>{book.publishedYear}</td>
                    <td>{book.stock}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-prestar"
                        disabled={book.stock <= 0}
                        onClick={() => handleBorrow(book)}
                      >
                        Prestar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <section className="loans-section">
          <h2>Mis Préstamos Activos</h2>

          {loadingLoans ? (
            <p>Cargando préstamos…</p>
          ) : loans.length === 0 ? (
            <p>No tienes préstamos activos.</p>
          ) : (
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((tx) => (
                  <tr key={tx._id}>
                    <td>{loanTitle(tx)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-devolver"
                        onClick={() => handleReturn(tx)}
                      >
                        Devolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  )
}

export default Dashboard
