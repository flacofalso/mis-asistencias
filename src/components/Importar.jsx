import { useRef, useState } from 'react'
import { parsearSolicitud } from '../lib/parser'
import { leerTextoDeImagen } from '../lib/ocr'
import { AreaTexto, Boton } from './ui'

const NOMBRES = {
  expediente: 'N° expediente',
  nAsistencia: 'N° asistencia',
  clienteNombre: 'cliente',
  clienteRut: 'RUT',
  clienteFono: 'teléfono',
  origen: 'origen',
  destino: 'destino',
  distanciaKm: 'km',
  servicio: 'servicio',
  marca: 'marca',
  modelo: 'modelo',
  patente: 'patente',
  fechaAsistencia: 'fecha',
  compania: 'compañía',
  plan: 'plan',
  cobros: 'cobros',
  tipoDestino: 'tipo de destino',
}

export default function Importar({ onDatos, onCerrar }) {
  const [texto, setTexto] = useState('')
  const [progreso, setProgreso] = useState(null)
  const [resultado, setResultado] = useState(null)
  const archivo = useRef(null)

  const analizar = (t) => {
    const datos = parsearSolicitud(t)
    const campos = Object.keys(datos).filter((k) => NOMBRES[k])
    setResultado(campos.length ? { ok: true, campos } : { ok: false })
    if (campos.length) onDatos(datos)
  }

  const pegar = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (t) {
        setTexto(t)
        analizar(t)
      }
    } catch {
      setResultado({ ok: false, mensaje: 'No se pudo leer el portapapeles. Mantén presionado el cuadro y elige “Pegar”.' })
    }
  }

  const leerFoto = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setResultado(null)
    setProgreso(0)
    try {
      const t = await leerTextoDeImagen(f, setProgreso)
      setTexto(t)
      analizar(t)
    } catch (err) {
      setResultado({ ok: false, mensaje: 'No se pudo leer la imagen (¿hay internet?). ' + err.message })
    } finally {
      setProgreso(null)
    }
  }

  return (
    <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-900">📋 Cargar desde la solicitud</h2>
        <button onClick={onCerrar} className="px-2 text-slate-500" aria-label="Cerrar">✕</button>
      </div>
      <p className="mb-3 text-sm text-slate-600">
        Sube la captura del correo que llegó por WhatsApp, o copia y pega su texto. Los datos se completan solos y después puedes corregirlos.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Boton onClick={() => archivo.current?.click()} disabled={progreso != null}>
          📷 Desde foto
        </Boton>
        <Boton variante="secundario" onClick={pegar} disabled={progreso != null}>
          📋 Pegar texto
        </Boton>
      </div>
      <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={leerFoto} />

      {progreso != null && (
        <div className="mt-3">
          <p className="mb-1 text-sm text-slate-700">Leyendo imagen… {progreso}%</p>
          <div className="h-2 overflow-hidden rounded-full bg-amber-200">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${progreso}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3">
        <AreaTexto valor={texto} onChange={setTexto} filas={4} placeholder="…o pega aquí el texto de la solicitud o del mensaje (ej: “35.000 traslado”)" />
        {texto && (
          <Boton variante="oscuro" className="mt-2 w-full" onClick={() => analizar(texto)}>
            Leer datos del texto
          </Boton>
        )}
      </div>

      {resultado && (
        <p className={`mt-3 rounded-xl p-3 text-sm ${resultado.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
          {resultado.ok
            ? `✓ Se completaron: ${resultado.campos.map((c) => NOMBRES[c]).join(', ')}. Revisa que estén correctos.`
            : resultado.mensaje || 'No se encontraron datos reconocibles. Puedes llenarlos a mano.'}
        </p>
      )}
    </section>
  )
}
