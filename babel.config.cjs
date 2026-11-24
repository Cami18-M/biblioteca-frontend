// Configuración de Babel para Jest.
// Se usa la extensión .cjs porque el proyecto declara "type": "module" en package.json,
// de modo que Babel pueda leer la configuración como CommonJS sin conflicto.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
}
