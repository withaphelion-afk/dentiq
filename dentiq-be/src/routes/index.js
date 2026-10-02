import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { Appointment, Patient, Payment, User, Visit } from '../models/index.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'
import { getSettings } from '../services/settings.js'
import { collectDue, createVisit } from '../services/visits.js'
import { pendingReminders, runAutoReminders, sendReminder } from '../services/reminders.js'
import { monthReport } from '../services/reports.js'
import { config, whatsappAuto } from '../config.js'
import { addDays, hhmm, isoDate, today } from '../utils/date.js'

const r = Router()
const date = z.string().regex(isoDate, 'expected YYYY-MM-DD')
const time = z.union([z.string().regex(hhmm, 'expected HH:MM'), z.literal('')])
const phone = z.string().transform((s) => s.replace(/\D/g, '').slice(-10)).refine((s) => s.length === 10, '10 digit phone required')
const mode = z.enum(['Cash', 'UPI'])
const money = z.number().int().min(0)

// ---- Auth ----
r.post('/auth/login', rateLimit({ windowMs: 15 * 60e3, limit: 20 }), async (req, res) => {
  const { password } = z.object({ password: z.string().min(1) }).parse(req.body)
  const user = await User.findOne({ username: 'doctor' })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Wrong password')
  res.json({ token: signToken(user) })
})

r.get('/health', (_req, res) => res.json({ ok: true }))

// External scheduler (cron-job.org) calls this every ~15 min with `Authorization: Bearer <CRON_SECRET>`.
// Sending only happens after the daily send time and is idempotent, so frequent calls are safe.
const sameSecret = (a = '', b = '') => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
r.all('/cron/reminders', async (req, res) => {
  const given = req.get('authorization')?.replace(/^Bearer /, '')
  if (!config.cronSecret || !sameSecret(given, config.cronSecret)) throw new HttpError(401, 'Unauthorized')
  res.json(await runAutoReminders())
})
r.use(requireAuth)

// ---- Settings ----
const settingsInput = z.object({
  clinicName: z.string().min(1), doctorName: z.string().min(1), clinicPhone: z.string(),
  treatments: z.array(z.object({ name: z.string().trim().min(1), fee: money, uses: z.number().optional() })),
  noteTemplates: z.array(z.string().trim().min(1)),
  medicalAlerts: z.array(z.string().trim().min(1)),
  reminders: z.object({
    enabled: z.boolean(), sendAt: z.string().regex(hhmm), recallMonths: z.number().int().min(1).max(36), autoRecalls: z.boolean(),
    appointmentMessage: z.string().min(1), recallMessage: z.string().min(1),
  }).partial(),
}).partial()

const settingsJSON = (s) => ({ ...s.toJSON(), whatsappAuto: whatsappAuto() })
r.get('/settings', async (_req, res) => res.json(settingsJSON(await getSettings())))
r.put('/settings', async (req, res) => {
  const data = settingsInput.parse(req.body)
  const s = await getSettings()
  if (data.reminders) data.reminders = { ...s.reminders.toObject(), ...data.reminders }
  s.set(data)
  await s.save()
  res.json(settingsJSON(s))
})

// ---- Patients ----
const patientInput = z.object({
  name: z.string().trim().min(2), phone, age: z.number().int().min(0).max(120).optional(),
  gender: z.enum(['M', 'F', 'O', '']).optional(), alerts: z.array(z.string()).optional(), note: z.string().optional(),
})

// Personal-clinic scale: return everyone, with their next upcoming appointment attached
r.get('/patients', async (_req, res) => {
  const [patients, next] = await Promise.all([
    Patient.find().sort({ updatedAt: -1 }),
    Appointment.aggregate([
      { $match: { date: { $gte: today() }, status: { $in: ['upcoming', 'now'] } } },
      { $group: { _id: '$patientId', nextVisit: { $min: '$date' } } },
    ]),
  ])
  const map = new Map(next.map((n) => [String(n._id), n.nextVisit]))
  res.json(patients.map((p) => ({ ...p.toJSON(), nextVisit: map.get(String(p._id)) || null })))
})

