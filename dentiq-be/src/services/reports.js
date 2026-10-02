import { Patient, Payment, Visit } from '../models/index.js'

const daysIn = (month) => { const [y, m] = month.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate() }

export async function monthReport(month) {
  const from = `${month}-01`, to = `${month}-31`
  const [y, m] = month.split('-').map(Number)
  // Clinic is in IST: month boundaries at local midnight
  const start = new Date(`${month}-01T00:00:00+05:30`)
  const end = new Date(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01T00:00:00+05:30`)

  const [payments, visits, newPatients, dues] = await Promise.all([
    Payment.find({ date: { $gte: from, $lte: to } }),
    Visit.find({ date: { $gte: from, $lte: to } }),
    Patient.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    Patient.aggregate([{ $group: { _id: null, total: { $sum: '$due' }, patients: { $sum: { $cond: [{ $gt: ['$due', 0] }, 1, 0] } } } }]),
  ])

  const daily = Array.from({ length: daysIn(month) }, (_, i) => ({ date: `${month}-${String(i + 1).padStart(2, '0')}`, amount: 0 }))
  const byMode = { Cash: 0, UPI: 0 }
  for (const p of payments) {
    daily[Number(p.date.slice(8)) - 1].amount += p.amount
    byMode[p.mode] = (byMode[p.mode] || 0) + p.amount
  }

  const treat = new Map()
  for (const v of visits) for (const i of v.items) {
    const t = treat.get(i.name) || { name: i.name, count: 0, revenue: 0 }
    t.count += 1; t.revenue += i.fee
    treat.set(i.name, t)
  }

  return {
    month,
    collected: byMode.Cash + byMode.UPI,
    billed: visits.reduce((s, v) => s + v.total, 0),
    visits: visits.length,
    patientsSeen: new Set(visits.map((v) => String(v.patientId))).size,
    newPatients,
    duesOutstanding: dues[0]?.total || 0,
    patientsWithDues: dues[0]?.patients || 0,
    byMode,
    daily,
    topTreatments: [...treat.values()].sort((a, b) => b.count - a.count).slice(0, 8),
  }
}
