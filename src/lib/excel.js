import { ESTADOS, canalDe, totalCobros } from './storage.js'
import { duracion, fecha, hora, minutosEntre, nombreMes } from './formato.js'

const COLOR_ENCABEZADO = 'FF1E293B'
const FORMATO_PESOS = '"$"#,##0'

function bordeFino(celda) {
  const b = { style: 'thin', color: { argb: 'FFCBD5E1' } }
  celda.border = { top: b, left: b, bottom: b, right: b }
}

// Conceptos usados en el mes, en el orden definido en Ajustes y luego el resto.
function conceptosDelMes(asistencias, conceptosAjustes) {
  const usados = new Set()
  asistencias.forEach((a) => (a.cobros || []).forEach((c) => c.concepto && usados.add(c.concepto)))
  const orden = conceptosAjustes.map((c) => c.nombre).filter((n) => usados.has(n))
  return [...orden, ...[...usados].filter((n) => !orden.includes(n)).sort()]
}

export async function generarExcel(asistencias, ajustes, mes) {
  const { default: ExcelJS } = await import('exceljs')
  const libro = new ExcelJS.Workbook()
  libro.creator = ajustes.transportista || 'App Seguros'
  libro.calcProperties.fullCalcOnLoad = true

  const lista = [...asistencias].sort((a, b) => (a.fechaAsistencia || '').localeCompare(b.fechaAsistencia || ''))
  const conceptos = conceptosDelMes(lista, ajustes.conceptos)

  const columnas = [
    ['N°', 5], ['Fecha', 11], ['Hora asignación', 10], ['Hora llegada', 10], ['Hora término', 10], ['Duración', 11],
    ['Compañía', 12], ['N° Expediente', 13], ['N° Asistencia', 13], ['Servicio', 10], ['Plan', 24],
    ['Cliente', 22], ['Teléfono', 14], ['Patente', 10], ['Marca', 12], ['Modelo', 14],
    ['Origen', 40], ['Destino', 40], ['Tipo destino', 12], ['Km', 7],
    ['Estado', 14], ['Motivo', 26],
    ...conceptos.map((c) => [c, 12]),
    ['Total', 13], ['Excedente', 12], ['Observaciones', 34],
  ]

  agregarPlanilla(libro, lista, ajustes, mes)

  const hoja = libro.addWorksheet('Detalle', {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  columnas.forEach(([, ancho], i) => (hoja.getColumn(i + 1).width = ancho))

  // Encabezado del documento
  hoja.mergeCells(1, 1, 1, 10)
  const titulo = hoja.getCell(1, 1)
  titulo.value = `Informe de asistencias — ${nombreMes(mes)}`
  titulo.font = { size: 15, bold: true }
  const datosTransportista = [
    ajustes.empresa,
    ajustes.transportista && `Transportista: ${ajustes.transportista}`,
    ajustes.rut && `RUT: ${ajustes.rut}`,
    ajustes.patenteGrua && `Grúa: ${ajustes.patenteGrua}`,
    ajustes.telefono && `Fono: ${ajustes.telefono}`,
  ].filter(Boolean).join('   ·   ')
  hoja.mergeCells(2, 1, 2, 10)
  hoja.getCell(2, 1).value = datosTransportista
  hoja.getCell(2, 1).font = { color: { argb: 'FF475569' } }
  hoja.mergeCells(3, 1, 3, 10)
  hoja.getCell(3, 1).value = `${lista.length} asistencias · generado el ${new Date().toLocaleDateString('es-CL')}`
  hoja.getCell(3, 1).font = { color: { argb: 'FF475569' }, italic: true }

  const filaEnc = hoja.getRow(5)
  columnas.forEach(([nombre], i) => {
    const c = filaEnc.getCell(i + 1)
    c.value = nombre
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } }
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    bordeFino(c)
  })
  filaEnc.height = 30
  hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columnas.length } }

  const colTotal = 23 + conceptos.length
  lista.forEach((a, i) => {
    const montos = conceptos.map((c) =>
      (a.cobros || []).filter((x) => x.concepto === c).reduce((s, x) => s + (Number(x.monto) || 0), 0) || null,
    )
    const fila = hoja.addRow([
      i + 1,
      fecha(a.fechaAsistencia),
      hora(a.fechaAsistencia),
      hora(a.llegada),
      hora(a.termino),
      duracion(minutosEntre(a.fechaAsistencia, a.termino)),
      a.compania,
      a.expediente,
      a.nAsistencia,
      a.servicio,
      a.plan,
      a.clienteNombre,
      a.clienteFono,
      a.patente,
      a.marca,
      a.modelo,
      a.origen,
      a.destino,
      a.tipoDestino,
      a.distanciaKm ? Number(a.distanciaKm) : null,
      ESTADOS[a.estado]?.texto ?? a.estado,
      a.estado === 'no_completado' ? a.motivo : '',
      ...montos,
      totalCobros(a),
      a.excedente ? Number(a.excedente) : null,
      a.observaciones,
    ])
    fila.eachCell({ includeEmpty: true }, (c, n) => {
      bordeFino(c)
      c.alignment = { vertical: 'top', wrapText: n === 17 || n === 18 || n === columnas.length }
      if (n >= 23 && n <= colTotal + 1) c.numFmt = FORMATO_PESOS
    })
    fila.getCell(colTotal).font = { bold: true }
    const color = { completado: 'FFD1FAE5', no_completado: 'FFFEE2E2', pendiente: 'FFFEF3C7' }[a.estado]
    if (color) fila.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
  })

  // Fila de totales con fórmulas, para que el Excel siga cuadrando si lo editan
  if (lista.length) {
    const desde = 6
    const hasta = 5 + lista.length
    const filaTot = hoja.addRow([])
    filaTot.getCell(1).value = 'TOTALES'
    hoja.mergeCells(filaTot.number, 1, filaTot.number, 3)
    const letra = (n) => hoja.getColumn(n).letter
    filaTot.getCell(20).value = { formula: `SUM(${letra(20)}${desde}:${letra(20)}${hasta})` }
    for (let n = 23; n <= colTotal + 1; n++) {
      filaTot.getCell(n).value = { formula: `SUM(${letra(n)}${desde}:${letra(n)}${hasta})` }
      filaTot.getCell(n).numFmt = FORMATO_PESOS
    }
    filaTot.eachCell({ includeEmpty: true }, (c) => {
      c.font = { bold: true }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
      bordeFino(c)
    })
  }

  agregarResumen(libro, lista, conceptos, mes, ajustes)

  const buffer = await libro.xlsx.writeBuffer()
  const nombre = `Asistencias ${nombreMes(mes)}${ajustes.transportista ? ' - ' + ajustes.transportista : ''}.xlsx`
  return { buffer, nombre }
}

