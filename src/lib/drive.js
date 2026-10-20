// Guarda el Excel del mes en Google Drive del transportista, convertido a
// Hoja de cálculo de Google para que se pueda ver en el celular sin Excel.
// Usa el permiso "drive.file": la app solo ve los archivos que ella misma creó.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const PERMISO = 'https://www.googleapis.com/auth/drive.file'
const API = 'https://www.googleapis.com/drive/v3'
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3'
const HOJA_GOOGLE = 'application/vnd.google-apps.spreadsheet'
const CARPETA = 'application/vnd.google-apps.folder'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const CLAVE = 'app-seguros:drive'

export const driveDisponible = Boolean(CLIENT_ID)

// Ids de la carpeta y de la hoja de cada mes, para actualizar siempre el mismo archivo.
export function estadoDrive() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || { archivos: {} }
  } catch {
    return { archivos: {} }
  }
}

function guardarEstado(e) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e))
  } catch {
    // Sin almacenamiento: la próxima vez se buscará de nuevo.
  }
}

let gis = null
export function cargarGoogle() {
  if (!driveDisponible) return Promise.resolve()
  gis ??= new Promise((ok, mal) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = ok
    s.onerror = () => {
      gis = null
      mal(new Error('no se pudo conectar con Google (¿sin internet?)'))
    }
    document.head.appendChild(s)
  })
  return gis
}

let token = null // { valor, vence }

// Pide permiso a Google (abre una ventana). Llamar directo desde un toque del
// usuario: si antes hay una espera larga, el navegador puede bloquear la ventana.
export async function obtenerToken() {
  if (token && Date.now() < token.vence) return token.valor
  await cargarGoogle()
  const estado = estadoDrive()
  return new Promise((ok, mal) => {
    const cliente = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: PERMISO,
      callback: (r) => {
        if (r.error) return mal(new Error(r.error_description || r.error))
        token = { valor: r.access_token, vence: Date.now() + (r.expires_in - 60) * 1000 }
        if (!estado.conectado) guardarEstado({ ...estado, conectado: true })
        ok(token.valor)
      },
      error_callback: (e) =>
        mal(new Error(e.type === 'popup_closed' ? 'se cerró la ventana de Google' : 'no se abrió la ventana de Google')),
    })
    cliente.requestAccessToken({ prompt: estado.conectado ? '' : 'consent' })
  })
}

export function desconectarDrive() {
  if (token && window.google) window.google.accounts.oauth2.revoke(token.valor)
  token = null
  localStorage.removeItem(CLAVE)
}

async function pedir(url, opciones = {}) {
  const r = await fetch(url, {
    ...opciones,
    headers: { Authorization: `Bearer ${await obtenerToken()}`, ...opciones.headers },
  })
  if (r.status === 401) token = null
  if (!r.ok) {
    const detalle = await r.json().catch(() => null)
    const error = new Error(detalle?.error?.message || `error ${r.status} de Google Drive`)
    error.status = r.status
    throw error
  }
  return r.status === 204 ? null : r.json()
}

// Devuelve el archivo si todavía existe y no está en la papelera.
async function vigente(id) {
  if (!id) return null
  try {
    const f = await pedir(`${API}/files/${id}?fields=id,trashed,webViewLink`)
    return f.trashed ? null : f
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

async function carpeta(estado) {
  if (await vigente(estado.carpetaId)) return estado.carpetaId
  const c = await pedir(`${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Mis Asistencias', mimeType: CARPETA }),
  })
  estado.carpetaId = c.id
  estado.compartidoCon = '' // carpeta nueva: hay que volver a compartirla
  return c.id
}

function multipart(metadatos, contenido) {
  const limite = 'limite' + Math.random().toString(36).slice(2)
  const cuerpo = new Blob([
    `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadatos)}\r\n`,
    `--${limite}\r\nContent-Type: ${XLSX}\r\n\r\n`,
    contenido,
    `\r\n--${limite}--`,
  ])
  return { body: cuerpo, headers: { 'Content-Type': `multipart/related; boundary=${limite}` } }
}

// Sube (o reemplaza) la hoja del mes. Devuelve el enlace para abrirla.
export async function guardarEnDrive(buffer, nombre, mes, compartirCon = '') {
  const estado = estadoDrive()
  const titulo = nombre.replace(/\.xlsx$/, '')
  const parent = await carpeta(estado)
  const existente = await vigente(estado.archivos[mes])

  const archivo = existente
    ? await pedir(`${SUBIDA}/files/${existente.id}?uploadType=multipart&fields=id,webViewLink`, {
        method: 'PATCH',
        ...multipart({ name: titulo }, buffer),
      })
    : await pedir(`${SUBIDA}/files?uploadType=multipart&fields=id,webViewLink`, {
        method: 'POST',
        ...multipart({ name: titulo, mimeType: HOJA_GOOGLE, parents: [parent] }, buffer),
      })
  estado.archivos[mes] = archivo.id

  // Comparte la carpeta (todos los meses) con otra persona, solo lectura.
  const correo = compartirCon.trim().toLowerCase()
  if (correo && correo !== estado.compartidoCon) {
    await pedir(`${API}/files/${parent}/permissions?sendNotificationEmail=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: correo }),
    })
    estado.compartidoCon = correo
  }

  guardarEstado(estado)
  return archivo.webViewLink
}
