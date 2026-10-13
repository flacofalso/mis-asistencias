import { useMemo, useState } from 'react'
import { CANALES, ESTADOS, canalDe, mesDe, totalCobros } from '../lib/storage'
import { fecha, hora, moverMes, nombreMes, pesos } from '../lib/formato'
import { compartirODescargar, generarExcel } from '../lib/excel'
import { Boton } from './ui'

export default function Inicio({ asistencias, ajustes, mes, setMes, onNueva, onAbrir, onAjustes, onAyuda }) {
  const [busqueda, setBusqueda] = useState('')
  const [exportando, setExportando] = useState(false)
  const [aviso, setAviso] = useState('')

  const delMes = useMemo(
    () =>
      asistencias
        .filter((a) => mesDe(a) === mes)
        .sort((a, b) => (b.fechaAsistencia || '').localeCompare(a.fechaAsistencia || '')),
    [asistencias, mes],
  )

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return delMes
    return delMes.filter((a) =>
      [a.patente, a.expediente, a.nAsistencia, a.clienteNombre, a.marca, a.modelo, a.origen, a.destino, a.compania, canalDe(a)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [delMes, busqueda])

  const resumen = useMemo(
    () => ({
      total: delMes.reduce((s, a) => s + totalCobros(a), 0),
      completadas: delMes.filter((a) => a.estado === 'completado').length,
      noCompletadas: delMes.filter((a) => a.estado === 'no_completado').length,
      pendientes: delMes.filter((a) => a.estado === 'pendiente').length,
    }),
    [delMes],
  )

  const exportar = async () => {
    setExportando(true)
    setAviso('')
    try {
      const { buffer, nombre } = await generarExcel(delMes, ajustes, mes)
      const r = await compartirODescargar(buffer, nombre)
      if (r === 'descargado') setAviso(`Se descargó "${nombre}"`)
    } catch (e) {
      setAviso('No se pudo generar el Excel: ' + e.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <header className="bg-slate-900 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Mis asistencias</p>
            <h1 className="text-lg font-bold">{ajustes.transportista || 'Transportista'}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onAyuda} className="rounded-full px-3 py-1.5 text-sm font-semibold text-amber-300 ring-1 ring-slate-700 active:bg-slate-700">
              ¿Cómo funciona?
            </button>
            <button onClick={onAjustes} className="rounded-full p-2 text-2xl active:bg-slate-700" aria-label="Ajustes">
              ⚙️
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-800 p-1">
          <button onClick={() => setMes(moverMes(mes, -1))} className="rounded-lg px-4 py-2 text-xl active:bg-slate-700" aria-label="Mes anterior">
            ‹
          </button>
          <span className="font-semibold capitalize">{nombreMes(mes)}</span>
          <button onClick={() => setMes(moverMes(mes, 1))} className="rounded-lg px-4 py-2 text-xl active:bg-slate-700" aria-label="Mes siguiente">
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Asistencias</p>
            <p className="text-2xl font-bold">{delMes.length}</p>
          </div>
          <div className="rounded-xl bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Total del mes</p>
            <p className="text-2xl font-bold text-amber-400">{pesos(resumen.total)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-300">{resumen.completadas} completadas</span>
          <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-red-300">{resumen.noCompletadas} no completadas</span>
          {resumen.pendientes > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-amber-300">{resumen.pendientes} pendientes</span>
          )}
        </div>
      </header>

      <div className="space-y-3 p-4">
        <Boton variante="oscuro" className="w-full py-3" onClick={exportar} disabled={exportando || !delMes.length}>
          {exportando ? 'Generando…' : `📊 Exportar Excel de ${nombreMes(mes)}`}
        </Boton>
        {aviso && <p className="rounded-xl bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-200">{aviso}</p>}

        {delMes.length > 0 && (
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar patente, expediente, cliente…"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        )}

        {!delMes.length && (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <p className="text-4xl">🚛</p>
            <p className="mt-2 font-semibold text-slate-800">Sin asistencias en {nombreMes(mes)}</p>
            <p className="mt-1 text-sm text-slate-500">Toca “Nueva asistencia” cuando te llegue una solicitud.</p>
          </div>
        )}

        <ul className="space-y-3">
          {visibles.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => onAbrir(a.id)}
                className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {fecha(a.fechaAsistencia)} · {hora(a.fechaAsistencia)}
                      {' · '}{CANALES.find((c) => c.id === canalDe(a))?.texto}
                      {a.compania && ` · ${a.compania}`}
                    </p>
                    <p className="mt-0.5 font-bold text-slate-900">
                      <span className="mr-2 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-sm text-white">{a.patente || 'S/P'}</span>
                      {[a.marca, a.modelo].filter(Boolean).join(' ')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADOS[a.estado]?.clase}`}>
                    {ESTADOS[a.estado]?.texto}
                  </span>
                </div>
                {(a.origen || a.destino) && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {a.origen || '—'} <span className="text-amber-600">→</span> {a.tipoDestino ? `${a.tipoDestino}: ` : ''}
                    {a.destino || '—'}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{a.expediente ? `Exp. ${a.expediente}` : ''}</span>
                  <span className="font-bold text-slate-900">{pesos(totalCobros(a))}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-xl bg-gradient-to-t from-slate-100 via-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Boton className="w-full py-3.5 text-lg" onClick={onNueva}>
          + Nueva asistencia
        </Boton>
      </div>
    </>
  )
}
