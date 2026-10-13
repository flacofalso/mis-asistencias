export function Seccion({ titulo, icono, children, accion }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          {icono && <span aria-hidden>{icono}</span>}
          {titulo}
        </h2>
        {accion}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Campo({ etiqueta, valor, onChange, tipo = 'text', placeholder, lista, mayusculas, extra, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{etiqueta}</span>
      <div className="flex gap-2">
        <input
          type={tipo}
          value={valor ?? ''}
          placeholder={placeholder}
          list={lista}
          onChange={(e) => onChange(mayusculas ? e.target.value.toUpperCase() : e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          {...props}
        />
        {extra}
      </div>
    </label>
  )
}

export function AreaTexto({ etiqueta, valor, onChange, filas = 3, placeholder }) {
  return (
    <label className="block">
      {etiqueta && <span className="mb-1 block text-xs font-semibold text-slate-600">{etiqueta}</span>}
      <textarea
        rows={filas}
        value={valor ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
      />
    </label>
  )
}

export function Chip({ activo, onClick, children, color = 'amber' }) {
  const colores = {
    amber: 'bg-amber-500 text-white ring-amber-500',
    emerald: 'bg-emerald-600 text-white ring-emerald-600',
    red: 'bg-red-600 text-white ring-red-600',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition ${
        activo ? colores[color] : 'bg-white text-slate-700 ring-slate-300 active:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export function Boton({ children, onClick, variante = 'primario', className = '', ...props }) {
  const estilos = {
    primario: 'bg-amber-500 text-white active:bg-amber-600 shadow-sm',
    oscuro: 'bg-slate-900 text-white active:bg-slate-700',
    secundario: 'bg-white text-slate-800 ring-1 ring-slate-300 active:bg-slate-100',
    peligro: 'bg-white text-red-600 ring-1 ring-red-200 active:bg-red-50',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition disabled:opacity-50 ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
