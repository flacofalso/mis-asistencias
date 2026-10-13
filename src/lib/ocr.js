// Lee el texto de una foto/captura de la solicitud. Tesseract se carga solo
// cuando se usa (descarga el idioma español la primera vez, requiere internet).

// Agranda y pasa a grises la imagen: las capturas de WhatsApp traen letra
// chica y el OCR mejora bastante.
async function preparar(archivo) {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(3, Math.max(1, 2400 / bitmap.width))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')
  ctx.filter = 'grayscale(1) contrast(1.3)'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

export async function leerTextoDeImagen(archivo, onProgreso) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('spa', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgreso?.(Math.round(m.progress * 100))
    },
  })
  try {
    const imagen = await preparar(archivo)
    const { data } = await worker.recognize(imagen)
    return data.text
  } finally {
    await worker.terminate()
  }
}
