# Mis Asistencias

App para que el transportista (grúa) registre cada asistencia en el momento y genere el Excel mensual con un botón.

## Uso

1. **Nueva asistencia**: sube la captura del correo de la solicitud (📷 *Desde foto*) o pega su texto. Los datos se completan solos (expediente, patente, cliente, origen/destino, km, compañía…). Revisa que estén correctos.
2. Marca **llegada** y **término** con el botón *Ahora*.
3. Elige el **resultado** (completado / no completado con su motivo) y agrega los **cobros** con los botones rápidos (Traslado, Rescate…). También se puede pegar el mensaje del dueño ("35.000 traslado, 50.000 rescate").
4. A fin de mes: **Exportar Excel**. En el celular abre el menú para compartir (WhatsApp, correo).

Los datos se guardan solo en el teléfono. En *Ajustes* → *Respaldo* se puede descargar y restaurar una copia.

> Lectura desde foto: funciona mejor si se abre la imagen del correo a pantalla completa y se toma la captura ahí, no en la vista del chat. La primera vez necesita internet para descargar el idioma.

## Desarrollo

```bash
npm install
npm run dev      # muestra una URL "Network" para abrir desde el celular en la misma red wifi
npm run build    # genera la carpeta dist/ lista para publicar
```

Para instalarla en el celular como app (y usar la cámara/compartir), hay que publicarla con HTTPS, por ejemplo subiendo `dist/` a Netlify o Vercel (gratis).

## Estructura

- `src/lib/parser.js` — lee el texto de la solicitud (correo de MultiServicios OK) y del mensaje de cobros
- `src/lib/ocr.js` — lectura de texto desde foto (Tesseract, se carga solo al usarla)
- `src/lib/excel.js` — genera el Excel mensual (hoja Asistencias + hoja Resumen)
- `src/lib/storage.js` — datos guardados en el teléfono, estados, motivos y tarifas
- `src/components/` — pantallas: Inicio, FormAsistencia, Importar, Ajustes
