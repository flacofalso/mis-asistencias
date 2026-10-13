const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export const pesos = (n) => clp.format(Number(n) || 0)

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// "2026-10" -> "octubre 2026"
export function nombreMes(ym) {
  const [a, m] = ym.split('-')
  return `${MESES[Number(m) - 1]} ${a}`
}

export function moverMes(ym, delta) {
  const [a, m] = ym.split('-').map(Number)
  const d = new Date(a, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// "2026-10-09T09:52" -> "09-10-2026"
export function fecha(dt) {
  if (!dt) return ''
  const [a, m, d] = dt.slice(0, 10).split('-')
  return `${d}-${m}-${a}`
}

export const hora = (dt) => (dt ? dt.slice(11, 16) : '')

// Minutos entre dos datetime-local, o null.
export function minutosEntre(desde, hasta) {
  if (!desde || !hasta) return null
  const diff = (new Date(hasta) - new Date(desde)) / 60000
  return Number.isFinite(diff) && diff >= 0 ? Math.round(diff) : null
}

export function duracion(min) {
  if (min == null) return ''
  const h = Math.floor(min / 60)
  return h ? `${h} h ${min % 60} min` : `${min} min`
}
