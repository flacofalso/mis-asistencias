# Mis Asistencias (app-seguros)

Responder siempre en español.

## Contexto del negocio
- Un asegurado tiene un siniestro → llama a su aseguradora (ej. Zurich) → la plataforma de asistencia "MultiServicios OK" envía un correo de solicitud a la empresa de grúas.
- El correo trae: N° de Expediente, N° Asistencia, Nombre Cliente, Rut, Fono Contacto, Dirección origen/destino, Distancia a Recorrer, Excedente, Servicio, Vehículo Marca/Modelo, Patente, Fecha de la Asistencia, Sponsor (aseguradora), Plan.
- La empresa de grúas coordina por un grupo de WhatsApp ("Servicios Grúa…"): el dueño (ESNEIDER) reenvía la solicitud como foto y agrega detalles (dirección exacta, destino "A custodia") y cobros ("35.000 traslado, 50.000 rescate, total 85.000").
- Hoy cada transportista arma a mano un Excel mensual con todas sus asistencias. Esta app reemplaza eso.

## Estado
- v1 solo para el transportista (sin backend): datos en localStorage del teléfono, PWA instalable, respaldo JSON.
- Primero se prueba con un transportista; después la idea es ofrecerla a la empresa (multiusuario, servidor).
- Excel real del transportista: bloques por canal uno al lado del otro (MOK, EURO, MACC, PARTICULARES), origen/destino solo comuna, totales por bloque y "PRODUCCIÓN". El export lo replica en la hoja "Planilla" (`src/lib/excel.js`); "Detalle" y "Resumen" son extras. Muestras reales en `muestras/` (ignorada en git: datos de clientes).
- OCR desde foto (Tesseract) funciona bien con texto nítido; con capturas chicas del chat confunde dígitos. El parser (`src/lib/parser.js`) tolera errores típicos del OCR.

## Publicación
- GitHub Pages, desplegado automáticamente con GitHub Actions al hacer push a `main` (`.github/workflows/deploy.yml`).
- Para publicar cambios: commit + `git push`.

## Comandos
- `npm run dev` — desarrollo (con `--host` para abrir desde el celular en la misma wifi)
- `npm run build` — compila a `dist/`
