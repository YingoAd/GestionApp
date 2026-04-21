import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DEF_CONCEPTOS = ["MATERIALES","MANO DE OBRA","AGUA","VOLQUETE","BAÑO QUIMICO","LUZ","MOVIMIENTO","SSHHxDIA","MONOTRIBUTO","ALQUILER","CONTABLE","HERRAMIENTAS","EQUIPOS","PAGOS","CUOTA","CERTIFICACION","EPP","INDUMENTARIA","INSUMOS","OBRA SOCIAL","IMPUESTO","ANTECEDENTES","BIM","META","FCL","UOCRA","MANTENIMIENTO","AGRIMENSOR","AUTONOMOS","931","MATRICULA","IIBB","IMPRESIONES","PUBLICIDAD","SEGUROS","VIATICOS","COMBUSTIBLE","EXPENSAS","SINDICATO","PREOCUPACIONAL","INTERNET","D5","INTERES","ASIGNAR","TELEFONO","LEGALES","IERIC","COMIDA","CREDITO-DEBITO","INTERESES","COMISION","CHEQUE","INGENIERO","ALARMA","BOX","INSTALACIONES","DIRECCION","ADMINISTRACION","APR","FINNEGANS","GANANCIAS","ABOGADO","FOTOGRAFIA","HONORARIOS","HABERES","SUELDO","IVA","LIBRERIA","LOGISTICA","GESTORIA","SOCIO","SSHH","FINANCIERO","ESCRIBANIA"]

const DEF_RUBROS = ["01-T.PRELIMINARES","02-MOV.SUELOS","03-FUNDACIONES","03E-FUNDACIONES(encofrado)","04-ESTRUCTURA Hº Aº","04E-ESTRUCTURA Hº Aº(encofrado)","05-ESTRUC.METALICA","06-MAMPOSTERIA","07-CONTRAPISO","08-CARPETA","09-REVOQUES","10-IMPERM. CUBIERTA","11-INSTA.CLOACAL","12-INSTA.PLUVIAL","13-INSTA.AGUA","14-INSTA.GAS","15-INSTA.ELECTRICA","16-INSTA.PISO RADIANTE","17-INSTA.AA","18-INSTA.ALARMA","19-CARPINTERIAS","20-HERRERIA","21-ZINGUERIA","22-PINTURA","23-CIELORRASOS","24-PISOS INT.","24-PISOS EXT.","24-ZOCALOS","25-REVEST.INT","26-REVEST.EXT","27-MARMOLERIA","28-PUERTAS.EXT","29-PUERTAS.INT","30-ARTEF.SANITARIOS","31-ARTEF.GAS","32-ARTEF.ILUMINACION","33-ARTEF.PISO RADIANTE","34-ARTEF.AA","35-ARTEF.ALARMA","36-MOBILIARIO","37-EQUIPAMIENTO","38-ELECTRODOMESTICOS","39-PILETA","40-PARQUIZACION","41-AYUDA GREMIO","42-LIMPIEZA OBRA","43-ESTRUC CUB Y CHAPA","44-INSTA.INCENDIOS","45-ASCENSORES","46-PUESTA EN MARCHA","47-INSTA.DATOS","48-ARTEF.INCENDIO","49-OBRA COMPLEMENTARIA","50-INFRAESTRUCTURA","Z.01-GASTOS FISICOS","Z.02-GASTOS DIRECTOS","Z.03-RRHH","Z.04-SSHH","Z.05-HONORARIOS","Z.06-HON.EXTERNOS","Z.07-HERRAMIENTAS y EQ","Z.08-LOGISTICA","Z.09-MARCA","Z.10-DESARROLLO","Z.11-COMERCIALIZACION","Z.12-TIERRA","Z.19-REDES","Z.20-IMPUESTOS","Z.21-BANCARIOS","ZZ.VENTA","ASIGNAR","MOVIMIENTO","FINANCIERO","ZZ.INGRESO"]

function mkU(pre, id, cond, prop) {
  return { id: `${pre}-${id}`, uf: id, condicion: cond || 'Vacante', propietario: prop || '' }
}

