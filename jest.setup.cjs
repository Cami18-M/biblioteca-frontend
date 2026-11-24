// Polyfills para el entorno de pruebas jsdom.
// react-router v7 (y otras dependencias) requieren TextEncoder/TextDecoder,
// que jsdom no expone como globales.
const { TextEncoder, TextDecoder } = require('util')

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder
}
