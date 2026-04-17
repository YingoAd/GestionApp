export const getLunes = (d = new Date()) => {
  const x = new Date(d)
  const dy = x.getDay()
  x.setDate(x.getDate() + (dy === 0 ? -6 : 1 - dy))
  x.setHours(0, 0, 0, 0)
  return x
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const d2s = d => d.toISOString().split('T')[0]
export const s2d = s => new Date(s + 'T00:00:00')

export const fDate = s => {
  if (!s) return '--'
  return s2d(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const fARS = v => {
  if (!v && v !== 0) return '--'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)
}

export const fUSD = v => {
  if (!v && v !== 0) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v)
}

export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

export const diasDesde = s => {
  const d = s2d(s)
  const h = new Date()
  h.setHours(0, 0, 0, 0)
  return Math.floor((h - d) / 86400000)
}

export const getAlert = (p, cfg) => {
  if (p.estado === 'Pagado' || p.estado === 'Emitido' || p.estado === 'Debitado') return 'ok'
  
  const esDiferido = p.tipoPago === 'CHQ' || (p.tipoPago && p.tipoPago.startsWith('Echeq'))
  
  // Diferidos no entran en alertas generales
  if (esDiferido) return 'ok'
  
  const dd = diasDesde(p.fechaCarga)
  if (dd >= cfg.diasAlertaDemora * 2) return 'red'
  if (dd >= cfg.diasAlertaDemora) return 'yellow'
  return 'green'
}

export const getWeekId = d => d2s(getLunes(d))