function buildObras() {
  const pellegrini = {
    id: 'PELLEGRINI', nombre: 'Foresta Pellegrini', niveles: [
      { nombre: 'Planta baja', ufs: [
        mkU('PEL','Cochera 1'), mkU('PEL','Cochera 2','Vendida','Marta Brunori'), mkU('PEL','Cochera 3','Vendida','Marta Brunori'),
        mkU('PEL','Cochera 4'), mkU('PEL','Cochera 5'), mkU('PEL','Cochera 6','Reservada','DO'),
        mkU('PEL','Cochera 7'), mkU('PEL','Cochera 8'), mkU('PEL','Cochera 9'), mkU('PEL','Cochera 10','Vendida','Enrique Codorelli'),
      ]},
      { nombre: 'Primer piso', ufs: [
        mkU('PEL','UF1','Reservada','DO: Martin Husson'), mkU('PEL','UF2','Vendida','Marta Brunori'),
        mkU('PEL','UF3','Reservada','Sanicentro'), mkU('PEL','UF4'), mkU('PEL','UF5'),
        mkU('PEL','UF6','Reservada','DO: Pensamiento Visual'),
      ]},
      { nombre: 'Segundo piso', ufs: [
        mkU('PEL','UF7'), mkU('PEL','UF8'), mkU('PEL','UF9','Reservada','DO: Arraigo'), mkU('PEL','UF10','Vendida','Enrique Codorelli'),
      ]},
    ]
  }

  const alvear = {
    id: 'ALVEAR', nombre: 'Foresta Alvear', niveles: [
      { nombre: 'Planta baja', ufs: [
        mkU('ALV','Cochera 1'), mkU('ALV','Cochera 2'), mkU('ALV','Cochera 3'),
        mkU('ALV','Cochera 4','Vendida','Lorenzi Gabriel'), mkU('ALV','Cochera 5','Pago de tierra','Pago de tierra'),
        mkU('ALV','Cochera 6'), mkU('ALV','Cochera 7','Canje','H Robustelli'), mkU('ALV','Cochera 8','Pago de tierra','Pago de tierra'),
        mkU('ALV','Cochera 9','Vendida','Mariano Campos'), mkU('ALV','Cochera 10','Reservada','DO: Arraigo'),
        mkU('ALV','Cochera 11','Reservada','DO: Cuatro lados'), mkU('ALV','Cochera 12'), mkU('ALV','Cochera 13'),
        mkU('ALV','Cochera 14'), mkU('ALV','Cochera 15'), mkU('ALV','Cochera 16'),
        mkU('ALV','Cochera 17','Reservada','DO: Pensamiento Visual'), mkU('ALV','Cochera 18','Vendida','Ricardo Akita'),
        mkU('ALV','Cochera 19','Vendida','Ricardo Akita'), mkU('ALV','Cochera 20','Reservada','DO: Pensamiento Visual + Punto2'),
        mkU('ALV','Local'),
      ]},
      { nombre: 'Primer piso', ufs: [
        mkU('ALV','UF1'), mkU('ALV','UF2'), mkU('ALV','UF3','Canje','Construye al Costo'),
        mkU('ALV','UF4','Reservada','DO: Pensamiento Visual + Punto2'), mkU('ALV','UF5','Pago de tierra','Pago de tierra'),
        mkU('ALV','UF6'), mkU('ALV','UF7'), mkU('ALV','UF8','Pago de tierra','Pago de tierra'),
      ]},
      { nombre: 'Segundo piso', ufs: [
        mkU('ALV','UF9','Vendida','Mariano Campos'), mkU('ALV','UF10','Canje','Construye al Costo'),
        mkU('ALV','UF11','Reservada','DO: Cuatro lados'), mkU('ALV','UF12'), mkU('ALV','UF13'),
        mkU('ALV','UF14','Reservada','DO: Arraigo'), mkU('ALV','UF15'), mkU('ALV','UF16'),
      ]},
      { nombre: 'Tercer piso', ufs: [
        mkU('ALV','UF17','Reservada','DO: Pensamiento Visual'), mkU('ALV','UF18','Vendida','Ricardo Akita'),
        mkU('ALV','UF19','Vendida','Ricardo Akita'), mkU('ALV','UF20','Canje','H Robustelli'),
        mkU('ALV','UF21','Vendida','Lorenzi Gabriel'),
      ]},
    ]
  }

  const terral = {
    id: 'TERRAL', nombre: 'Terral al Mar', torres: [
      { id: 'OESTE', nombre: 'Torre Oeste', niveles: [
        { nombre: 'Subsuelo', ufs: [
          ...['CO01','CO02','CO03','CO04','CO05','CO06','CO07','CO08'].map(u => mkU('TMO',u)),
          mkU('TMO','CO09','Reservada','Uriel / Octavio'),
          ...['CO10','CO11','CO12','CO13','CO14','CO15','CO16','CO17'].map(u => mkU('TMO',u)),
          mkU('TMO','BO1'), mkU('TMO','BO2'), mkU('TMO','BO3','Reservada','Uriel / Octavio'),
          mkU('TMO','BO4'), mkU('TMO','BO5'), mkU('TMO','BO6'),
        ]},
        { nombre: 'Planta Baja', ufs: [mkU('TMO','UF1'), mkU('TMO','UF2','Reservada','Uriel / Octavio'), mkU('TMO','UF3')] },
        { nombre: 'Nivel 1', ufs: [mkU('TMO','UF4','Reservada','Construye al Costo'), mkU('TMO','UF5'), mkU('TMO','UF6'), mkU('TMO','UF7','Reservada','Pago de tierra')] },
        { nombre: 'Nivel 2', ufs: [mkU('TMO','UF8'), mkU('TMO','UF9'), mkU('TMO','UF10'), mkU('TMO','UF11','Reservada','Pago de tierra')] },
        { nombre: 'Nivel 3', ufs: [mkU('TMO','UF12'), mkU('TMO','UF13'), mkU('TMO','UF14','Reservada','Desarrollador'), mkU('TMO','UF15','Reservada','Pago de tierra')] },
        { nombre: 'Nivel 4', ufs: [mkU('TMO','UF16'), mkU('TMO','UF17','Reservada','Rafael Brigo'), mkU('TMO','UF18','Reservada','Desarrollador'), mkU('TMO','UF19','Reservada','Pago de tierra')] },
        { nombre: 'Nivel 5', ufs: [mkU('TMO','UF20'), mkU('TMO','UF21','Vendida','Carlos - Javier'), mkU('TMO','UF22','Reservada','Desarrollador'), mkU('TMO','UF23','Reservada','Pago de tierra')] },
      ]},
      { id: 'ESTE', nombre: 'Torre Este', niveles: [
        { nombre: 'Subsuelo', ufs: [
          ...['CE1','CE2','CE3','CE4','CE5','CE6','CE7','CE8'].map(u => mkU('TME',u)),
          mkU('TME','CE9','Vendida','Carlos Moncada'), mkU('TME','CE10','Vendida','Nicolas / Ruben Karaguezian'),
          mkU('TME','CE11'), mkU('TME','CE12'),
          mkU('TME','CE13','Vendida','Teresa Prieto'), mkU('TME','CE14','Vendida','Pablo - Maria Andrada'),
          mkU('TME','CE15'), mkU('TME','CE16'), mkU('TME','CE17','Reservada','Carlos Scatizza'),
          mkU('TME','BE1'), mkU('TME','BE2'), mkU('TME','BE3'),
          mkU('TME','BE4','Vendida','Carlos Moncada'), mkU('TME','BE5'),
          mkU('TME','BE6','Vendida','Nicolas / Ruben Karaguezian'),
        ]},
        { nombre: 'Planta Baja', ufs: [mkU('TME','UF24'), mkU('TME','UF25','Vendida','Carlos Moncada'), mkU('TME','UF26')] },
        { nombre: 'Nivel 1', ufs: [mkU('TME','UF27','Reservada','Construye al Costo'), mkU('TME','UF28'), mkU('TME','UF29','Vendida','Pablo - Maria Andrada'), mkU('TME','UF30')] },
        { nombre: 'Nivel 2', ufs: [mkU('TME','UF31'), mkU('TME','UF32'), mkU('TME','UF33'), mkU('TME','UF34','Reservada','Pago de tierra')] },
        { nombre: 'Nivel 3', ufs: [mkU('TME','UF35','Reservada','Desarrollador'), mkU('TME','UF36','Vendida','Carlos Scatizza'), mkU('TME','UF37','Vendida','Teresa Prieto'), mkU('TME','UF38','Reservada','Pago de tierra')] },
        { nombre: 'Nivel 4', ufs: [mkU('TME','UF39','Reservada','Desarrollador'), mkU('TME','UF40','Vendida','Gaston Rey'), mkU('TME','UF41','Vendida','Nicolas / Ruben Karaguezian'), mkU('TME','UF42')] },
        { nombre: 'Nivel 5', ufs: [mkU('TME','UF43','Reservada','Desarrollador'), mkU('TME','UF44'), mkU('TME','UF45','Vendida','Otto Ritondale'), mkU('TME','UF46','Vendida','Gustavo Sotera')] },
      ]},
    ]
  }

  return { PELLEGRINI: pellegrini, ALVEAR: alvear, TERRAL: terral }
}

