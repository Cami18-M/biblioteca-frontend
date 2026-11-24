import { Builder, By, until } from 'selenium-webdriver'
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome.js'
import chromedriver from 'chromedriver'
import LoginPage from './pages/LoginPage.js'
import DashboardPage from './pages/DashboardPage.js'

// ---------------------------------------------------------------------------
// Configuración. Las credenciales válidas del backend de Render se leen de
// variables de entorno para no dejar secretos en el repositorio:
//   E2E_EMAIL     -> correo de un usuario registrado en el backend
//   E2E_PASSWORD  -> contraseña de dicho usuario
//   E2E_BASE_URL  -> URL del frontend (por defecto http://localhost:5173)
// ---------------------------------------------------------------------------
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const EMAIL = process.env.E2E_EMAIL || 'usuario@ejemplo.com'
const PASSWORD = process.env.E2E_PASSWORD || 'password123'

// Esperas explícitas de al menos 20 s: el backend en Render puede tardar en
// despertar del modo reposo (cold start).
const WAIT_TIMEOUT = 20000

if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
  console.warn(
    '[aviso] No se definieron E2E_EMAIL / E2E_PASSWORD. Se usarán credenciales ' +
      'por defecto; si el login exitoso falla, exporta las variables correctas.',
  )
}

// --- Mini runner con aserciones ---
const results = []

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function test(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  \u2713 ${name}`)
  } catch (err) {
    results.push({ name, ok: false, error: err })
    console.error(`  \u2717 ${name}`)
    console.error(`      -> ${err.message}`)
  }
}

async function main() {
  // Comprobación previa: el servidor de desarrollo debe estar levantado.
  try {
    const res = await fetch(BASE_URL)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
  } catch {
    console.error(
      `\n[error] No se pudo contactar con el frontend en ${BASE_URL}.\n` +
        '        Levanta el servidor con: npm run dev\n',
    )
    process.exit(2)
  }

  const options = new Options()
  // Descomenta la siguiente línea para ejecutar en modo headless (CI):
  // options.addArguments('--headless=new')
  const service = new ServiceBuilder(chromedriver.path)

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build()

  const loginPage = new LoginPage(driver)
  const dashboardPage = new DashboardPage(driver)

  console.log('\n=== Suite de regresión E2E (Selenium + POM) ===\n')

  try {
    // (a) Login fallido: debe mostrarse un mensaje de error.
    await test('(a) Login fallido muestra mensaje de error', async () => {
      await loginPage.open()
      await loginPage.login('correo@invalido.com', 'contrasena-incorrecta')
      const error = await loginPage.getErrorText()
      assert(
        error && error.trim().length > 0,
        'No se mostró ningún mensaje de error en el login fallido.',
      )
      console.log(`        mensaje de error: "${error.trim()}"`)
    })

    // (b) Login exitoso contra el backend de Render (POST /auth/login).
    await test('(b) Login exitoso redirige al dashboard', async () => {
      await loginPage.open()
      await loginPage.login(EMAIL, PASSWORD)
      await dashboardPage.waitForLoad()
      await dashboardPage.waitForUrl('/dashboard')
      const title = await dashboardPage.getTitleText()
      assert(title === 'Catálogo de Libros', `Título inesperado: "${title}"`)
    })

    // (c) Catálogo (GET /books), préstamo (POST /transactions) y
    //     devolución (PATCH /transactions/:id/return).
    await test('(c) Catálogo, préstamo y devolución', async () => {
      // Visualización del catálogo.
      const title = await dashboardPage.getTitleText()
      assert(title === 'Catálogo de Libros', `Título inesperado: "${title}"`)

      // Solicitud de préstamo del primer libro.
      await dashboardPage.solicitarPrimerLibro()
      await driver.wait(
        until.elementTextContains(By.id('status-message'), 'Préstamo registrado'),
        WAIT_TIMEOUT,
      )

      // Devolución del primer préstamo activo.
      await dashboardPage.devolverPrimerLibro()
      await driver.wait(
        until.elementTextContains(By.id('status-message'), 'Devolución registrada'),
        WAIT_TIMEOUT,
      )
    })

    // (d) Cierre de sesión y redirección a /login.
    await test('(d) Cierre de sesión redirige a /login', async () => {
      await dashboardPage.logout()
      await dashboardPage.waitForUrl('/login')
      const current = await driver.getCurrentUrl()
      assert(current.includes('/login'), `No redirigió a /login: ${current}`)
    })
  } finally {
    await driver.quit()
  }

  // --- Resumen ---
  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed

  console.log('\n=== Resumen ===')
  console.log(`  Aprobadas: ${passed}`)
  console.log(`  Fallidas : ${failed}`)
  console.log(`  Total    : ${results.length}`)

  process.exitCode = failed === 0 ? 0 : 1
}

main().catch((err) => {
  console.error('\n[error fatal]', err)
  process.exitCode = 1
})
