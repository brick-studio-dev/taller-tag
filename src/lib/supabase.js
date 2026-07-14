import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
})

export function dbError(error) {
  console.error('[Supabase]', error)
  throw new Error(error?.message || 'Error de base de datos')
}

// ── Helpers para enriquecer datos ─────────────────────────────
async function enriquecerVehiculos(vehiculos) {
  if (!vehiculos || vehiculos.length === 0) return []
  const clienteIds = [...new Set(vehiculos.map(v => v.cliente_id))]
  const { data: clientes } = await supabase
    .from('clientes').select('id, nombre, apellidos, telefono')
    .in('id', clienteIds)
  const mapa = Object.fromEntries((clientes || []).map(c => [c.id, c]))
  return vehiculos.map(v => ({
    ...v,
    cliente_nombre: mapa[v.cliente_id] ? `${mapa[v.cliente_id].nombre} ${mapa[v.cliente_id].apellidos}` : '',
    cliente_telefono: mapa[v.cliente_id]?.telefono || '',
  }))
}

async function enriquecerReparaciones(reparaciones) {
  if (!reparaciones || reparaciones.length === 0) return []
  const vehiculoIds = [...new Set(reparaciones.map(r => r.vehiculo_id))]
  const { data: vehiculos } = await supabase
    .from('vehiculos').select('id, matricula, marca, modelo, cliente_id')
    .in('id', vehiculoIds)
  const clienteIds = [...new Set((vehiculos || []).map(v => v.cliente_id))]
  const { data: clientes } = await supabase
    .from('clientes').select('id, nombre, apellidos, telefono')
    .in('id', clienteIds)
  const mapaV = Object.fromEntries((vehiculos || []).map(v => [v.id, v]))
  const mapaC = Object.fromEntries((clientes || []).map(c => [c.id, c]))
  return reparaciones.map(r => {
    const v = mapaV[r.vehiculo_id] || {}
    const c = mapaC[v.cliente_id] || {}
    return {
      ...r,
      matricula: v.matricula || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      cliente_nombre: c.nombre ? `${c.nombre} ${c.apellidos}` : '',
      cliente_telefono: c.telefono || '',
    }
  })
}

