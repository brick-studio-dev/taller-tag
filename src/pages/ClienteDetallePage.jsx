import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { clientesApi } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Car, Edit3, Save, X, Phone, Mail, MapPin, FileText, Plus } from 'lucide-react'

export default function ClienteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(id === 'nuevo')

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const cargar = async () => {
    if (id === 'nuevo') { setLoading(false); setEditing(true); return }
    try {
      const data = await clientesApi.obtener(id)
      setCliente(data)
      reset(data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [id])

  const onSubmit = async datos => {
    try {
      if (id === 'nuevo') {
        const nuevo = await clientesApi.crear(datos)
        navigate(`/clientes/${nuevo.id}`, { replace: true })
      } else {
        await clientesApi.actualizar(id, datos)
        setCliente(prev => ({ ...prev, ...datos }))
        setEditing(false)
      }
    } catch(e) { alert(e.message) }
  }

  const borrarCliente = async () => {
    if (!confirm('¿Seguro que quieres eliminar este cliente? Esta acción no se puede deshacer.')) return
    try {
      await clientesApi.eliminar(id)
      navigate('/clientes')
    } catch(e) { alert(e.message) }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100"/>)}
    </div>
  )

  return (
    <div className="p-4 lg:p-6 space-y-5 pb-24 lg:pb-6 max-w-2xl">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {id === 'nuevo' ? 'Nuevo cliente' : (cliente ? `${cliente.nombre} ${cliente.apellidos}` : '...')}
          </h1>
        </div>
        {!editing && cliente && (
          <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">
            <Edit3 size={14}/> Editar
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input {...register('nombre', { required: true })} className="input" placeholder="Juan" />
            </div>
            <div>
              <label className="label">Apellidos *</label>
              <input {...register('apellidos', { required: true })} className="input" placeholder="García López" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">DNI / NIF</label>
              <input {...register('dni_nif')} className="input" placeholder="12345678A" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} type="tel" className="input" placeholder="666 000 000" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="juan@ejemplo.com" />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input {...register('direccion')} className="input" placeholder="Calle Mayor 1, 2ºA" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input {...register('ciudad')} className="input" placeholder="Madrid" />
            </div>
            <div>
              <label className="label">Código postal</label>
              <input {...register('codigo_postal')} className="input" placeholder="28001" />
            </div>
          </div>
          <div>
            <label className="label">Notas internas</label>
            <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Notas sobre el cliente..." />
          </div>
          <div className="flex gap-3">
            {id !== 'nuevo' && (
              <button type="button" onClick={() => { setEditing(false); reset(cliente) }} className="btn-secondary flex-1">
                <X size={14}/> Cancelar
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              <Save size={14}/> {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : cliente ? (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-blue-600">
                {cliente.nombre?.[0]}{cliente.apellidos?.[0]}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900">{cliente.nombre} {cliente.apellidos}</p>
              {cliente.dni_nif && <p className="text-sm text-gray-500">{cliente.dni_nif}</p>}
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {cliente.telefono && (
              <a href={`tel:${cliente.telefono}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600">
                <Phone size={14} className="text-gray-400"/>{cliente.telefono}
              </a>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600">
                <Mail size={14} className="text-gray-400"/>{cliente.email}
              </a>
            )}
            {(cliente.direccion || cliente.ciudad) && (
              <p className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin size={14} className="text-gray-400 mt-0.5"/>
                {[cliente.direccion, cliente.ciudad, cliente.codigo_postal].filter(Boolean).join(', ')}
              </p>
            )}
            {cliente.notas && (
              <p className="flex items-start gap-2 text-sm text-gray-600 bg-amber-50 rounded-lg px-3 py-2">
                <FileText size={14} className="text-amber-500 mt-0.5"/>{cliente.notas}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {cliente?.vehiculos?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Vehículos ({cliente.vehiculos.length})</h2>
            <Link to={`/vehiculos/nuevo?cliente=${id}`} className="btn-secondary btn-sm">
              <Plus size={13}/> Añadir
            </Link>
          </div>
          <div className="space-y-2">
            {cliente.vehiculos.filter(v => v.activo).map(v => (
              <Link
                key={v.id}
                to={`/vehiculos/${v.id}`}
                className="card-hover p-4 flex items-center gap-3"
              >
                <Car size={18} className="text-brand-500 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{v.marca} {v.modelo}</p>
                  <p className="text-xs text-gray-500 font-mono">{v.matricula}</p>
                </div>
                <span className="text-xs text-gray-400">{v.anio}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!editing && cliente && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={borrarCliente}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
          >
            Eliminar este cliente
          </button>
        </div>
      )}
    </div>
  )
}