const DEFAULT_CONFIG = {
  obras: ['Sin obra asignada','TERRAL AL MAR','PELLEGRINI','ALVEAR','E-PASTOR','YINGO','Z09-MARCA'],
  rubros: DEF_RUBROS,
  conceptos: DEF_CONCEPTOS,
  alertConfig: { diasAlertaDemora: 7, diasAlertaEcheq: 5, diasAlertaCheque: 20, diasSinNumerar: 5 },
  obrasUF: buildObras(),
}

let _listeners = []
let _data = {
  pagos: [],
  proveedores: [],
  ingresos: {},
  ...DEFAULT_CONFIG,
  loading: true,
}
// Corrimiento automatico de fechas diferidos
const hoy = new Date()
hoy.setHours(hoy.getHours() - 3) // UTC-3 Argentina
hoy.setHours(0,0,0,0)

const nextHabil = (fechaStr) => {
  const d = new Date(fechaStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  const dia = d.getDay()
  if (dia === 6) d.setDate(d.getDate() + 2) // sabado -> lunes
  if (dia === 0) d.setDate(d.getDate() + 1) // domingo -> lunes
  return d.toISOString().split('T')[0]
}

const pagosCorregidos = []
_data.pagos = _data.pagos.map(p => {
  const esDiferido = p.tipoPago === 'CHQ' || (p.tipoPago && p.tipoPago.startsWith('Echeq'))
  if (!esDiferido || p.estado !== 'Emitido' || !p.fechaPago) return p
  const fechaVcto = new Date(p.fechaPago + 'T00:00:00')
  if (fechaVcto >= hoy) return p
  const nuevaFecha = nextHabil(p.fechaPago)
  // Guardar fecha original si no existe
  const fechaOriginal = p.fechaVctoOriginal || p.fechaPago
  pagosCorregidos.push({ ...p, fechaPago: nuevaFecha, fechaVctoOriginal: fechaOriginal })
  return { ...p, fechaPago: nuevaFecha, fechaVctoOriginal: fechaOriginal }
})

if (pagosCorregidos.length > 0) {
  pagosCorregidos.forEach(p => {
    supabase.from('pagos').update({ 
      fecha_pago: p.fechaPago,
      fecha_vcto_original: p.fechaVctoOriginal
    }).eq('id', p.id)
  })
}

// Sincronizar corrimientos a Supabase en background
if (pagosCorregidos.length > 0) {
  pagosCorregidos.forEach(p => {
    supabase.from('pagos').update({ fecha_pago: p.fechaPago }).eq('id', p.id)
  })
}
function notify() {
  _listeners.forEach(fn => fn({ ..._data }))
}

async function loadFromSupabase() {
  try {
    // Cargar pagos
    const { data: pagos } = await supabase.from('pagos').select('*').order('created_at', { ascending: false })
    
    // Cargar proveedores
    const { data: proveedores } = await supabase.from('proveedores').select('*').order('created_at', { ascending: false })
    
    // Cargar ingresos
    const { data: ingresosRaw } = await supabase.from('ingresos').select('*').order('created_at', { ascending: false })
    
    // Cargar config
    const { data: configRaw } = await supabase.from('config').select('*').eq('id', 1).single()

    // Convertir pagos al formato de la app
    const pagosConvertidos = (pagos || []).map(p => ({
      id: p.id,
      fechaCarga: p.fecha_carga,
      fechaPago: p.fecha_pago,
      proveedor: p.proveedor,
      obra: p.obra,
      rubro: p.rubro,
      concepto: p.concepto,
      detalle: p.detalle,
      recibo: p.recibo,
      nroComprobante: p.nro_comprobante,
      tipoPago: p.tipo_pago,
      formaPago: p.forma_pago,
      cuenta: p.cuenta,
      gastoARS: p.gasto_ars,
      gastoUSD: p.gasto_usd,
      estado: p.estado,
      obs: p.obs,
      fechaVctoOriginal: p.fecha_vcto_original || null,
    }))

    // Convertir proveedores
    const proveedoresConvertidos = (proveedores || []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      razonSocial: p.razon_social,
      rubro: p.rubro,
      desc: p.descripcion,
    }))

    // Convertir ingresos a objeto por uf_id
    const ingresosObj = {}
    ;(ingresosRaw || []).forEach(i => {
      if (!ingresosObj[i.uf_id]) ingresosObj[i.uf_id] = []
      ingresosObj[i.uf_id].push({
        id: i.id,
        ufId: i.uf_id,
        fecha: i.fecha,
        concepto: i.concepto,
        detalle: i.detalle,
        montoARS: i.monto_ars,
        montoUSD: i.monto_usd,
        formaPago: i.forma_pago,
        cuenta: i.cuenta,
        obs: i.obs,
      })
    })

    // Config
    const cfg = configRaw || {}

    _data = {
  pagos: pagosConvertidos,
  proveedores: proveedoresConvertidos,
  ingresos: ingresosObj,
  obras: cfg.obras || DEFAULT_CONFIG.obras,
  rubros: cfg.rubros || DEFAULT_CONFIG.rubros,
  conceptos: cfg.conceptos || DEFAULT_CONFIG.conceptos,
  alertConfig: cfg.alert_config ? {
  diasAlertaDemora: cfg.alert_config.diasAlertaDemora || 7,
  diasAlertaEcheq: cfg.alert_config.diasAlertaEcheq || 5,
  diasAlertaCheque: cfg.alert_config.diasAlertaCheque || 20,
  diasSinNumerar: cfg.alert_config.diasSinNumerar || 5,
} : DEFAULT_CONFIG.alertConfig,
  obrasUF: cfg.obras_uf || DEFAULT_CONFIG.obrasUF,
  cuentas: cfg.cuentas || [
    { nombre: "BCOOP-024049/5", desc: "" },
    { nombre: "BCOOP-013170/4", desc: "" },
    { nombre: "BCOOP-023030/2", desc: "" },
    { nombre: "BCOOP-023519/2", desc: "" },
    { nombre: "BGAL-0376/9", desc: "" },
    { nombre: "BNACION-427310", desc: "" },
    { nombre: "BNACION-26157", desc: "" },
    { nombre: "BPROV-91613/2", desc: "" },
    { nombre: "CAJA JERE", desc: "" },
    { nombre: "MARTIN.P-USD", desc: "" },
  ],
  planPago: {},
  loading: false,
}
  } catch(e) {
    console.error('Error cargando datos:', e)
    _data = { ..._data, loading: false }
  }
  notify()
}

