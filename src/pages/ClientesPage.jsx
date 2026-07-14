import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { clientesApi } from '../lib/supabase'
import { Plus, Search, Users, ChevronRight, Phone } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, total } = await clientesApi.listar({ busqueda, pagina })
      setClientes(data || [])
      setTotal(total || 0)
    } finally { setLoading(false) }
  }, [busqueda, pagina])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="p-4 lg:p-6 space-y-4 pb-24 lg:pb-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{total} clientes registrados</p>
        </div>
        <Link to="/clientes/nuevo" className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo cliente</span>
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar por nombre, DNI, teléfono..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          className="input pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
        </div>
      ) : clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map(c => (
            <Link
              key={c.id}
              to={`/clientes/${c.id}`}
              className="card-hover p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">
                  {c.nombre?.[0]}{c.apellidos?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{c.nombre} {c.apellidos}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {c.dni_nif && <span className="text-xs text-gray-400">{c.dni_nif}</span>}
                  {c.telefono && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone size={11}/>{c.telefono}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="btn-secondary btn-sm">
            Anterior
          </button>
          <span className="text-sm text-gray-500">Página {pagina} de {Math.ceil(total / 20)}</span>
          <button onClick={() => setPagina(p => p + 1)} disabled={pagina >= Math.ceil(total / 20)} className="btn-secondary btn-sm">
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
