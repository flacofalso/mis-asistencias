import { useState } from 'react'
import { Chip, Seccion } from './ui'

const PESTANAS = [
  { id: 'app', texto: 'La app' },
  { id: 'guia', texto: 'Guía' },
  { id: 'transportistas', texto: 'Transportistas' },
  { id: 'empresas', texto: 'Empresas' },
]

const PASOS = [
  {
    titulo: 'Configura tus datos (una sola vez)',
    texto:
      'Toca ⚙️ arriba a la derecha. Escribe tu nombre, RUT, teléfono y la patente de tu grúa: aparecen en el Excel. En “Tarifas habituales” deja tus cobros de siempre (traslado, rescate, km adicional…) para tenerlos como botones rápidos.',
  },
  {
    titulo: 'Llega una solicitud: toca “+ Nueva asistencia”',
    texto:
      'Se abre la ficha con el cuadro “Cargar desde la solicitud”. Tienes dos caminos: “📷 Desde foto” para subir la captura del correo que llegó al grupo de WhatsApp, o “📋 Pegar texto” si copiaste el texto del correo o del mensaje.',
  },
  {
    titulo: 'Revisa lo que se completó solo',
    texto:
      'La app rellena expediente, N° de asistencia, cliente, RUT, teléfono, origen, destino, km, servicio, vehículo, patente, fecha y compañía. Si pegas un mensaje como “35.000 traslado, 50.000 rescate”, también arma los cobros. Revisa los números: con fotos chicas o borrosas la lectura puede equivocarse en algún dígito.',
  },
  {
    titulo: 'Úsala durante el servicio',
    texto:
      'Toca 📍 junto a la dirección para abrirla en el mapa y 📞 para llamar al cliente. Al llegar, toca “Ahora” en “Llegada al lugar”. Si la patente ya la atendiste antes, la marca y el modelo se completan solos.',
  },
  {
    titulo: 'Cierra la asistencia',
    texto:
      'Al terminar, toca “Ahora” en “Término”: queda marcada como Completada y se calcula la duración. Si no se pudo hacer, marca “No completado” y elige el motivo (cancelada, cliente no estaba, dirección errónea…). Agrega los cobros y, si corresponde, el excedente cobrado al cliente.',
  },
  {
    titulo: 'Todo se guarda solo',
    texto:
      'No hay botón de guardar: cada cambio queda registrado al instante. Toca “✓ Listo” para volver al listado. Puedes abrir cualquier asistencia después para corregirla.',
  },
  {
    titulo: 'Fin de mes: exporta el Excel',
    texto:
      'En la pantalla de inicio elige el mes con las flechas ‹ ›. Ahí ves cuántas asistencias hiciste, el total en pesos y cuántas quedaron completadas o no. Toca “📊 Exportar Excel” y compártelo directo por WhatsApp o correo.',
  },
  {
    titulo: 'Haz un respaldo',
    texto:
      'Los datos viven en tu teléfono. En ⚙️ → “Descargar respaldo” obtienes un archivo que puedes guardar en Drive o enviarte por WhatsApp. Si cambias de teléfono, usa “Restaurar” con ese archivo.',
  },
]

