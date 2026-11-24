import { By, until } from 'selenium-webdriver'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const WAIT_TIMEOUT = 20000

/**
 * Page Object del Dashboard.
 *
 * Encapsula los localizadores y las acciones sobre el catálogo de libros y
 * los préstamos activos (`/dashboard`).
 */
export default class DashboardPage {
  constructor(driver) {
    this.driver = driver
  }

  // ---- Localizadores (encapsulados) ----
  get title() {
    return this.driver.findElement(By.id('dashboard-title'))
  }

  get statusMessage() {
    return this.driver.findElement(By.id('status-message'))
  }

  // Primer botón de préstamo del catálogo (book.stock > 0).
  get firstBorrowButton() {
    return this.driver.findElement(By.css('.btn-prestar'))
  }

  // Primer botón de devolución de la lista de préstamos activos.
  get firstReturnButton() {
    return this.driver.findElement(By.css('.btn-devolver'))
  }

  get logoutButton() {
    return this.driver.findElement(By.css('.btn-logout'))
  }

  // ---- Acciones ----

  /** Espera a que el dashboard esté cargado (título visible). */
  async waitForLoad() {
    await this.driver.wait(until.elementLocated(By.id('dashboard-title')), WAIT_TIMEOUT)
    return this
  }

  /** Devuelve el texto del título del dashboard. */
  async getTitleText() {
    const element = await this.title
    return element.getText()
  }

  /** Solicita el préstamo del primer libro disponible. */
  async solicitarPrimerLibro() {
    const button = await this.driver.wait(
      until.elementLocated(By.css('.btn-prestar')),
      WAIT_TIMEOUT,
    )
    await this.driver.wait(until.elementIsEnabled(button), WAIT_TIMEOUT)
    await button.click()
    return this
  }

  /** Devuelve el primer préstamo activo de la lista. */
  async devolverPrimerLibro() {
    const button = await this.driver.wait(
      until.elementLocated(By.css('.btn-devolver')),
      WAIT_TIMEOUT,
    )
    await this.driver.wait(until.elementIsEnabled(button), WAIT_TIMEOUT)
    await button.click()
    return this
  }

  /** Cierra sesión desde la barra de navegación. */
  async logout() {
    const button = await this.logoutButton
    await button.click()
    return this
  }

  /** Espera a que la URL actual sea la esperada. */
  async waitForUrl(fragment, timeout = WAIT_TIMEOUT) {
    await this.driver.wait(until.urlContains(fragment), timeout)
    return this
  }
}
