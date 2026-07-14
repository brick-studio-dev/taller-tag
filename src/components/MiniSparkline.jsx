// Mini gráfico de barras (sparkline) para mostrar tendencia mensual
export default function MiniSparkline({ data, valueKey, color = '#E8611A' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((d, i) => {
        const heightPct = Math.max((d[valueKey] / max) * 100, 4)
        const isLast = i === data.length - 1
        return (
          <div
            key={d.key}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${heightPct}%`,
              backgroundColor: isLast ? color : `${color}40`,
            }}
            title={`${d.mes}: ${d[valueKey]}`}
          />
        )
      })}
    </div>
  )
}