// "Juan de Dios Malebrán 3759, 8150215 Puente Alto, Región Metropolitana, Chile"
// -> "PUENTE ALTO". En la planilla el transportista anota solo la comuna.
export function comuna(direccion) {
  if (!direccion) return ''
  const conPostal = direccion.match(/\b\d{7}\s+([^,]+)/)
  if (conPostal) return conPostal[1].trim().toUpperCase()
  const partes = direccion
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !/regi[oó]n|^chile$|^\d+$/i.test(p))
  return (partes.length > 1 ? partes[partes.length - 1] : direccion.trim()).toUpperCase()
}

function observacion(a) {
  const fallido = a.estado === 'no_completado' && (a.motivo && a.motivo !== 'Otro' ? `FALLIDO (${a.motivo})` : 'FALLIDO')
  return [fallido, a.observaciones?.trim()].filter(Boolean).join(' · ')
}

// Un bloque por canal, uno al lado del otro, igual que la planilla que el
// transportista armaba a mano (columnas A, K, T y AB; totales en AI:AJ).
const BLOQUES = [
  { canal: 'MOK', titulo: ['SEGUROS', 'MOK'], col: 1, campos: ['FECHA', 'EXPEDIENTE', 'ASISTENCIA', 'PATENTE', 'ORIGEN', 'DESTINO', 'PRECIO', 'OBSERVACIONES', 'APRESTAMOS'] },
  { canal: 'EURO', titulo: ['SEGURO', 'EURO'], col: 11, campos: ['FECHA', 'EXPEDIENTE', 'ASISTENCIA', 'PATENTE', 'ORIGEN', 'DESTINO', 'VALOR', 'OBSERVACIÓN'] },
  { canal: 'MACC', titulo: ['SEGURO', 'MACC'], col: 20, campos: ['FECHA', 'ASISTENCIA', 'PATENTE', 'ORIGEN', 'DESTINO', 'VALOR', 'OBSERVACIÓN'] },
  { canal: 'PARTICULAR', titulo: ['PARTICULARES'], col: 28, campos: ['FECHA', 'ORIGEN', 'DESTINO', 'PRECIO', 'FORMA DE PAGO', 'OBSERVACIÓN'] },
]
const COL_RESUMEN = 35

