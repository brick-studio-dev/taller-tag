import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { vehiculosApi } from '../lib/supabase'
import { Plus, Search, Car, ChevronRight } from 'lucide-react'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, total } = await vehiculosApi.listar({ busqueda, pagina })
      setVehiculos(data || [])
      setTotal(total || 0)
    } finally { setLoading(false) }
  }, [busqueda, pagina])

  useEffect(() => { cargar() }, [cargar])

  const COMBUSTIBLE_ICON = {
    gasolina: '⛽', diesel: '🛢️', electrico: '⚡', hibrido: '🔋',
    hibrido_enchufable: '🔌', glp: '🟢', otro: '❓'
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 pb-24 lg:pb-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-sm text-gray-500">{total} vehículos</p>
        </div>
        <Link to="/vehiculos/nuevo" className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo vehículo</span>
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar matrícula, marca, modelo, propietario..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          className="input pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
        </div>
      ) : vehiculos.length === 0 ? (
        <div className="card p-12 text-center">
          <Car size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron vehículos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehiculos.map(v => (
            <Link
              key={v.id}
              to={`/vehiculos/${v.id}`}
              className="card-hover p-4 flex items-center gap-4"
            >
              {v.foto_url ? (
                <img
                  src={v.foto_url}
                  alt={`${v.marca} ${v.modelo}`}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                  {COMBUSTIBLE_ICON[v.tipo_combustible] ?? '🚗'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900">
                    {v.marca} {v.modelo}
                  </span>
                  {v.anio && <span className="text-xs text-gray-400">{v.anio}</span>}
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {v.matricula}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{v.cliente_nombre}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="btn-secondary btn-sm">Anterior</button>
          <span className="text-sm text-gray-500">Página {pagina} de {Math.ceil(total / 20)}</span>
          <button onClick={() => setPagina(p => p + 1)} disabled={pagina >= Math.ceil(total / 20)} className="btn-secondary btn-sm">Siguiente</button>
        </div>
      )}
    </div>
  )
}