r.post('/patients', async (req, res) => res.status(201).json(await Patient.create(patientInput.parse(req.body))))

r.get('/patients/:id', async (req, res) => {
  const p = await Patient.findById(req.params.id)
  if (!p) throw new HttpError(404, 'Patient not found')
  const [visits, appointments] = await Promise.all([
    Visit.find({ patientId: p._id }).sort({ date: -1, createdAt: -1 }),
    Appointment.find({ patientId: p._id, date: { $gte: today() }, status: { $in: ['upcoming', 'now'] } }).sort({ date: 1, time: 1 }),
  ])
  res.json({ ...p.toJSON(), visits, appointments })
})

r.patch('/patients/:id', async (req, res) => {
  const p = await Patient.findByIdAndUpdate(req.params.id, patientInput.partial().parse(req.body), { new: true, runValidators: true })
  if (!p) throw new HttpError(404, 'Patient not found')
  res.json(p)
})

r.post('/patients/:id/collect', async (req, res) => {
  const { amount, mode: m } = z.object({ amount: money.optional(), mode: mode.optional() }).parse(req.body)
  res.json(await collectDue(req.params.id, amount, m))
})

// ---- Visits ----
r.post('/visits', async (req, res) => {
  const data = z.object({
    patientId: z.string(),
    items: z.array(z.object({ name: z.string().trim().min(1), fee: money })).min(1),
    teeth: z.array(z.number().int().min(11).max(85)).optional(),
    notes: z.string().optional(), paid: money.optional(), mode: mode.optional(),
    followUp: z.object({ date, time: time.optional(), remind: z.boolean().optional(), purpose: z.string().optional() }).nullish(),
  }).parse(req.body)
  res.status(201).json(await createVisit(data))
})

// ---- Appointments ----
r.get('/appointments', async (req, res) => {
  const { from = today(), to = addDays(today(), 60) } = z.object({ from: date.optional(), to: date.optional() }).parse(req.query)
  res.json(await Appointment.find({ date: { $gte: from, $lte: to }, status: { $ne: 'cancelled' } }).sort({ date: 1, time: 1 }))
})

const apptInput = z.object({ patientId: z.string(), date, time: time.optional(), purpose: z.string().optional(), remind: z.boolean().optional() })
r.post('/appointments', async (req, res) => {
  const data = apptInput.parse(req.body)
  if (!(await Patient.exists({ _id: data.patientId }))) throw new HttpError(404, 'Patient not found')
  res.status(201).json(await Appointment.create(data))
})

r.patch('/appointments/:id', async (req, res) => {
  const data = apptInput.omit({ patientId: true }).partial().extend({ status: z.enum(['upcoming', 'now', 'done', 'cancelled']).optional() }).parse(req.body)
  const a = await Appointment.findById(req.params.id)
  if (!a) throw new HttpError(404, 'Appointment not found')
  if (data.date && data.date !== a.date) a.reminderSentAt = null // rescheduled: remind again
  a.set(data)
  res.json(await a.save())
})

// ---- Money, reports, reminders ----
r.get('/payments', async (req, res) => {
  const { from = today(), to = today() } = z.object({ from: date.optional(), to: date.optional() }).parse(req.query)
  res.json(await Payment.find({ date: { $gte: from, $lte: to } }).sort({ createdAt: -1 }))
})

r.get('/reports', async (req, res) => {
  const { month = today().slice(0, 7) } = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(req.query)
  res.json(await monthReport(month))
})

r.get('/reminders', async (_req, res) => res.json(await pendingReminders()))
r.post('/reminders/:kind/:id', async (req, res) => {
  const kind = z.enum(['appointment', 'recall']).parse(req.params.kind)
  const { via } = z.object({ via: z.enum(['auto', 'manual']).default('manual') }).parse(req.body || {})
  if (via === 'auto' && !whatsappAuto()) throw new HttpError(400, 'WhatsApp Cloud API is not configured')
  res.json(await sendReminder(kind, req.params.id, via))
})

export default r
