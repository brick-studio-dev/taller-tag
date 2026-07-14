import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { vehiculosApi, clientesApi, reparacionesApi } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Edit3, Save, X, User, Wrench, Plus, Camera, Trash2, Loader2 } from 'lucide-react'
import EstadoBadge from '../components/EstadoBadge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function FotoVehiculo({ vehiculo, onActualizado }) {
  const fileInputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)

  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen')
      return
    }
    setSubiendo(true)
    try {
      await vehiculosApi.subirFoto(vehiculo.id, file)
      onActualizado()
    } catch (err) {
      alert('No se pudo subir la foto: ' + err.message)
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleEliminar = async () => {
    if (!confirm('¿Quitar la foto de este vehículo?')) return
    try {
      await vehiculosApi.eliminarFoto(vehiculo.id)
      onActualizado()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="card overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      {vehiculo.foto_url ? (
        <div className="relative">
          <img
            src={vehiculo.foto_url}
            alt={`${vehiculo.marca} ${vehiculo.modelo}`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white/90 backdrop-blur rounded-xl text-gray-700 hover:bg-white shadow-sm"
              title="Cambiar foto"
            >
              <Camera size={16} />
            </button>
            <button
              onClick={handleEliminar}
              className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-500 hover:bg-white shadow-sm"
              title="Quitar foto"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo}
          className="w-full h-32 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {subiendo ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Camera size={22} />
          )}
          <span className="text-xs font-medium">
            {subiendo ? 'Subiendo...' : 'Añadir fotografía (opcional)'}
          </span>
        </button>
      )}
    </div>
  )
}