// ── API Clientes ──────────────────────────────────────────────
export const clientesApi = {
  async listar({ pagina = 1, porPagina = 20, busqueda = '' } = {}) {
    let q = supabase.from('clientes').select('*', { count: 'exact' })
      .eq('activo', true).order('apellidos')
      .range((pagina - 1) * porPagina, pagina * porPagina - 1)
    if (busqueda) {
      q = q.or(`nombre.ilike.%${busqueda}%,apellidos.ilike.%${busqueda}%,dni_nif.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
    }
    const { data, error, count } = await q
    if (error) dbError(error)
    return { data, total: count }
  },

  async obtener(id) {
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
    if (error) dbError(error)
    const { data: vehiculos } = await supabase.from('vehiculos').select('*').eq('cliente_id', id).eq('activo', true)
    return { ...data, vehiculos: vehiculos || [] }
  },

  async crear(datos) {
    const { data, error } = await supabase.from('clientes').insert(datos).select().single()
    if (error) dbError(error)
    return data
  },

  async actualizar(id, datos) {
    const { vehiculos, ...datosSinVehiculos } = datos
    const { error } = await supabase.from('clientes').update(datosSinVehiculos).eq('id', id)
    if (error) dbError(error)
    return { ...datos, id }
  },

  async eliminar(id) {
    const { error } = await supabase.from('clientes').update({ activo: false }).eq('id', id)
    if (error) dbError(error)
  },
}

// ── API Vehículos ─────────────────────────────────────────────
export const vehiculosApi = {
  async listar({ pagina = 1, porPagina = 20, busqueda = '', clienteId = null } = {}) {
    let q = supabase.from('vehiculos').select('*', { count: 'exact' })
      .eq('activo', true).order('created_at', { ascending: false })
      .range((pagina - 1) * porPagina, pagina * porPagina - 1)
    if (clienteId) q = q.eq('cliente_id', clienteId)
    const { data, error, count } = await q
    if (error) dbError(error)
    let result = await enriquecerVehiculos(data || [])
    if (busqueda) {
      const b = busqueda.toLowerCase()
      result = result.filter(v =>
        v.matricula?.toLowerCase().includes(b) ||
        v.marca?.toLowerCase().includes(b) ||
        v.modelo?.toLowerCase().includes(b) ||
        v.cliente_nombre?.toLowerCase().includes(b)
      )
    }
    return { data: result, total: count }
  },

  async obtener(id) {
    const { data, error } = await supabase.from('vehiculos').select('*').eq('id', id).single()
    if (error) dbError(error)
    const enriched = await enriquecerVehiculos([data])
    return enriched[0]
  },

  async crear(datos) {
    const fechas = ['ultima_itv','proxima_itv','seguro_vencimiento','fecha_matriculacion']
    fechas.forEach(f => { if (datos[f] === '') datos[f] = null })
    const { data, error } = await supabase.from('vehiculos').insert(datos).select().single()
    if (error) dbError(error)
    return data
  },

  async actualizar(id, datos) {
    const { cliente_nombre, cliente_telefono, ...datosSinExtras } = datos
    const fechas = ['ultima_itv','proxima_itv','seguro_vencimiento','fecha_matriculacion']
    fechas.forEach(f => { if (datosSinExtras[f] === '') datosSinExtras[f] = null })
    const { data, error } = await supabase.from('vehiculos').update(datosSinExtras).eq('id', id).select().single()
    if (error) dbError(error)
    return data
  },

  async eliminar(id) {
    const { error } = await supabase.from('vehiculos').update({ activo: false }).eq('id', id)
    if (error) dbError(error)
  },

  async subirFoto(vehiculoId, file) {
    const ext = file.name.split('.').pop()
    const path = `${vehiculoId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('vehiculos').upload(path, file, { upsert: true })
    if (uploadError) dbError(uploadError)
    const { data: { publicUrl } } = supabase.storage.from('vehiculos').getPublicUrl(path)
    const { data, error } = await supabase.from('vehiculos').update({ foto_url: publicUrl }).eq('id', vehiculoId).select().single()
    if (error) dbError(error)
    return data
  },

  async eliminarFoto(vehiculoId) {
    const { data, error } = await supabase.from('vehiculos').update({ foto_url: null }).eq('id', vehiculoId).select().single()
    if (error) dbError(error)
    return data
  },
}

// ── API Reparaciones ──────────────────────────────────────────
export const reparacionesApi = {
  async listar({ pagina = 1, porPagina = 20, busqueda = '', estado = null } = {}) {
    let q = supabase.from('reparaciones').select('*', { count: 'exact' })
      .order('fecha_entrada', { ascending: false })
      .range((pagina - 1) * porPagina, pagina * porPagina - 1)
    if (estado) q = q.eq('estado', estado)
    const { data, error, count } = await q
    if (error) dbError(error)
    let result = await enriquecerReparaciones(data || [])
    if (busqueda) {
      const b = busqueda.toLowerCase()
      result = result.filter(r =>
        r.matricula?.toLowerCase().includes(b) ||
        r.cliente_nombre?.toLowerCase().includes(b) ||
        r.descripcion_averia?.toLowerCase().includes(b)
      )
    }
    return { data: result, total: count }
  },

  async obtener(id) {
    const { data, error } = await supabase.from('reparaciones').select('*').eq('id', id).single()
    if (error) dbError(error)
    const enriched = await enriquecerReparaciones([data])
    const { data: lineas } = await supabase.from('lineas_reparacion').select('*').eq('reparacion_id', id).order('created_at')
    return { ...enriched[0], lineas: lineas || [] }
  },

  async crear(datos) {
    const { data, error } = await supabase.from('reparaciones').insert(datos).select().single()
    if (error) dbError(error)
    return data
  },

  async actualizar(id, datos) {
    const { data, error } = await supabase.from('reparaciones').update(datos).eq('id', id).select().single()
    if (error) dbError(error)
    return data
  },

  async agregarLinea(reparacionId, linea) {
    const { data, error } = await supabase.from('lineas_reparacion').insert({ ...linea, reparacion_id: reparacionId }).select().single()
    if (error) dbError(error)
    return data
  },

  async eliminarLinea(lineaId) {
    const { error } = await supabase.from('lineas_reparacion').delete().eq('id', lineaId)
    if (error) dbError(error)
  },

  async eliminar(id) {
    await supabase.from('lineas_reparacion').delete().eq('reparacion_id', id)
    const { error } = await supabase.from('reparaciones').delete().eq('id', id)
    if (error) dbError(error)
  },
}

// ── API Dashboard ─────────────────────────────────────────────
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export const dashboardApi = {
  async resumen() {
    const anioActual = new Date().getFullYear()
    const inicioAnio = `${anioActual}-01-01`
    const haceUnAnio = new Date()
    haceUnAnio.setMonth(haceUnAnio.getMonth() - 11)
    haceUnAnio.setDate(1)
    const inicioVentana = haceUnAnio.toISOString().split('T')[0]

    const [
      { count: totalClientes },
      { count: totalVehiculos },
      { data: reparacionesVentana },
      { data: ultimasRepsRaw },
      { data: itvProximas },
    ] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('vehiculos').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('reparaciones').select('fecha_entrada, total').gte('fecha_entrada', inicioVentana),
      supabase.from('reparaciones').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('vehiculos').select('id, matricula, marca, modelo, proxima_itv')
        .eq('activo', true).gte('proxima_itv', new Date().toISOString().split('T')[0])
        .order('proxima_itv').limit(5),
    ])

    const ultimasRep = await enriquecerReparaciones(ultimasRepsRaw || [])

    const hoy = new Date()
    const mesesBuckets = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      mesesBuckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        mes: MESES_CORTOS[d.getMonth()],
        reparaciones: 0, importe: 0,
      })
    }
    const bucketByKey = Object.fromEntries(mesesBuckets.map(b => [b.key, b]))
    let totalImporteAnio = 0

    for (const rep of (reparacionesVentana || [])) {
      if (!rep.fecha_entrada) continue
      const key = rep.fecha_entrada.slice(0, 7)
      if (bucketByKey[key]) {
        bucketByKey[key].reparaciones += 1
        bucketByKey[key].importe += rep.total || 0
      }
      if (rep.fecha_entrada >= inicioAnio) totalImporteAnio += rep.total || 0
    }

    const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    const totalReparacionesMes = bucketByKey[mesActualKey]?.reparaciones || 0
    const mesAnterior = mesesBuckets[mesesBuckets.length - 2]
    const mesActual = mesesBuckets[mesesBuckets.length - 1]
    const tendenciaReparaciones = mesAnterior?.reparaciones
      ? Math.round(((mesActual.reparaciones - mesAnterior.reparaciones) / mesAnterior.reparaciones) * 100) : null
    const tendenciaImporte = mesAnterior?.importe
      ? Math.round(((mesActual.importe - mesAnterior.importe) / mesAnterior.importe) * 100) : null

    return {
      totalClientes, totalVehiculos, totalReparacionesMes,
      tendenciaReparaciones, totalImporteAnio, tendenciaImporte,
      anioActual, mesesBuckets, ultimasRep, itvProximas: itvProximas || [],
    }
  },
}
