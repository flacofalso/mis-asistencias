import { useEffect, useState } from 'react'

const PREFIJO = 'app-seguros:'

function leer(clave, inicial) {
  try {
    const v = localStorage.getItem(PREFIJO + clave)
    return v ? JSON.parse(v) : inicial
  } catch {
    return inicial
  }
}

export function useGuardado(clave, inicial) {
  const [valor, setValor] = useState(() => leer(clave, inicial))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
    } catch {
      // Sin espacio o almacenamiento bloqueado: los datos quedan solo en memoria.
    }
  }, [clave, valor])
  return [valor, setValor]
}

export const AJUSTES_INICIALES = {
  transportista: '',
  rut: '',
  telefono: '',
  patenteGrua: '',
  empresa: '',
  conceptos: [
    { nombre: 'Traslado', monto: 35000 },
    { nombre: 'Rescate', monto: 50000 },
    { nombre: 'Km adicional', monto: 0 },
    { nombre: 'Espera', monto: 0 },
    { nombre: 'Peaje', monto: 0 },
  ],
}

export const ESTADOS = {
  pendiente: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-800' },
  completado: { texto: 'Completado', clase: 'bg-emerald-100 text-emerald-800' },
  no_completado: { texto: 'No completado', clase: 'bg-red-100 text-red-800' },
}

export const MOTIVOS = [
  'Cancelado por el cliente',
  'Cancelado por la compañía',
  'Cliente no se encontraba en el lugar',
  'Vehículo ya había sido retirado',
  'Dirección errónea',
  'Asistido por otro proveedor',
  'Otro',
]

export const TIPOS_DESTINO = ['Custodia', 'Taller', 'Domicilio', 'Concesionario', 'Otro']

export function nuevaAsistencia() {
  return {
    id: crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2),
    creadoEn: new Date().toISOString(),
    compania: '',
    sponsor: '',
    plan: '',
    servicio: 'GRUA',
    expediente: '',
    nAsistencia: '',
    clienteNombre: '',
    clienteRut: '',
    clienteFono: '',
    patente: '',
    marca: '',
    modelo: '',
    origen: '',
    destino: '',
    tipoDestino: '',
    distanciaKm: '',
    fechaAsistencia: ahoraLocal(),
    llegada: '',
    termino: '',
    estado: 'pendiente',
    motivo: '',
    cobros: [],
    excedente: '',
    observaciones: '',
  }
}

// Fecha y hora actual en formato de <input type="datetime-local">.
export function ahoraLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function totalCobros(a) {
  return (a.cobros || []).reduce((s, c) => s + (Number(c.monto) || 0), 0)
}

export function mesDe(a) {
  return (a.fechaAsistencia || a.creadoEn).slice(0, 7)
}

// Una asistencia recién creada que el usuario dejó sin llenar.
export function estaVacia(a) {
  return !a.expediente && !a.nAsistencia && !a.patente && !a.clienteNombre && !a.origen && !(a.cobros || []).length
}
