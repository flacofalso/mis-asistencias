import { useRef, useState } from 'react'
import { descargar } from '../lib/excel'
import { Boton, Campo, Seccion } from './ui'

export default function Ajustes({ ajustes, setAjustes, asistencias, setAsistencias, onVolver }) {
  const [aviso, setAviso] = useState('')
  const archivo = useRef(null)
  const set = (campo) => (valor) => setAjustes((a) => ({ ...a, [campo]: valor }))

  const concepto = (i, campo, valor) =>
    setAjustes((a) => ({ ...a, conceptos: a.conceptos.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)) }))

  const respaldar = () => {
    const datos = JSON.stringify({ version: 1, fecha: new Date().toISOString(), ajustes, asistencias }, null, 2)
    descargar(new Blob([datos], { type: 'application/json' }), `respaldo-asistencias-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const restaurar = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const datos = JSON.parse(await f.text())
      if (!Array.isArray(datos.asistencias)) throw new Error('formato no válido')
      // Combina: las del respaldo reemplazan a las que tengan el mismo id.
      const ids = new Set(datos.asistencias.map((a) => a.id))
      setAsistencias((lista) => [...datos.asistencias, ...lista.filter((a) => !ids.has(a.id))])
      if (datos.ajustes) setAjustes(datos.ajustes)
      setAviso(`✓ Se restauraron ${datos.asistencias.length} asistencias.`)
    } catch (err) {
      setAviso('No se pudo leer el respaldo: ' + err.message)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-slate-900 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button onClick={onVolver} className="rounded-full px-3 py-1 text-2xl active:bg-slate-700" aria-label="Volver">
          ←
        </button>
        <h1 className="font-bold">Ajustes</h1>
      </header>

      <div className="space-y-4 p-4">
        <Seccion titulo="Mis datos (aparecen en el Excel)" icono="🪪">
          <Campo etiqueta="Nombre del transportista" valor={ajustes.transportista} onChange={set('transportista')} />
          <Campo etiqueta="Empresa / nombre de fantasía" valor={ajustes.empresa} onChange={set('empresa')} placeholder="Servicios Grúa …" />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="RUT" valor={ajustes.rut} onChange={set('rut')} />
            <Campo etiqueta="Teléfono" tipo="tel" valor={ajustes.telefono} onChange={set('telefono')} />
          </div>
          <Campo etiqueta="Patente de la grúa" valor={ajustes.patenteGrua} onChange={set('patenteGrua')} mayusculas />
        </Seccion>

        <Seccion titulo="Tarifas habituales" icono="💵">
          <p className="text-sm text-slate-500">Aparecen como botones rápidos en “Cobros”. Deja el monto vacío si varía.</p>
          {ajustes.conceptos.map((c, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Campo etiqueta={i === 0 ? 'Concepto' : ''} valor={c.nombre} onChange={(v) => concepto(i, 'nombre', v)} />
              </div>
              <div className="w-32">
                <Campo
                  etiqueta={i === 0 ? 'Monto' : ''}
                  tipo="number"
                  valor={c.monto || ''}
                  onChange={(v) => concepto(i, 'monto', Number(v) || 0)}
                  inputMode="numeric"
                />
              </div>
              <button
                onClick={() => setAjustes((a) => ({ ...a, conceptos: a.conceptos.filter((_, j) => j !== i) }))}
                className="mb-1 rounded-lg p-2 text-red-500 active:bg-red-50"
                aria-label="Quitar"
              >
                ✕
              </button>
            </div>
          ))}
          <Boton
            variante="secundario"
            onClick={() => setAjustes((a) => ({ ...a, conceptos: [...a.conceptos, { nombre: '', monto: 0 }] }))}
          >
            + Agregar concepto
          </Boton>
        </Seccion>

        <Seccion titulo="Respaldo" icono="💾">
          <p className="text-sm text-slate-500">
            Los datos se guardan solo en este teléfono. Descarga un respaldo de vez en cuando (por ejemplo, a fin de mes) y
            guárdalo en Drive o envíatelo por WhatsApp.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Boton variante="oscuro" onClick={respaldar}>Descargar respaldo</Boton>
            <Boton variante="secundario" onClick={() => archivo.current?.click()}>Restaurar</Boton>
          </div>
          <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={restaurar} />
          {aviso && <p className="text-sm text-slate-700">{aviso}</p>}
          <p className="text-xs text-slate-400">{asistencias.length} asistencias guardadas en total.</p>
        </Seccion>
      </div>
    </>
  )
}
