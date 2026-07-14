import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../lib/supabase'
import { Wrench, Car, Users, TrendingUp, TrendingDown, ChevronRight, AlertTriangle, Euro } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import EstadoBadge from '../components/EstadoBadge'
import MiniSparkline from '../components/MiniSparkline'

function Tendencia({ valor }) {
  if (valor === null || valor === undefined) return null
  const subiendo = valor >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${subiendo ? 'text-green-600' : 'text-red-500'}`}>
      {subiendo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {subiendo ? '+' : ''}{valor}%
    </span>
  )
}

function StatCard({ icon: Icon, label, value, color, to, sparkline, sparklineKey, tendencia }) {
  const content = (
    <div className={`card p-5 ${to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
            <Tendencia valor={tendencia} />
          </div>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
      {sparkline && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <MiniSparkline data={sparkline} valueKey={sparklineKey} />
        </div>
      )}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function DashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.resumen()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 space-y-4 pb-24 lg:pb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />
      ))}
    </div>
  )

  const hoy = new Date()

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Panel de control</h1>
        <p className="text-sm text-gray-500">
          {format(hoy, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Car} label="Vehículos" value={data?.totalVehiculos}
          color="bg-blue-500" to="/vehiculos"
        />
        <StatCard
          icon={Users} label="Clientes" value={data?.totalClientes}
          color="bg-green-500" to="/clientes"
        />
        <StatCard
          icon={Wrench} label="Reparaciones este mes" value={data?.totalReparacionesMes}
          color="bg-brand-500" to="/reparaciones"
          tendencia={data?.tendenciaReparaciones}
          sparkline={data?.mesesBuckets} sparklineKey="reparaciones"
        />
        <StatCard
          icon={Euro} label={`Facturado en ${data?.anioActual}`}
          value={(data?.totalImporteAnio ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          color="bg-amber-500"
          tendencia={data?.tendenciaImporte}
          sparkline={data?.mesesBuckets} sparklineKey="importe"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Últimas reparaciones */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold text-gray-900">Últimas reparaciones</h2>
            <Link to="/reparaciones" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.ultimasRep ?? []).map(rep => (
              <Link
                key={rep.id}
                to={`/reparaciones/${rep.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {rep.marca} {rep.modelo}
                    <span className="ml-2 font-mono text-xs text-gray-400">{rep.matricula}</span>
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{rep.descripcion_averia}</p>
                </div>
                <EstadoBadge estado={rep.estado} />
              </Link>
            ))}
            {!data?.ultimasRep?.length && (
              <p className="text-center text-sm text-gray-400 py-8">Sin reparaciones recientes</p>
            )}
          </div>
        </div>

        {/* ITV próximas */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold text-gray-900">ITV próximas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.itvProximas ?? []).map(v => {
              const dias = differenceInDays(parseISO(v.proxima_itv), hoy)
              return (
                <Link
                  key={v.id}
                  to={`/vehiculos/${v.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${dias <= 30 ? 'bg-red-100' : dias <= 60 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                    <AlertTriangle size={14} className={
                      dias <= 30 ? 'text-red-500' : dias <= 60 ? 'text-amber-500' : 'text-blue-500'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {v.marca} {v.modelo}
                      <span className="ml-2 font-mono text-xs text-gray-400">{v.matricula}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(v.proxima_itv), "d MMM yyyy", { locale: es })}
                      <span className={`ml-2 font-semibold ${dias <= 30 ? 'text-red-500' : 'text-gray-600'}`}>
                        ({dias <= 0 ? 'Caducada' : `en ${dias} días`})
                      </span>
                    </p>
                  </div>
                </Link>
              )
            })}
            {!data?.itvProximas?.length && (
              <p className="text-center text-sm text-gray-400 py-8">No hay ITV próximas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
