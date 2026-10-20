# Mis Asistencias

App para que el transportista (grúa) registre cada asistencia en el momento y genere el Excel mensual con un botón.

## Uso

1. **Nueva asistencia**: sube la captura del correo de la solicitud (📷 *Desde foto*) o pega su texto. Los datos se completan solos (expediente, patente, cliente, origen/destino, km, compañía…). Revisa que estén correctos.
2. Marca **llegada** y **término** con el botón *Ahora*.
3. Elige el **resultado** (completado / no completado con su motivo) y agrega los **cobros** con los botones rápidos (Traslado, Rescate…). También se puede pegar el mensaje del dueño ("35.000 traslado, 50.000 rescate").
4. A fin de mes: **Exportar Excel**. En el celular abre el menú para compartir (WhatsApp, correo). El archivo trae tres hojas:
   - **Planilla**: el mismo formato de la planilla mensual del transportista (bloques por canal MOK, EURO, MACC y PARTICULARES uno al lado del otro, origen/destino por comuna, totales por bloque y PRODUCCIÓN).
   - **Detalle**: todas las asistencias con sus datos completos.
   - **Resumen**: cantidades y montos del mes por estado, por compañía y por concepto de cobro.

En la app, *¿Cómo funciona?* explica estos pasos y sus beneficios.

**Guardar en Google Drive** (si está configurado): sube la planilla del mes a la carpeta *Mis Asistencias* del Drive del transportista, convertida a Hoja de cálculo de Google, para verla en el celular sin Excel. Cada vez actualiza el mismo archivo. En *Ajustes* se puede compartir la carpeta (solo lectura) con otro correo.

Los datos se guardan solo en el teléfono. En *Ajustes* → *Respaldo* se puede descargar y restaurar una copia.

> Lectura desde foto: funciona mejor si se abre la imagen del correo a pantalla completa y se toma la captura ahí, no en la vista del chat. La primera vez necesita internet para descargar el idioma.

## Desarrollo

```bash
npm install
npm run dev      # muestra una URL "Network" para abrir desde el celular en la misma red wifi
npm run build    # genera la carpeta dist/ lista para publicar
```

## Publicación

Se publica en GitHub Pages: cada `git push` a `main` la compila y despliega automáticamente (`.github/workflows/deploy.yml`). Desde ahí (HTTPS) se puede instalar en el celular como app.

### Configurar Google Drive

La app usa el permiso `drive.file` (solo ve los archivos que ella crea). Se necesita un ID de cliente OAuth de Google:

1. En [console.cloud.google.com](https://console.cloud.google.com) crear un proyecto y habilitar **Google Drive API**.
2. *Google Auth Platform* → configurar la pantalla de consentimiento (externa), en *Público* dejarla en **Prueba** y agregar como usuarios de prueba los Gmail que la usarán. En *Acceso a datos* agregar el permiso `.../auth/drive.file`.
3. *Clientes* → crear cliente **Aplicación web** con orígenes autorizados `https://flacofalso.github.io` y `http://localhost:5173`.
4. Poner el ID en `.env` (`VITE_GOOGLE_CLIENT_ID=…`; no es secreto) y publicar.

Mientras la app esté en modo prueba, Google muestra el aviso "Google no verificó esta app": hay que tocar *Continuar*.

## Estructura

- `src/lib/parser.js` — lee el texto de la solicitud (correo de MultiServicios OK) y del mensaje de cobros
- `src/lib/ocr.js` — lectura de texto desde foto (Tesseract, se carga solo al usarla)
- `src/lib/excel.js` — genera el Excel mensual (hojas Planilla, Detalle y Resumen)
- `src/lib/drive.js` — guarda la planilla del mes en Google Drive
- `src/lib/storage.js` — datos guardados en el teléfono, estados, motivos y tarifas
- `src/components/` — pantallas: Inicio, FormAsistencia, Importar, Ajustes, Ayuda (*¿Cómo funciona?*)