export default function VehiculoDetallePage() {
  const { id } = useParams()
  const [qp] = useSearchParams()
  const navigate = useNavigate()
  const [vehiculo, setVehiculo] = useState(null)
  const [reparaciones, setReparaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(id === 'nuevo')

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const cargar = async () => {
    if (id === 'nuevo') {
      setLoading(false)
      setEditing(true)
      const { data } = await clientesApi.listar({ porPagina: 200 })
      setClientes(data || [])
      if (qp.get('cliente')) reset({ cliente_id: qp.get('cliente') })
      return
    }
    try {
      const v = await vehiculosApi.obtener(id)
      setVehiculo(v)
      reset(v)
      const { data } = await reparacionesApi.listar({ busqueda: v.matricula })
      setReparaciones(data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [id])

  const onSubmit = async datos => {
    try {
      if (id === 'nuevo') {
        const nuevo = await vehiculosApi.crear({
          ...datos,
          anio: datos.anio ? parseInt(datos.anio) : null,
          kilometraje: datos.kilometraje ? parseInt(datos.kilometraje) : 0,
          potencia_cv: datos.potencia_cv ? parseInt(datos.potencia_cv) : null,
        })
        navigate(`/vehiculos/${nuevo.id}`, { replace: true })
      } else {
        await vehiculosApi.actualizar(id, datos)
        setEditing(false)
        await cargar()
      }
    } catch(e) { alert(e.message) }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100"/>)}
    </div>
  )

  const COMB_LABEL = {
    gasolina: 'Gasolina', diesel: 'Diésel', electrico: 'Eléctrico',
    hibrido: 'Híbrido', hibrido_enchufable: 'Híbrido enchufable',
    glp: 'GLP / Gas', otro: 'Otro'
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 pb-24 lg:pb-6 max-w-2xl">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {id === 'nuevo' ? 'Nuevo vehículo' : (vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : '...')}
          </h1>
          {vehiculo && (
            <p className="text-sm text-gray-500 font-mono">{vehiculo.matricula}</p>
          )}
        </div>
        {!editing && vehiculo && (
          <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">
            <Edit3 size={14}/> Editar
          </button>
        )}
      </div>

      {/* Fotografía (solo en vehículos ya creados) */}
      {id !== 'nuevo' && vehiculo && (
        <FotoVehiculo vehiculo={vehiculo} onActualizado={cargar} />
      )}

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-gray-900">Propietario</h2>
            <div>
              <label className="label">Cliente *</label>
              {id === 'nuevo' ? (
                <select {...register('cliente_id', { required: true })} className="input">
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-700 py-2">{vehiculo?.cliente_nombre}</p>
              )}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-gray-900">Datos del vehículo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Matrícula *</label>
                <input {...register('matricula', { required: true })} className="input uppercase" placeholder="1234ABC" />
              </div>
              <div>
                <label className="label">Bastidor (VIN)</label>
                <input {...register('bastidor')} className="input" placeholder="WBA..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Marca *</label>
                <input {...register('marca', { required: true })} className="input" placeholder="Volkswagen" />
              </div>
              <div>
                <label className="label">Modelo *</label>
                <input {...register('modelo', { required: true })} className="input" placeholder="Golf" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Versión</label>
                <input {...register('version')} className="input" placeholder="1.6 TDI 115 cv" />
              </div>
              <div>
                <label className="label">Color</label>
                <input {...register('color')} className="input" placeholder="Azul marino" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Año</label>
                <input {...register('anio')} type="number" min="1900" max="2030" className="input" placeholder="2019" />
              </div>
              <div>
                <label className="label">Potencia (CV)</label>
                <input {...register('potencia_cv')} type="number" className="input" placeholder="115" />
              </div>
              <div>
                <label className="label">Km actuales</label>
                <input {...register('kilometraje')} type="number" className="input" placeholder="85000" />
              </div>
            </div>
            <div>
              <label className="label">Combustible</label>
              <select {...register('tipo_combustible')} className="input">
                <option value="">— Seleccionar —</option>
                {Object.entries(COMB_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-gray-900">ITV y seguro</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Última ITV</label>
                <input {...register('ultima_itv')} type="date" className="input" />
              </div>
              <div>
                <label className="label">Próxima ITV</label>
                <input {...register('proxima_itv')} type="date" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Compañía seguro</label>
                <input {...register('seguro_compania')} className="input" placeholder="Mapfre..." />
              </div>
              <div>
                <label className="label">Vencimiento seguro</label>
                <input {...register('seguro_vencimiento')} type="date" className="input" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {id !== 'nuevo' && (
              <button type="button" onClick={() => { setEditing(false); reset(vehiculo) }} className="btn-secondary flex-1">
                <X size={14}/> Cancelar
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              <Save size={14}/> {isSubmitting ? 'Guardando...' : 'Guardar vehículo'}
            </button>
          </div>
        </form>
      ) : vehiculo ? (
        <>
          {/* Info del vehículo */}
          <div className="card p-5 grid grid-cols-2 gap-3">
            {[
              ['Matrícula', <span className="font-mono font-bold">{vehiculo.matricula}</span>],
              ['Año', vehiculo.anio],
              ['Versión', vehiculo.version],
              ['Color', vehiculo.color],
              ['Combustible', COMB_LABEL[vehiculo.tipo_combustible]],
              ['Potencia', vehiculo.potencia_cv ? `${vehiculo.potencia_cv} cv` : null],
              ['Km actuales', vehiculo.kilometraje ? vehiculo.kilometraje.toLocaleString() : null],
              ['Bastidor', vehiculo.bastidor],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{k}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* Cliente */}
          <Link to={`/clientes/${vehiculo.cliente_id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <User size={18} className="text-brand-500 flex-shrink-0"/>
            <div>
              <p className="text-xs text-gray-400">Propietario</p>
              <p className="font-semibold text-sm text-gray-900">{vehiculo.cliente_nombre}</p>
              {vehiculo.cliente_telefono && (
                <p className="text-xs text-gray-500">{vehiculo.cliente_telefono}</p>
              )}
            </div>
          </Link>

          {/* ITV */}
          {(vehiculo.proxima_itv || vehiculo.seguro_vencimiento) && (
            <div className="card p-4 grid grid-cols-2 gap-4">
              {vehiculo.ultima_itv && (
                <div>
                  <p className="text-xs text-gray-400">Última ITV</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(vehiculo.ultima_itv), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              )}
              {vehiculo.proxima_itv && (
                <div>
                  <p className="text-xs text-gray-400">Próxima ITV</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {format(parseISO(vehiculo.proxima_itv), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              )}
              {vehiculo.seguro_compania && (
                <div>
                  <p className="text-xs text-gray-400">Seguro</p>
                  <p className="text-sm font-medium text-gray-900">{vehiculo.seguro_compania}</p>
                </div>
              )}
              {vehiculo.seguro_vencimiento && (
                <div>
                  <p className="text-xs text-gray-400">Vence seguro</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(vehiculo.seguro_vencimiento), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Historial reparaciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Historial de reparaciones</h2>
              <Link
                to={`/reparaciones/nueva?vehiculo=${id}`}
                className="btn-primary btn-sm"
              >
                <Plus size={13}/> Nueva orden
              </Link>
            </div>
            {reparaciones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 card">Sin reparaciones registradas</p>
            ) : (
              <div className="space-y-2">
                {reparaciones.map(r => (
                  <Link
                    key={r.id}
                    to={`/reparaciones/${r.id}`}
                    className="card-hover p-4 flex items-center gap-3"
                  >
                    <Wrench size={16} className="text-brand-500 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.descripcion_averia}</p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(r.fecha_entrada), "d MMM yyyy", { locale: es })}
                        {r.total > 0 && ` · ${r.total.toFixed(2)} €`}
                      </p>
                    </div>
                    <EstadoBadge estado={r.estado}/>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
