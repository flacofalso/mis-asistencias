import { useMemo, useState } from 'react'
import { CANALES, ESTADOS, FORMAS_PAGO, MOTIVOS, TIPOS_DESTINO, ahoraLocal, canalDe, totalCobros } from '../lib/storage'
import { duracion, minutosEntre, pesos } from '../lib/formato'
import Importar from './Importar'
import { AreaTexto, Boton, Campo, Chip, Seccion } from './ui'

const SERVICIOS = ['GRUA', 'RESCATE', 'MECANICO', 'PASO DE CORRIENTE', 'CAMBIO DE NEUMATICO', 'COMBUSTIBLE', 'CERRAJERIA']
const COMPANIAS = ['Zurich', 'HDI', 'BCI', 'Mapfre', 'Sura', 'Liberty', 'Chubb', 'Consorcio', 'Renta Nacional', 'Reale', 'Southbridge', 'FID']

function BotonMapa({ direccion }) {
  if (!direccion) return null
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center rounded-xl bg-slate-100 px-3 text-lg ring-1 ring-slate-300 active:bg-slate-200"
      aria-label="Abrir en mapa"
    >
      📍
    </a>
  )
}

export default function FormAsistencia({ asistencia: a, nueva, ajustes, historial, onCambio, onVolver, onEliminar }) {
  const [verImportar, setVerImportar] = useState(nueva)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const set = (campo) => (valor) => onCambio({ [campo]: valor })

  const marcas = useMemo(() => [...new Set(historial.map((x) => x.marca).filter(Boolean))].sort(), [historial])

  // Si la patente ya fue atendida antes, completa marca y modelo.
  const cambiarPatente = (valor) => {
    const p = valor.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const cambios = { patente: p }
    const previa = p.length >= 6 && historial.find((x) => x.id !== a.id && x.patente === p)
    if (previa) {
      if (!a.marca) cambios.marca = previa.marca
      if (!a.modelo) cambios.modelo = previa.modelo
    }
    onCambio(cambios)
  }

  const importar = (datos) => {
    const { cobros, ...resto } = datos
    const cambios = { ...resto }
    if (cobros?.length) {
      const existentes = new Set(a.cobros.map((c) => c.concepto.toLowerCase()))
      cambios.cobros = [...a.cobros, ...cobros.filter((c) => !existentes.has(c.concepto.toLowerCase()))]
    }
    onCambio(cambios)
  }

  const marcarTermino = () => {
    const cambios = { termino: ahoraLocal() }
    if (a.estado === 'pendiente') cambios.estado = 'completado'
    onCambio(cambios)
  }

  const cobro = (i, campo, valor) =>
    onCambio({ cobros: a.cobros.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)) })
  const agregarCobro = (concepto = '', monto = '') => onCambio({ cobros: [...a.cobros, { concepto, monto }] })
  const quitarCobro = (i) => onCambio({ cobros: a.cobros.filter((_, j) => j !== i) })

  const minutos = minutosEntre(a.fechaAsistencia, a.termino)

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-slate-900 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button onClick={onVolver} className="rounded-full px-3 py-1 text-2xl active:bg-slate-700" aria-label="Volver">
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{a.patente || (nueva ? 'Nueva asistencia' : 'Asistencia')}</p>
          <p className="text-xs text-slate-400">Se guarda automáticamente</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADOS[a.estado]?.clase}`}>{ESTADOS[a.estado]?.texto}</span>
      </header>

      <div className="space-y-4 p-4">
        {verImportar ? (
          <Importar onDatos={importar} onCerrar={() => setVerImportar(false)} />
        ) : (
          <Boton variante="secundario" className="w-full" onClick={() => setVerImportar(true)}>
            📋 Cargar datos desde la solicitud
          </Boton>
        )}

        <Seccion titulo="Solicitud" icono="📄">
          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Canal</span>
            <div className="flex flex-wrap gap-2">
              {CANALES.map((c) => (
                <Chip key={c.id} activo={canalDe(a) === c.id} onClick={() => set('canal')(c.id)}>
                  {c.texto}
                </Chip>
              ))}
            </div>
          </div>
          <Campo etiqueta="Compañía de seguros" valor={a.compania} onChange={set('compania')} lista="companias" placeholder="Zurich" />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="N° Expediente" valor={a.expediente} onChange={set('expediente')} inputMode="numeric" />
            <Campo etiqueta="N° Asistencia" valor={a.nAsistencia} onChange={set('nAsistencia')} inputMode="numeric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Servicio" valor={a.servicio} onChange={set('servicio')} lista="servicios" mayusculas />
            <Campo etiqueta="Plan" valor={a.plan} onChange={set('plan')} />
          </div>
        </Seccion>

        <Seccion titulo="Vehículo" icono="🚗">
          <Campo etiqueta="Patente" valor={a.patente} onChange={cambiarPatente} placeholder="ABCD12" autoCapitalize="characters" />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Marca" valor={a.marca} onChange={set('marca')} lista="marcas" mayusculas />
            <Campo etiqueta="Modelo" valor={a.modelo} onChange={set('modelo')} mayusculas />
          </div>
        </Seccion>

        <Seccion titulo="Cliente" icono="👤">
          <Campo etiqueta="Nombre" valor={a.clienteNombre} onChange={set('clienteNombre')} />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="RUT" valor={a.clienteRut} onChange={set('clienteRut')} />
            <Campo
              etiqueta="Teléfono"
              tipo="tel"
              valor={a.clienteFono}
              onChange={set('clienteFono')}
              extra={
                a.clienteFono && (
                  <a href={`tel:+${a.clienteFono.replace(/\D/g, '')}`} className="flex items-center rounded-xl bg-emerald-50 px-3 text-lg ring-1 ring-emerald-200" aria-label="Llamar">
                    📞
                  </a>
                )
              }
            />
          </div>
        </Seccion>

        <Seccion titulo="Trayecto" icono="🗺️">
          <Campo etiqueta="Origen" valor={a.origen} onChange={set('origen')} extra={<BotonMapa direccion={a.origen} />} />
          <Campo etiqueta="Destino" valor={a.destino} onChange={set('destino')} extra={<BotonMapa direccion={a.destino} />} />
          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Tipo de destino</span>
            <div className="flex flex-wrap gap-2">
              {TIPOS_DESTINO.map((t) => (
                <Chip key={t} activo={a.tipoDestino === t} onClick={() => set('tipoDestino')(a.tipoDestino === t ? '' : t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <Campo etiqueta="Distancia (km)" tipo="number" valor={a.distanciaKm} onChange={set('distanciaKm')} inputMode="decimal" step="0.01" />
        </Seccion>

        <Seccion titulo="Horarios" icono="⏱️">
          <Campo etiqueta="Asignación" tipo="datetime-local" valor={a.fechaAsistencia} onChange={set('fechaAsistencia')} />
          <Campo
            etiqueta="Llegada al lugar"
            tipo="datetime-local"
            valor={a.llegada}
            onChange={set('llegada')}
            extra={<Boton variante="secundario" onClick={() => set('llegada')(ahoraLocal())}>Ahora</Boton>}
          />
          <Campo
            etiqueta="Término"
            tipo="datetime-local"
            valor={a.termino}
            onChange={set('termino')}
            extra={<Boton variante="secundario" onClick={marcarTermino}>Ahora</Boton>}
          />
          {minutos != null && <p className="text-sm text-slate-600">Duración total: <b>{duracion(minutos)}</b></p>}
        </Seccion>

        <Seccion titulo="Resultado" icono="✅">
          <div className="flex flex-wrap gap-2">
            <Chip activo={a.estado === 'pendiente'} onClick={() => set('estado')('pendiente')}>Pendiente</Chip>
            <Chip color="emerald" activo={a.estado === 'completado'} onClick={() => set('estado')('completado')}>Completado</Chip>
            <Chip color="red" activo={a.estado === 'no_completado'} onClick={() => set('estado')('no_completado')}>No completado</Chip>
          </div>
          {a.estado === 'no_completado' && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">¿Por qué no se completó?</span>
              <select
                value={MOTIVOS.includes(a.motivo) ? a.motivo : a.motivo ? 'Otro' : ''}
                onChange={(e) => set('motivo')(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
              >
                <option value="">Selecciona un motivo…</option>
                {MOTIVOS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          )}
          {a.estado === 'no_completado' && a.motivo && (a.motivo === 'Otro' || !MOTIVOS.includes(a.motivo)) && (
            <Campo
              etiqueta="Detalle del motivo"
              valor={a.motivo === 'Otro' ? '' : a.motivo}
              onChange={(v) => set('motivo')(v || 'Otro')}
              autoFocus
            />
          )}
        </Seccion>

        <Seccion titulo="Cobros" icono="💵" accion={<span className="text-lg font-bold text-slate-900">{pesos(totalCobros(a))}</span>}>
          {a.cobros.map((c, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Campo etiqueta={i === 0 ? 'Concepto' : ''} valor={c.concepto} onChange={(v) => cobro(i, 'concepto', v)} lista="conceptos" />
              </div>
              <div className="w-32">
                <Campo etiqueta={i === 0 ? 'Monto' : ''} tipo="number" valor={c.monto} onChange={(v) => cobro(i, 'monto', v)} inputMode="numeric" />
              </div>
              <button onClick={() => quitarCobro(i)} className="mb-1 rounded-lg p-2 text-red-500 active:bg-red-50" aria-label="Quitar cobro">
                ✕
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {ajustes.conceptos.map((c) => (
              <Chip key={c.nombre} onClick={() => agregarCobro(c.nombre, c.monto || '')}>
                + {c.nombre}
                {c.monto ? ` ${pesos(c.monto)}` : ''}
              </Chip>
            ))}
            <Chip onClick={() => agregarCobro()}>+ Otro</Chip>
          </div>
          {canalDe(a) === 'PARTICULAR' && (
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-600">Forma de pago</span>
              <div className="flex flex-wrap gap-2">
                {FORMAS_PAGO.map((f) => (
                  <Chip key={f} activo={a.formaPago === f} onClick={() => set('formaPago')(a.formaPago === f ? '' : f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <Campo etiqueta="Excedente cobrado al cliente (si aplica)" tipo="number" valor={a.excedente} onChange={set('excedente')} inputMode="numeric" />
        </Seccion>

        <Seccion titulo="Observaciones" icono="📝">
          <AreaTexto
            valor={a.observaciones}
            onChange={set('observaciones')}
            placeholder="Ej: Francisco Bulnes, San Ramón, frente al Líder…"
          />
        </Seccion>

        <div className="pt-2">
          {confirmarBorrar ? (
            <div className="flex gap-2">
              <Boton variante="secundario" className="flex-1" onClick={() => setConfirmarBorrar(false)}>Cancelar</Boton>
              <Boton className="flex-1 !bg-red-600" onClick={onEliminar}>Sí, eliminar</Boton>
            </div>
          ) : (
            <Boton variante="peligro" className="w-full" onClick={() => setConfirmarBorrar(true)}>Eliminar asistencia</Boton>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-xl bg-gradient-to-t from-slate-100 via-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Boton className="w-full py-3.5 text-lg" onClick={onVolver}>✓ Listo</Boton>
      </div>

      <datalist id="companias">{COMPANIAS.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="servicios">{SERVICIOS.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="marcas">{marcas.map((c) => <option key={c} value={c} />)}</datalist>
      <datalist id="conceptos">{ajustes.conceptos.map((c) => <option key={c.nombre} value={c.nombre} />)}</datalist>
    </>
  )
}
