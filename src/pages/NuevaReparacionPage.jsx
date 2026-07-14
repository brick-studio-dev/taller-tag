import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { reparacionesApi, vehiculosApi } from '../lib/supabase'
import { ArrowLeft, Search } from 'lucide-react'

export default function NuevaReparacionPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      fecha_entrada: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
    }
  })

  const [busqVehiculo, setBusqVehiculo] = useState('')
  const [vehiculos, setVehiculos] = useState([])
  const [vehiculoSel, setVehiculoSel] = useState(null)
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    if (busqVehiculo.length < 2) { setVehiculos([]); return }
    setBuscando(true)
    vehiculosApi.listar({ busqueda: busqVehiculo, porPagina: 8 })
      .then(({ data }) => setVehiculos(data || []))
      .catch(console.error)
      .finally(() => setBuscando(false))
  }, [busqVehiculo])

  const seleccionarVehiculo = v => {
    setVehiculoSel(v)
    setValue('vehiculo_id', v.id)
    setVehiculos([])
    setBusqVehiculo('')
  }

  const onSubmit = async datos => {
    try {
      const payload = {
        ...datos,
        // El importe introducido se guarda directamente como subtotal (= total, sin IVA)
        subtotal: datos.importe ? parseFloat(datos.importe) : 0,
      }
      delete payload.importe
      const rep = await reparacionesApi.crear(payload)
      navigate(`/reparaciones/${rep.id}`)
    } catch (e) {
      alert('Error al crear la reparación: ' + e.message)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 pb-24 lg:pb-6 max-w-2xl">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Nueva orden de reparación</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Buscar vehículo */}
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm text-gray-900">Vehículo</h2>

          {vehiculoSel ? (
            <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3">
              <div>
                <p className="font-semibold text-gray-900">{vehiculoSel.marca} {vehiculoSel.modelo}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-mono">{vehiculoSel.matricula}</span> · {vehiculoSel.cliente_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setVehiculoSel(null); setValue('vehiculo_id', '') }}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por matrícula, marca, cliente..."
                value={busqVehiculo}
                onChange={e => setBusqVehiculo(e.target.value)}
                className="input pl-9"
              />
              {(vehiculos.length > 0 || buscando) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {buscando ? (
                    <p className="text-sm text-gray-400 p-3">Buscando...</p>
                  ) : vehiculos.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => seleccionarVehiculo(v)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="font-medium text-sm text-gray-900">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-gray-500">
                        <span className="font-mono">{v.matricula}</span> · {v.cliente_nombre}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <input type="hidden" {...register('vehiculo_id', { required: 'Selecciona un vehículo' })} />
          {errors.vehiculo_id && <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>}
        </div>

        {/* Datos de la orden */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-sm text-gray-900">Datos de la orden</h2>

          <div>
            <label className="label">Fecha entrada</label>
            <input type="date" {...register('fecha_entrada', { required: true })} className="input" />
          </div>

          <div>
            <label className="label">Km al entrar</label>
            <input type="number" {...register('kilometros_entrada')} placeholder="45000" className="input" />
          </div>

          <div>
            <label className="label">Descripción de la avería *</label>
            <textarea
              {...register('descripcion_averia', { required: 'Describe la avería' })}
              rows={4}
              placeholder="El cliente indica que el motor hace un ruido extraño al arrancar en frío..."
              className="input resize-none"
            />
            {errors.descripcion_averia && (
              <p className="text-xs text-red-500 mt-1">{errors.descripcion_averia.message}</p>
            )}
          </div>

          <div>
            <label className="label">Observaciones internas</label>
            <textarea
              {...register('observaciones')}
              rows={2}
              placeholder="Notas para el taller..."
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estado inicial</label>
              <select {...register('estado')} className="input">
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
              </select>
            </div>
            <div>
              <label className="label">Importe (€) <span className="normal-case text-gray-400 font-normal">— opcional</span></label>
              <input
                type="number" step="0.01" min="0"
                {...register('importe')}
                placeholder="0.00"
                className="input"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Puedes dejarlo en blanco y añadir piezas/mano de obra después para calcular el total automáticamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? 'Creando...' : 'Crear orden'}
          </button>
        </div>
      </form>
    </div>
  )
}