function Lista({ items }) {
  return (
    <ul className="space-y-3">
      {items.map(([icono, titulo, texto]) => (
        <li key={titulo} className="flex gap-3">
          <span className="text-2xl" aria-hidden>{icono}</span>
          <div>
            <p className="font-semibold text-slate-900">{titulo}</p>
            <p className="text-sm text-slate-600">{texto}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function LaApp() {
  return (
    <>
      <Seccion titulo="¿Qué es Mis Asistencias?" icono="🚛">
        <p className="text-slate-700">
          <b>Mis Asistencias</b> es una aplicación para el celular pensada para los transportistas de grúa que atienden
          asistencias en ruta de las compañías de seguros (Zurich, HDI, BCI, Mapfre y otras).
        </p>
        <p className="text-slate-700">
          Reemplaza la planilla Excel que hoy cada transportista arma a mano a fin de mes. Cada solicitud que llega por
          correo o WhatsApp se registra en segundos —incluso leyendo la foto del correo— y al cerrar el mes la app genera
          el Excel con todas las asistencias, sus horarios, su resultado y sus cobros.
        </p>
      </Seccion>
      <Seccion titulo="Qué registra cada asistencia" icono="📄">
        <Lista
          items={[
            ['📄', 'Solicitud', 'Compañía, N° de expediente, N° de asistencia, servicio y plan.'],
            ['🚗', 'Vehículo y cliente', 'Patente, marca, modelo, nombre, RUT y teléfono del asegurado.'],
            ['🗺️', 'Trayecto', 'Origen, destino (custodia, taller, domicilio…) y kilómetros.'],
            ['⏱️', 'Horarios', 'Hora de asignación, llegada al lugar y término, con la duración total.'],
            ['✅', 'Resultado', 'Completada o no completada, con el motivo.'],
            ['💵', 'Cobros', 'Traslado, rescate, km adicional, excedente y lo que necesites.'],
          ]}
        />
      </Seccion>
      <Seccion titulo="Cómo funciona por dentro" icono="📱">
        <p className="text-sm text-slate-600">
          Se abre desde el navegador y se puede instalar como app en la pantalla de inicio (en el menú del navegador:
          “Agregar a pantalla de inicio” o “Instalar app”). Funciona sin señal. No necesita cuenta ni contraseña: los
          datos quedan guardados solo en tu teléfono.
        </p>
      </Seccion>
    </>
  )
}

function Guia() {
  return (
    <Seccion titulo="Guía paso a paso" icono="🧭">
      <ol className="space-y-4">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{p.titulo}</p>
              <p className="text-sm text-slate-600">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Seccion>
  )
}

function Transportistas() {
  return (
    <>
      <Seccion titulo="Beneficios para ti, transportista" icono="👷">
        <p className="text-slate-700">
          Tu trabajo es estar en la ruta, no armando planillas. Con Mis Asistencias el registro se hace mientras
          trabajas y a fin de mes el Excel ya está listo.
        </p>
        <Lista
          items={[
            ['⏱️', 'Se acaba el Excel a mano', 'Nada de pasar datos de fotos y mensajes a una planilla a fin de mes. El Excel sale con un toque.'],
            ['📷', 'Registro en segundos', 'Sube la foto del correo o pega el texto y los datos se completan solos. Solo revisas y listo.'],
            ['💰', 'Sabes cuánto llevas ganado', 'El total del mes se actualiza con cada asistencia. Sin sumas en papel ni cálculos dudosos.'],
            ['🧾', 'Ningún servicio sin cobrar', 'Cada asistencia queda con sus cobros, también las no completadas. Fácil revisar si a fin de mes te pagaron todo.'],
            ['🛡️', 'Respaldo ante reclamos', 'Quedan la hora de llegada, la de término y el motivo cuando algo no se pudo hacer. Si te preguntan qué pasó, tienes el registro.'],
            ['🔎', 'Encuentras todo al tiro', 'Busca por patente, expediente o cliente cualquier servicio antiguo.'],
            ['📍', 'Todo a mano en la ruta', 'Un toque para abrir la dirección en el mapa y otro para llamar al cliente.'],
            ['📶', 'Funciona sin señal', 'En carretera o en un subterráneo igual puedes registrar. Y no gasta tus datos en servidores.'],
            ['🔒', 'Tus datos son tuyos', 'Sin cuentas ni contraseñas. La información queda en tu teléfono y tú decides con quién compartirla.'],
          ]}
        />
      </Seccion>
    </>
  )
}

function Empresas() {
  return (
    <>
      <Seccion titulo="Beneficios para la empresa de grúas" icono="🏢">
        <p className="text-slate-700">
          Cuando cada transportista lleva su registro a su manera, cuadrar el mes con la plataforma de asistencia y las
          compañías toma horas. Con Mis Asistencias todos entregan la información igual, completa y a tiempo.
        </p>
        <Lista
          items={[
            ['📊', 'Un solo formato para todos', 'Todos los transportistas entregan el mismo Excel, con las mismas columnas. Consolidar el mes se vuelve copiar y pegar.'],
            ['✔️', 'Menos errores al liquidar', 'Expediente, N° de asistencia y patente salen de la misma solicitud, no de lo que alguien anotó de memoria. Más fácil cruzar con la plataforma y la aseguradora.'],
            ['⏱️', 'Tiempos medibles', 'Hora de asignación, llegada y término de cada servicio. Datos concretos para responder a las compañías por los tiempos de respuesta.'],
            ['❌', 'Servicios fallidos con motivo', 'Cada asistencia no completada queda con su causa (cancelada, cliente ausente, dirección errónea…). Sirve para cobrar lo que corresponda y para responder reclamos.'],
            ['💵', 'Cobros claros', 'Traslado, rescate, km adicional y excedentes desglosados por servicio. Menos discusiones a la hora de pagar.'],
            ['🚀', 'Sin costo ni instalación', 'Es un enlace: se abre en cualquier celular y se instala en un minuto. No hay que comprar equipos ni capacitar con manuales.'],
            ['🙌', 'Transportistas más contentos', 'Les ahorra horas de trabajo administrativo cada mes. Así es más fácil sumar y retener buenos conductores.'],
          ]}
        />
      </Seccion>
      <Seccion titulo="Lo que viene" icono="🔭">
        <p className="text-sm text-slate-600">
          Hoy cada transportista usa la app en su propio teléfono. El siguiente paso es una versión para la empresa:
          ver en un solo panel las asistencias de toda la flota en tiempo real, sin esperar los Excel de fin de mes, y
          generar los reportes por compañía y por transportista de forma automática.
        </p>
      </Seccion>
    </>
  )
}

export default function Ayuda({ onVolver }) {
  const [pestana, setPestana] = useState('app')

  return (
    <>
      <header className="sticky top-0 z-10 bg-slate-900 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="rounded-full px-3 py-1 text-2xl active:bg-slate-700" aria-label="Volver">
            ←
          </button>
          <h1 className="font-bold">¿Cómo funciona?</h1>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {PESTANAS.map((p) => (
            <Chip key={p.id} activo={pestana === p.id} onClick={() => setPestana(p.id)}>
              {p.texto}
            </Chip>
          ))}
        </div>
      </header>

      <div className="space-y-4 p-4">
        {pestana === 'app' && <LaApp />}
        {pestana === 'guia' && <Guia />}
        {pestana === 'transportistas' && <Transportistas />}
        {pestana === 'empresas' && <Empresas />}
      </div>
    </>
  )
}