const VALORES = {
  FECHA: (a) => {
    if (!a.fechaAsistencia) return null
    const [y, m, d] = a.fechaAsistencia.slice(0, 10).split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d))
  },
  EXPEDIENTE: (a) => numeroOTexto(a.expediente),
  ASISTENCIA: (a) => numeroOTexto(a.nAsistencia),
  PATENTE: (a) => a.patente,
  ORIGEN: (a) => comuna(a.origen),
  DESTINO: (a) => comuna(a.destino),
  PRECIO: totalCobros,
  VALOR: totalCobros,
  'FORMA DE PAGO': (a) => a.formaPago,
  OBSERVACIONES: observacion,
  OBSERVACIÓN: observacion,
  // El transportista no la ha usado hasta ahora; queda disponible en blanco.
  APRESTAMOS: () => null,
}

const ANCHOS = { FECHA: 11, EXPEDIENTE: 12, ASISTENCIA: 12, PATENTE: 10, ORIGEN: 18, DESTINO: 18, PRECIO: 11, VALOR: 11, 'FORMA DE PAGO': 15, APRESTAMOS: 14 }

const numeroOTexto = (v) => (/^\d{1,15}$/.test(v || '') ? Number(v) : v || null)

function agregarPlanilla(libro, lista, ajustes, mes) {
  const hoja = libro.addWorksheet('Planilla', { views: [{ state: 'frozen', ySplit: 5 }] })
  const negrita = { bold: true }

  hoja.getCell(1, 1).value = 'NOMBRE'
  hoja.getCell(1, 2).value = (ajustes.transportista || '').toUpperCase()
  hoja.getCell(2, 1).value = 'MES'
  hoja.getCell(2, 2).value = nombreMes(mes).split(' ')[0].toUpperCase()
  hoja.getCell(1, 1).font = hoja.getCell(2, 1).font = negrita

  const totales = []
  for (const b of BLOQUES) {
    const filas = lista.filter((a) => canalDe(a) === b.canal)
    b.titulo.forEach((t, i) => {
      hoja.getCell(4, b.col + i).value = t
      hoja.getCell(4, b.col + i).font = negrita
    })
    b.campos.forEach((campo, i) => {
      hoja.getColumn(b.col + i).width = ANCHOS[campo] ?? 32
      const c = hoja.getCell(5, b.col + i)
      c.value = campo
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } }
      c.alignment = { horizontal: 'center' }
      bordeFino(c)
    })

    filas.forEach((a, n) => {
      b.campos.forEach((campo, i) => {
        const c = hoja.getCell(6 + n, b.col + i)
        c.value = VALORES[campo](a)
        if (campo === 'FECHA') c.numFmt = 'dd/mm/yy'
        if (campo === 'PRECIO' || campo === 'VALOR') c.numFmt = FORMATO_PESOS
        c.alignment = { vertical: 'top', horizontal: campo === 'FECHA' ? 'center' : undefined }
        bordeFino(c)
      })
    })

    // Fila de total del bloque, con fórmula para que siga cuadrando si editan.
    const colPrecio = b.col + b.campos.findIndex((c) => c === 'PRECIO' || c === 'VALOR')
    const filaTotal = 6 + filas.length
    const letra = hoja.getColumn(colPrecio).letter
    hoja.getCell(filaTotal, colPrecio - 1).value = 'TOTAL'
    const total = hoja.getCell(filaTotal, colPrecio)
    total.value = filas.length
      ? { formula: `SUM(${letra}6:${letra}${filaTotal - 1})`, result: filas.reduce((s, a) => s + totalCobros(a), 0) }
      : 0
    total.numFmt = FORMATO_PESOS
    hoja.getCell(filaTotal, colPrecio - 1).font = total.font = negrita
    totales.push({ nombre: b.titulo[b.titulo.length - 1], celda: `${letra}${filaTotal}`, monto: filas.reduce((s, a) => s + totalCobros(a), 0) })
  }

  // Resumen de producción del mes
  hoja.getColumn(COL_RESUMEN).width = 16
  hoja.getColumn(COL_RESUMEN + 1).width = 14
  totales.forEach((t, i) => {
    hoja.getCell(4 + i, COL_RESUMEN).value = t.nombre
    const c = hoja.getCell(4 + i, COL_RESUMEN + 1)
    c.value = { formula: t.celda, result: t.monto }
    c.numFmt = FORMATO_PESOS
  })
  const filaProd = 4 + totales.length
  const letraRes = hoja.getColumn(COL_RESUMEN + 1).letter
  hoja.getCell(filaProd, COL_RESUMEN).value = 'PRODUCCIÓN'
  const prod = hoja.getCell(filaProd, COL_RESUMEN + 1)
  prod.value = { formula: `SUM(${letraRes}4:${letraRes}${filaProd - 1})`, result: totales.reduce((s, t) => s + t.monto, 0) }
  prod.numFmt = FORMATO_PESOS
  hoja.getCell(filaProd, COL_RESUMEN).font = prod.font = negrita
}

