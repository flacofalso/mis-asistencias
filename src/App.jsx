import { useState } from 'react'
import Inicio from './components/Inicio'
import FormAsistencia from './components/FormAsistencia'
import Ajustes from './components/Ajustes'
import Ayuda from './components/Ayuda'
import { AJUSTES_INICIALES, ahoraLocal, estaVacia, nuevaAsistencia, useGuardado } from './lib/storage'

export default function App() {
  const [asistencias, setAsistencias] = useGuardado('asistencias', [])
  const [ajustes, setAjustes] = useGuardado('ajustes', AJUSTES_INICIALES)
  const [vista, setVista] = useState({ nombre: 'inicio' })
  const [mes, setMes] = useState(() => ahoraLocal().slice(0, 7))

  const actualizar = (id, cambios) =>
    setAsistencias((lista) => lista.map((a) => (a.id === id ? { ...a, ...cambios } : a)))

  const crear = () => {
    const a = nuevaAsistencia()
    setAsistencias((lista) => [a, ...lista])
    setVista({ nombre: 'form', id: a.id, nueva: true })
  }

  const eliminar = (id) => {
    setAsistencias((lista) => lista.filter((a) => a.id !== id))
    setVista({ nombre: 'inicio' })
  }

  // Al volver, descarta la asistencia nueva si quedó sin datos.
  const volver = () => {
    if (vista.nombre === 'form') {
      const a = asistencias.find((x) => x.id === vista.id)
      if (a && estaVacia(a)) setAsistencias((lista) => lista.filter((x) => x.id !== a.id))
      else if (a?.fechaAsistencia) setMes(a.fechaAsistencia.slice(0, 7))
    }
    setVista({ nombre: 'inicio' })
  }

  const actual = vista.nombre === 'form' ? asistencias.find((a) => a.id === vista.id) : null

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-slate-100 pb-24">
      {vista.nombre === 'form' && actual ? (
        <FormAsistencia
          asistencia={actual}
          nueva={vista.nueva}
          ajustes={ajustes}
          historial={asistencias}
          onCambio={(c) => actualizar(actual.id, c)}
          onVolver={volver}
          onEliminar={() => eliminar(actual.id)}
        />
      ) : vista.nombre === 'ayuda' ? (
        <Ayuda onVolver={() => setVista({ nombre: 'inicio' })} />
      ) : vista.nombre === 'ajustes' ? (
        <Ajustes
          ajustes={ajustes}
          setAjustes={setAjustes}
          asistencias={asistencias}
          setAsistencias={setAsistencias}
          onVolver={() => setVista({ nombre: 'inicio' })}
        />
      ) : (
        <Inicio
          asistencias={asistencias}
          ajustes={ajustes}
          mes={mes}
          setMes={setMes}
          onNueva={crear}
          onAbrir={(id) => setVista({ nombre: 'form', id })}
          onAjustes={() => setVista({ nombre: 'ajustes' })}
          onAyuda={() => setVista({ nombre: 'ayuda' })}
        />
      )}
    </div>
  )
}
