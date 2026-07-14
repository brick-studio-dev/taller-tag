import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { reparacionesApi } from '../lib/supabase'
import EstadoBadge, { ESTADOS } from '../components/EstadoBadge'
import {
  ArrowLeft, Car, User, Wrench, Plus, Trash2,
  CheckCircle2, Edit3, Save, X
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useForm } from 'react-hook-form'

const TIPOS_LINEA = [
  { value: 'mano_obra', label: 'Mano de obra' },
  { value: 'pieza',     label: 'Pieza/Repuesto' },
  { value: 'fluido',    label: 'Fluido/Aceite' },
  { value: 'otro',      label: 'Otro' },
]

function LineaForm({ reparacionId, onAdded }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { tipo: 'mano_obra', descripcion: '', cantidad: 1, precio_unitario: 0, descuento_pct: 0 }
  })

  const onSubmit = async data => {
    try {
      await reparacionesApi.agregarLinea(reparacionId, {
        ...data,
        cantidad: parseFloat(data.cantidad),
        precio_unitario: parseFloat(data.precio_unitario),
        descuento_pct: parseFloat(data.descuento_pct || 0),
      })
      reset()
      onAdded()
    } catch (e) { alert(e.message) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 border-2 border-dashed border-gray-200 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select {...register('tipo')} className="input text-sm">
            {TIPOS_LINEA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className="label">Descripción</label>
          <input {...register('descripcion', { required: true })} placeholder="Cambio de aceite motor..." className="input text-sm" />
        </div>
        <div>
          <label className="label">Referencia</label>
          <input {...register('referencia')} placeholder="REF-001" className="input text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Cantidad</label>
          <input {...register('cantidad')} type="number" step="0.001" min="0.001" className="input text-sm" />
        </div>
        <div>
          <label className="label">Precio €</label>
          <input {...register('precio_unitario')} type="number" step="0.01" min="0" className="input text-sm" />
        </div>
        <div>
          <label className="label">Dto. %</label>
          <input {...register('descuento_pct')} type="number" step="0.1" min="0" max="100" className="input text-sm" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? '...' : <><Plus size={14}/> Añadir</>}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function ReparacionDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rep, setRep]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [editEstado, setEditEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')

  const borrarReparacion = async () => {
    if (!confirm('¿Seguro que quieres borrar esta orden? Esta acción no se puede deshacer.')) return
    try {
      await reparacionesApi.eliminar(id)
      navigate('/reparaciones')
    } catch(e) { alert(e.message) }
  }

  const cargar = async () => {
    try {
      const data = await reparacionesApi.obtener(id)
      setRep(data)
      setNuevoEstado(data.estado)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [id])

  const cambiarEstado = async () => {
    setSaving(true)
    try {
      await reparacionesApi.actualizar(id, {
        estado: nuevoEstado,
        ...(nuevoEstado === 'entregado' ? { fecha_salida: new Date().toISOString().split('T')[0] } : {})
      })
      setEditEstado(false)
      await cargar()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const eliminarLinea = async lineaId => {
    if (!confirm('¿Eliminar esta línea?')) return
    await reparacionesApi.eliminarLinea(lineaId)
    await cargar()
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
    </div>
  )

  if (!rep) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Reparación no encontrada</p>
      <Link to="/reparaciones" className="btn-secondary mt-4 inline-flex">Volver</Link>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 space-y-5 pb-24 lg:pb-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              Orden #{rep.numero_orden}
            </h1>
            {editEstado ? (
              <div className="flex items-center gap-2">
                <select
                  value={nuevoEstado}
                  onChange={e => setNuevoEstado(e.target.value)}
                  className="input text-sm py-1.5 px-3"
                >
                  {Object.entries(ESTADOS).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
                <button onClick={cambiarEstado} disabled={saving} className="btn-primary btn-sm">
                  <Save size={13} />{saving ? '...' : 'Guardar'}
                </button>
                <button onClick={() => setEditEstado(false)} className="btn-ghost btn-sm"><X size={13}/></button>
              </div>
            ) : (
              <button onClick={() => setEditEstado(true)} className="flex items-center gap-1.5 group">
                <EstadoBadge estado={rep.estado} />
                <Edit3 size={12} className="text-gray-400 group-hover:text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Entrada: {rep.fecha_entrada ? format(parseISO(rep.fecha_entrada), "d 'de' MMMM yyyy", { locale: es }) : '—'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">

  

      {/* Vehículo */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Vehículo</h2>
          </div>
          <Link to={`/vehiculos/${rep.vehiculo_id}`} className="group">
            <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
              {rep.marca} {rep.modelo}
              {rep.version && <span className="font-normal text-gray-500 ml-1 text-sm">{rep.version}</span>}
            </p>
            <p className="font-mono text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-md mt-1">
              {rep.matricula}
            </p>
          </Link>
          {rep.kilometros_entrada && (
            <p className="text-sm text-gray-500">
              Km entrada: <span className="font-medium text-gray-900">{rep.kilometros_entrada.toLocaleString()}</span>
            </p>
          )}
        </div>

        {/* Cliente */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Cliente</h2>
          </div>
          <p className="font-bold text-gray-900">{rep.cliente_nombre}</p>
          {rep.cliente_telefono && (
            <a href={`tel:${rep.cliente_telefono}`} className="text-sm text-brand-600 hover:underline">
              {rep.cliente_telefono}
            </a>
          )}
          {rep.tecnico_nombre && (
            <p className="text-sm text-gray-500">
              Técnico: <span className="font-medium text-gray-900">{rep.tecnico_nombre}</span>
            </p>
          )}
        </div>
      </div>

      {/* Avería */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-brand-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Avería descrita</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{rep.descripcion_averia}</p>
        {rep.trabajos_realizados && (
          <>
            <hr className="border-gray-100"/>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trabajos realizados</p>
            <p className="text-sm text-gray-700 leading-relaxed">{rep.trabajos_realizados}</p>
          </>
        )}
        {rep.observaciones && (
          <>
            <hr className="border-gray-100"/>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Observaciones</p>
            <p className="text-sm text-gray-700">{rep.observaciones}</p>
          </>
        )}
      </div>

      {/* Líneas de facturación */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Trabajos y piezas</h2>

        {rep.lineas?.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Cant.</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Precio</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Importe</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rep.lineas.map(linea => (
                  <tr key={linea.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{linea.descripcion}</p>
                      {linea.referencia && <p className="text-xs text-gray-400 mt-0.5">{linea.referencia}</p>}
                      <p className="text-xs text-gray-400 sm:hidden">
                        {linea.cantidad} × {linea.precio_unitario?.toFixed(2)}€
                        {linea.descuento_pct > 0 && ` − ${linea.descuento_pct}%`}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 hidden sm:table-cell">{linea.cantidad}</td>
                    <td className="px-3 py-3 text-right text-gray-700 hidden sm:table-cell">
                      {linea.precio_unitario?.toFixed(2)} €
                      {linea.descuento_pct > 0 && (
                        <span className="block text-xs text-green-600">−{linea.descuento_pct}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {linea.importe?.toFixed(2)} €
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => eliminarLinea(linea.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900 hidden sm:table-cell">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-brand-600">
                    {rep.total?.toFixed(2)} €
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {(!rep.lineas || rep.lineas.length === 0) && rep.total > 0 && (
          <div className="card p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Importe registrado al crear la orden</p>
            <p className="font-bold text-lg text-brand-600">{rep.total.toFixed(2)} €</p>
          </div>
        )}

        {/* Formulario añadir línea */}
        <LineaForm reparacionId={id} onAdded={cargar} />
      </div>

      {/* Pago */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className={rep.pagado ? 'text-green-500' : 'text-gray-300'} />
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {rep.pagado ? 'Pagado' : 'Pendiente de pago'}
            </p>
            {rep.pagado && rep.fecha_pago && (
              <p className="text-xs text-gray-500">
                {format(parseISO(rep.fecha_pago), "d MMM yyyy", { locale: es })}
                {rep.forma_pago && ` · ${rep.forma_pago}`}
              </p>
            )}
          </div>
        </div>
        {!rep.pagado && (
          <button
            onClick={async () => {
              await reparacionesApi.actualizar(id, {
                pagado: true,
                fecha_pago: new Date().toISOString().split('T')[0],
                forma_pago: 'efectivo',
              })
              cargar()
            }}
            className="btn-primary btn-sm"
          >
            Marcar pagado
          </button>
        )}
      </div>
      {/* Borrar orden - zona discreta al final */}
      <div className="flex justify-center pt-2 pb-4">
        <button
          onClick={borrarReparacion}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
        >
          Eliminar esta orden de trabajo
        </button>
      </div>
    </div>
  )
}