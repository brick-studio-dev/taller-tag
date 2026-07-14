const ESTADOS = {
  pendiente:         { label: 'Pendiente',          cls: 'badge-yellow' },
  en_proceso:        { label: 'En proceso',          cls: 'badge-blue' },
  esperando_piezas:  { label: 'Esperando piezas',   cls: 'badge-orange' },
  terminado:         { label: 'Terminado',           cls: 'badge-green' },
  entregado:         { label: 'Entregado',           cls: 'badge-gray' },
  cancelado:         { label: 'Cancelado',           cls: 'badge-red' },
}

export default function EstadoBadge({ estado }) {
  const cfg = ESTADOS[estado] ?? { label: estado, cls: 'badge-gray' }
  return <span className={cfg.cls}>{cfg.label}</span>
}

export { ESTADOS }
