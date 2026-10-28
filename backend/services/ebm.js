const { randomUUID } = require('crypto')

const vsdcBaseUrl = (process.env.VSDC_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
const tin = process.env.EBM_TIN || ''
const bhfId = process.env.EBM_BHF_ID || '00'
const regrId = process.env.EBM_REGR_ID || 'SYSTEM'
const regrNm = process.env.EBM_REGR_NM || 'MINIFOUR'
const modrId = process.env.EBM_MODR_ID || 'SYSTEM'
const modrNm = process.env.EBM_MODR_NM || 'MINIFOUR'

const isConfigured = () => Boolean(tin && bhfId && vsdcBaseUrl)

const formatDateTime = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

const formatDate = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`
}

const postToVsdc = async (path, body) => {
  const url = `${vsdcBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.EBM_TIMEOUT_MS || 30000))
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) throw new Error(data?.resultMsg || data?.message || `VSDC error ${res.status}`)
  return data
}

const sendSalesInvoice = async (order) => {
  if (!isConfigured()) throw new Error('EBM not configured')
  
  const invcNo = Number(order._id.toString().slice(-9))
  const now = new Date()
  const cfmDt = formatDateTime(now)
  const salesDt = formatDate(now)
  const stockRlsDt = cfmDt
  
  const items = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity || 1)
    const prc = Number(item.price || 0)
    const splyAmt = qty * prc
    const taxRt = 18
    const taxblAmt = Math.round(splyAmt / 1.18 * 100) / 100
    const taxAmt = Math.round((splyAmt - taxblAmt) * 100) / 100
    return {
      itemSeq: idx + 1,
      itemCd: item.ebmItemCd || process.env.EBM_DEFAULT_ITEM_CD || 'ITEM001',
      itemClsCd: item.ebmItemClsCd || process.env.EBM_DEFAULT_ITEM_CLS_CD || '0000000000',
      itemNm: item.name,
      bcd: null,
      pkgUnitCd: 'NT',
      pkg: qty,
      qtyUnitCd: 'U',
      qty: qty,
      prc: prc,
      splyAmt: splyAmt,
      dcRt: 0,
      dcAmt: 0,
      isrccCd: null,
      isrccNm: null,
      isrcRt: null,
      isrcAmt: null,
      taxTyCd: 'B',
      taxblAmt: taxblAmt,
      taxAmt: taxAmt,
      totAmt: splyAmt
    }
  })
  
  const subtotal = Number(order.subtotal || 0)
  const taxblAmtB = Math.round(subtotal / 1.18 * 100) / 100
  const taxAmtB = Math.round((subtotal - taxblAmtB) * 100) / 100
  
  const body = {
    tin,
    bhfId,
    invcNo,
    orgInvcNo: 0,
    custTin: order.customerTin || null,
    custNm: order.guestName || order.address?.firstName || 'Customer',
    salesTyCd: 'N',
    rcptTyCd: order.tableNumber ? 'S' : 'S',
    pmtTyCd: order.paymentMethod === 'MTN Mobile Money' ? '03' : '01',
    salesSttsCd: '02',
    cfmDt,
    salesDt,
    stockRlsDt,
    cnclReqDt: null,
    cnclDt: null,
    rfdDt: null,
    rfdRsnCd: null,
    totItemCnt: items.length,
    taxblAmtA: 0, taxblAmtB, taxblAmtC: 0, taxblAmtD: 0,
    taxRtA: 0, taxRtB: 18, taxRtC: 0, taxRtD: 0,
    taxAmtA: 0, taxAmtB, taxAmtC: 0, taxAmtD: 0,
    totTaxblAmt: taxblAmtB,
    totTaxAmt: taxAmtB,
    totAmt: subtotal,
    prchrAcptcYn: 'N',
    remark: order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in',
    regrId,
    regrNm,
    modrId,
    modrNm,
    receipt: {
      custTin: order.customerTin || '',
      custMblNo: order.momoPhone || '',
      rptNo: invcNo,
      trdeNm: process.env.EBM_TRADE_NAME || 'Minifour',
      adrs: order.address?.street || '',
      topMsg: process.env.EBM_TOP_MSG || 'MINIFOUR',
      btmMsg: process.env.EBM_BOTTOM_MSG || 'Thank you',
      prchrAcptcYn: 'N'
    },
    itemList: items
  }
  
  const result = await postToVsdc('/trnsSales/saveSales', body)
  return result
}

module.exports = { isConfigured, sendSalesInvoice, formatDateTime, formatDate }
