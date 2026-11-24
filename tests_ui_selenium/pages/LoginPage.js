import { By, until } from 'selenium-webdriver'

// URL base de la aplicación en desarrollo.
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

// Tiempo de espera explícito (ms). Se usa >= 20 s porque el backend de Render
// puede estar despertando del modo reposo (cold start).
const WAIT_TIMEOUT = 20000

/**
 * Page Object de la pantalla de Login.
 *
 * Encapsula los localizadores y las acciones disponibles sobre la vista
 * `/login`. Siguiendo el patrón Page Object Model, ningún test interactúa
 * directamente con el WebDriver: todo pasa por estos métodos.
 */
export default class LoginPage {
  constructor(driver) {
    this.driver = driver
  }

  // ---- Localizadores (encapsulados) ----
  get emailInput() {
    return this.driver.findElement(By.id('input-email'))
  }

  get passwordInput() {
    return this.driver.findElement(By.id('input-password'))
  }

  get loginButton() {
    return this.driver.findElement(By.id('btn-login'))
  }

  get errorText() {
    return this.driver.findElement(By.id('login-error'))
  }

  // ---- Acciones ----

  /** Abre la página de login y espera a que el formulario esté disponible. */
  async open() {
    await this.driver.get(`${BASE_URL}/login`)
    await this.driver.wait(until.elementLocated(By.id('input-email')), WAIT_TIMEOUT)
    return this
  }

  /** Rellena las credenciales y envía el formulario de login. */
  async login(email, password) {
    await this.emailInput.sendKeys(email)
    await this.passwordInput.sendKeys(password)
    await this.loginButton.click()
    return this
  }

  /** Devuelve el texto del mensaje de error (espera a que aparezca). */
  async getErrorText() {
    const element = await this.driver.wait(
      until.elementLocated(By.id('login-error')),
      WAIT_TIMEOUT,
    )
    return element.getText()
  }
}
