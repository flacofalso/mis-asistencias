import { ESTADOS, totalCobros } from './storage.js'
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

  const hoja = libro.addWorksheet('Asistencias', {
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
