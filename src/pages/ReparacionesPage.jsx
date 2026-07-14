import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { reparacionesApi } from '../lib/supabase'
import { Plus, Search, Filter, ChevronRight, Wrench } from 'lucide-react'
import EstadoBadge, { ESTADOS } from '../components/EstadoBadge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ESTADOS).map(([value, { label }]) => ({ value, label }))
]

export default function ReparacionesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reparaciones, setReparaciones] = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState(searchParams.get('estado') || '')
  const [pagina, setPagina] = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, total } = await reparacionesApi.listar({ busqueda, estado: estado || null, pagina })
      setReparaciones(data || [])
      setTotal(total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [busqueda, estado, pagina])

  useEffect(() => { cargar() }, [cargar])

  const handleBusqueda = e => {
    setBusqueda(e.target.value)
    setPagina(1)
  }

  const handleEstado = e => {
    setEstado(e.target.value)
    setPagina(1)
    setSearchParams(e.target.value ? { estado: e.target.value } : {})
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 pb-24 lg:pb-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reparaciones</h1>
          <p className="text-sm text-gray-500">{total} órdenes en total</p>
        </div>
        <Link to="/reparaciones/nueva" className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva orden</span>
        </Link>
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar matrícula, cliente, avería..."
            value={busqueda}
            onChange={handleBusqueda}
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={estado} onChange={handleEstado} className="input pl-9 pr-8 appearance-none min-w-[180px]">
            {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : reparaciones.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay reparaciones</p>
          <p className="text-sm text-gray-400 mt-1">Prueba a cambiar los filtros o crea una nueva</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reparaciones.map(rep => (
            <Link
              key={rep.id}
              to={`/reparaciones/${rep.id}`}
              className="card-hover p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-600">#{rep.numero_orden}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">
                    {rep.marca} {rep.modelo}
                  </span>
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {rep.matricula}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{rep.descripcion_averia}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {rep.cliente_nombre} · {format(parseISO(rep.fecha_entrada), "d MMM yyyy", { locale: es })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <EstadoBadge estado={rep.estado} />
                {rep.total > 0 && (
                  <span className="text-sm font-semibold text-gray-900">
                    {rep.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                )}
              </div>

              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="btn-secondary btn-sm"
          >Anterior</button>
          <span className="text-sm text-gray-500">
            Página {pagina} de {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina >= Math.ceil(total / 20)}
            className="btn-secondary btn-sm"
          >Siguiente</button>
        </div>
      )}
    </div>
  )
}
