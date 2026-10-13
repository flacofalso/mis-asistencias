// Lee el texto de una solicitud (mail de la plataforma de asistencia, copiado
// o leído por OCR desde una foto) y devuelve los campos que encuentre.

// Cada campo: patrón de la etiqueta (sobre texto en minúsculas y sin tildes).
// El valor es lo que hay entre la etiqueta y la siguiente etiqueta conocida.
// Los patrones toleran errores típicos del OCR ("drección", "fut", "foro").
// El "°" sale de muchas formas ("N*", "NS", "Nº.", "N"): se acepta cualquier
// símbolo corto pegado a la N.
const N = String.raw`n(?:umero|ro\.?|um\.?|\S{0,2})\s*(?:de\s+)?`
const VEH = String.raw`(?:v[a-z]{1,3}iculo\s+)?`
const DIR = String.raw`d[a-z]{0,2}ecci?on\s+(?:de\s+)?`
const PATRONES = [
  ['expediente', N + 'expediente'],
  ['nAsistencia', N + 'asistencia'],
  ['clienteNombre', String.raw`nombre(?:\s+del)?\s+cliente`],
  ['clienteRut', String.raw`[rf]ut`],
  ['clienteFono', String.raw`(?:fo[nr]o|telefono)(?:\s+(?:de\s+)?c[a-z]{4,8})?`],
  ['origen', DIR + 'origen'],
  ['destino', DIR + 'destino'],
  ['distanciaKm', String.raw`distancia(?:\s+a\s+recorrer)?`],
  ['excedente', 'excedente'],
  ['servicio', 'servicio'],
  ['marca', VEH + 'marca'],
  ['modelo', VEH + 'modelo'],
  ['patente', 'patente'],
  ['fechaAsistencia', String.raw`fecha(?:\s+de(?:\s+la)?)?\s+asistencia`],
  ['sponsor', 'sponsor'],
  ['plan', 'plan'],
]

// Al inicio de una línea basta la etiqueta (el OCR suele perder los dos
// puntos); en medio de una línea se exigen los dos puntos.
const ETIQUETAS = PATRONES.map(([campo, p]) => [
  campo,
  new RegExp(String.raw`(?:^[ \t]*(?:${p})\b[ \t]*[:;.,]?|\b(?:${p})[ \t]*[:;])`, 'gm'),
])

// Texto que marca el final de los datos de la solicitud.
const FINALES = [/(?:ocultar|mostrar) texto citado/g, /atentamente/g, /\n\s*\n/g]

const COMPANIAS = [
  'Zurich', 'HDI', 'BCI', 'Mapfre', 'Sura', 'Liberty', 'Chubb', 'Consorcio',
  'Renta Nacional', 'Reale', 'Southbridge', 'FID', 'Bice', 'Falabella', 'Ripley',
]

// Quita tildes sin cambiar el largo del texto, para que los índices coincidan
// con el original.
function normalizar(texto) {
  let out = ''
  for (const c of texto) out += c.normalize('NFD')[0]
  return out.toLowerCase()
}

// Corrige letras que el OCR confunde con números en campos numéricos. Usa
// solo las primeras palabras con dígitos: si el OCR no reconoció la etiqueta
// siguiente, su texto ("Asistencia") no debe sumar dígitos falsos (s -> 5).
function soloDigitos(valor) {
  const mapa = { O: '0', o: '0', D: '0', Q: '0', I: '1', l: '1', '|': '1', S: '5', s: '5', B: '8', Z: '2' }
  const palabras = []
  for (const p of valor.trim().split(/\s+/)) {
    if (/\d/.test(p)) palabras.push(p)
    else if (palabras.length) break
  }
  return palabras.join('').replace(/[OoDQIl|SsBZ]/g, (c) => mapa[c]).replace(/\D/g, '')
}

function limpiar(valor) {
  return valor.replace(/\s+/g, ' ').trim().replace(/^[-–]$/, '')
}