function agregarResumen(libro, lista, conceptos, mes, ajustes) {
  const hoja = libro.addWorksheet('Resumen')
  hoja.getColumn(1).width = 30
  hoja.getColumn(2).width = 14
  hoja.getColumn(3).width = 16

  const titulo = hoja.addRow([`Resumen ${nombreMes(mes)}`])
  titulo.font = { size: 14, bold: true }
  if (ajustes.transportista) hoja.addRow([ajustes.transportista])
  hoja.addRow([])

  const seccion = (nombre, filas, cols = ['Cantidad', 'Monto']) => {
    const enc = hoja.addRow([nombre, ...cols])
    enc.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } }
    })
    filas.forEach((f) => {
      const r = hoja.addRow(f)
      r.getCell(3).numFmt = FORMATO_PESOS
      r.eachCell({ includeEmpty: true }, bordeFino)
    })
    hoja.addRow([])
  }

  seccion(
    'Por estado',
    Object.entries(ESTADOS).map(([k, e]) => {
      const de = lista.filter((a) => a.estado === k)
      return [e.texto, de.length, de.reduce((s, a) => s + totalCobros(a), 0)]
    }),
  )

  const companias = [...new Set(lista.map((a) => a.compania || 'Sin compañía'))].sort()
  seccion(
    'Por compañía',
    companias.map((c) => {
      const de = lista.filter((a) => (a.compania || 'Sin compañía') === c)
      return [c, de.length, de.reduce((s, a) => s + totalCobros(a), 0)]
    }),
  )

  seccion(
    'Por concepto',
    conceptos.map((c) => {
      const items = lista.flatMap((a) => (a.cobros || []).filter((x) => x.concepto === c))
      return [c, items.length, items.reduce((s, x) => s + (Number(x.monto) || 0), 0)]
    }),
  )

  const total = hoja.addRow(['TOTAL DEL MES', lista.length, lista.reduce((s, a) => s + totalCobros(a), 0)])
  total.font = { bold: true, size: 12 }
  total.getCell(3).numFmt = FORMATO_PESOS
  const km = lista.reduce((s, a) => s + (Number(a.distanciaKm) || 0), 0)
  hoja.addRow(['Kilómetros recorridos', Math.round(km * 10) / 10])
}

// En el celular abre el menú de compartir (WhatsApp, correo…); si no se
// puede, descarga el archivo.
export async function compartirODescargar(buffer, nombre) {
  const tipo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const archivo = new File([buffer], nombre, { type: tipo })
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre })
      return 'compartido'
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelado'
    }
  }
  descargar(new Blob([buffer], { type: tipo }), nombre)
  return 'descargado'
}

export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