loadFromSupabase()

export function useStore() {
  const [data, setData] = useState({ ..._data })

  useEffect(() => {
    const fn = (d) => setData(d)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(l => l !== fn) }
  }, [])

  const update = async (fn) => {
    const newData = fn({ ..._data })
    _data = newData
    notify()

    // Detectar qué cambió y sincronizar con Supabase
    await syncToSupabase(newData)
  }

  return { data, update }
}

async function syncToSupabase(data) {
  try {
    // Sync pagos
    if (data._pagoChanged) {
      const p = data._pagoChanged
      await supabase.from('pagos').upsert({
        id: p.id,
        fecha_carga: p.fechaCarga,
        fecha_pago: p.fechaPago || null,
        proveedor: p.proveedor,
        obra: p.obra,
        rubro: p.rubro,
        concepto: p.concepto,
        detalle: p.detalle,
        recibo: p.recibo,
        nro_comprobante: p.nroComprobante,
        tipo_pago: p.tipoPago,
        forma_pago: p.formaPago,
        cuenta: p.cuenta,
        gasto_ars: p.gastoARS,
        gasto_usd: p.gastoUSD,
        estado: p.estado,
        obs: p.obs,
        fecha_vcto_original: p.fechaVctoOriginal || null,
      })
    }

    if (data._pagoDeleted) {
      await supabase.from('pagos').delete().eq('id', data._pagoDeleted)
    }

    if (data._proveedorChanged) {
      const p = data._proveedorChanged
      await supabase.from('proveedores').upsert({
        id: p.id,
        nombre: p.nombre,
        razon_social: p.razonSocial,
        rubro: p.rubro,
        descripcion: p.desc,
      })
    }

    if (data._proveedorDeleted) {
      await supabase.from('proveedores').delete().eq('id', data._proveedorDeleted)
    }

    if (data._ingresoChanged) {
      const i = data._ingresoChanged
      await supabase.from('ingresos').upsert({
        id: i.id,
        uf_id: i.ufId,
        fecha: i.fecha,
        concepto: i.concepto,
        detalle: i.detalle,
        monto_ars: i.montoARS,
        monto_usd: i.montoUSD,
        forma_pago: i.formaPago,
        cuenta: i.cuenta,
        obs: i.obs,
      })
    }

    if (data._ingresoDeleted) {
      await supabase.from('ingresos').delete().eq('id', data._ingresoDeleted)
    }

    if (data._configChanged) {
      await supabase.from('config').upsert({
  id: 1,
  obras: data.obras,
  rubros: data.rubros,
  conceptos: data.conceptos,
  alert_config: data.alertConfig,
  obras_uf: data.obrasUF,
  cuentas: data.cuentas,
})
    }
  } catch(e) {
    console.error('Error sincronizando:', e)
  }
}