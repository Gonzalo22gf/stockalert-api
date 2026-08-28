// Regla canonica de clasificacion por vencimiento.
// Fuente unica de verdad: la usan alertas.controller.js y snapshot.service.js
// para que el mail de alertas y el dashboard nunca muestren numeros distintos.
// Un producto con vence===false nunca esta vencido ni por vencer.

function estaVencido(producto, hoy = new Date()) {
  if (producto.vence === false) return false;
  return new Date(producto.vencimiento) < hoy;
}

function estaPorVencer(producto, dias = 7, hoy = new Date()) {
  if (producto.vence === false) return false;
  const diff = Math.ceil((new Date(producto.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= dias;
}

module.exports = { estaVencido, estaPorVencer };