// "09-10-2026 09:52 AM" -> "2026-10-09T09:52"
export function parsearFecha(valor) {
  const m = valor.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\s*(?:(\d{1,2})[:.](\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?)?/i)
  if (!m) return ''
  let [, d, mes, a, h = '0', min = '00', ampm] = m
  if (a.length === 2) a = '20' + a
  // Descarta lecturas imposibles del OCR (año 7207, mes 13…)
  if (a < 2000 || a > 2099 || mes < 1 || mes > 12 || d < 1 || d > 31) return ''
  let hora = parseInt(h, 10)
  if (hora > 23 || min > 59) hora = 0
  if (ampm) {
    const pm = ampm.toLowerCase().startsWith('p')
    if (pm && hora < 12) hora += 12
    if (!pm && hora === 12) hora = 0
  }
  const p = (n) => String(n).padStart(2, '0')
  return `${a}-${p(mes)}-${p(d)}T${p(hora)}:${min}`
}

export function detectarCompania(sponsor) {
  const s = normalizar(sponsor)
  return COMPANIAS.find((c) => s.includes(normalizar(c))) || ''
}

// Líneas tipo "35.000 traslado" que el dueño manda por WhatsApp.
function parsearCobros(texto) {
  const cobros = []
  const re = /(?:^|\n)\s*\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d{4,})\s*\$?\s+([a-záéíóúñ][a-záéíóúñ ]{2,30})/gi
  for (const m of texto.matchAll(re)) {
    const concepto = m[2].trim()
    if (/^total/i.test(concepto)) continue
    const nombre = concepto.charAt(0).toUpperCase() + concepto.slice(1).toLowerCase()
    cobros.push({ concepto: nombre, monto: parseInt(m[1].replace(/[.,]/g, ''), 10) })
  }
  return cobros
}

export function parsearSolicitud(texto) {
  const norm = normalizar(texto)

  const encontrados = []
  for (const [campo, re] of ETIQUETAS) {
    re.lastIndex = 0
    const m = re.exec(norm)
    if (m) encontrados.push({ campo, inicio: m.index, finEtiqueta: m.index + m[0].length })
  }
  encontrados.sort((a, b) => a.inicio - b.inicio)

  const cortes = []
  for (const re of FINALES) {
    re.lastIndex = 0
    for (const m of norm.matchAll(re)) cortes.push(m.index)
  }

  const crudo = {}
  encontrados.forEach((e, i) => {
    const siguiente = encontrados[i + 1]?.inicio ?? texto.length
    const fin = Math.min(siguiente, ...cortes.filter((c) => c > e.finEtiqueta))
    crudo[e.campo] = limpiar(texto.slice(e.finEtiqueta, fin))
  })

  const datos = {}
  for (const [campo, valor] of Object.entries(crudo)) {
    if (!valor) continue
    switch (campo) {
      case 'expediente':
      case 'nAsistencia':
      case 'clienteFono': {
        const n = soloDigitos(valor)
        if (n) datos[campo] = n
        break
      }
      case 'patente':
        datos[campo] = valor.toUpperCase().replace(/[^A-Z0-9]/g, '')
        break
      case 'marca':
      case 'modelo':
      case 'servicio':
        datos[campo] = valor.toUpperCase()
        break
      case 'distanciaKm': {
        // "3.71 Kms." o "3 71 Kms" (el OCR a veces pierde el punto)
        const m = valor.match(/(\d+)(?:[.,\s](\d+))?/)
        if (m) datos[campo] = m[2] ? `${m[1]}.${m[2]}` : m[1]
        break
      }
      case 'fechaAsistencia': {
        const f = parsearFecha(valor)
        if (f) datos[campo] = f
        break
      }
      case 'sponsor':
        datos.sponsor = valor
        datos.compania = detectarCompania(valor) || valor
        break
      default:
        datos[campo] = valor
    }
  }

  // Los cobros se buscan fuera de los datos de la solicitud: si no, el código
  // postal de una dirección ("8150215 Puente Alto") parece un cobro.
  let resto = texto
  encontrados.forEach((e, i) => {
    const fin = encontrados[i + 1]?.inicio ?? Math.min(texto.length, ...cortes.filter((c) => c > e.finEtiqueta))
    resto = resto.slice(0, e.inicio) + ' '.repeat(fin - e.inicio) + resto.slice(fin)
  })
  const cobros = parsearCobros(resto)
  if (cobros.length) datos.cobros = cobros
  if (/\bcustodia\b/.test(norm) && !datos.tipoDestino) datos.tipoDestino = 'Custodia'

  return datos
}
