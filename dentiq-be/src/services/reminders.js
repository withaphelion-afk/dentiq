import { Appointment, Patient, ReminderLog } from '../models/index.js'
import { config, whatsappAuto } from '../config.js'
import { addDays, prettyDate, prettyTime, today } from '../utils/date.js'
import { getSettings } from './settings.js'
import { sendTemplate, waLink } from './whatsapp.js'
import { HttpError } from '../middleware/error.js'

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
const firstName = (name) => name.split(' ')[0]

function buildMessage(kind, patient, appt, settings) {
  const vars = {
    name: firstName(patient.name),
    clinic: settings.clinicName,
    date: appt ? prettyDate(appt.date) : '',
    time: appt?.time ? ` at ${prettyTime(appt.time)}` : '',
  }
  const tpl = kind === 'appointment' ? settings.reminders.appointmentMessage : settings.reminders.recallMessage
  return { text: fill(tpl, vars), params: [vars.name, vars.date, appt?.time ? prettyTime(appt.time) : '', vars.clinic] }
}

// Everything that should be sent now: tomorrow's appointments + patients due for a recall.
export async function pendingReminders() {
  const settings = await getSettings()
  const tomorrow = addDays(today(), 1)

  const appts = await Appointment.find({ date: tomorrow, status: 'upcoming', remind: true, reminderSentAt: null }).populate('patientId').sort({ time: 1 })
  const appointment = appts.filter((a) => a.patientId).map((a) => {
    const { text } = buildMessage('appointment', a.patientId, a, settings)
    return { kind: 'appointment', id: String(a._id), patient: a.patientId.toJSON(), date: a.date, time: a.time, reason: a.purpose, text, link: waLink(a.patientId.phone, text) }
  })

  const cutoff = addDays(today(), -Math.round(settings.reminders.recallMonths * 30.4))
  const [booked, recent] = await Promise.all([
    Appointment.distinct('patientId', { date: { $gte: today() }, status: { $in: ['upcoming', 'now'] } }),
    ReminderLog.distinct('patientId', { kind: 'recall', createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } }),
  ])
  const skip = [...booked, ...recent]
  const due = await Patient.find({ lastVisit: { $lte: cutoff }, _id: { $nin: skip } }).sort({ lastVisit: 1 }).limit(50)
  const recall = due.map((p) => {
    const { text } = buildMessage('recall', p, null, settings)
    return { kind: 'recall', id: String(p._id), patient: p.toJSON(), reason: `Last visit ${prettyDate(p.lastVisit)} · ${p.lastTreatment}`, text, link: waLink(p.phone, text) }
  })

  return { auto: whatsappAuto() && settings.reminders.enabled, sendAt: settings.reminders.sendAt, items: [...appointment, ...recall] }
}

// Record a reminder; when the Cloud API is configured and via='auto', actually send it.
export async function sendReminder(kind, id, via = 'manual') {
  const settings = await getSettings()
  let patient, appt
  if (kind === 'appointment') {
    appt = await Appointment.findById(id).populate('patientId')
    if (!appt) throw new HttpError(404, 'Appointment not found')
    patient = appt.patientId
  } else {
    patient = await Patient.findById(id)
  }
  if (!patient) throw new HttpError(404, 'Patient not found')

  let ok = true, error
  if (via === 'auto') {
    try {
      const { params } = buildMessage(kind, patient, appt, settings)
      await sendTemplate(patient.phone, config.whatsapp.templates[kind], params)
    } catch (e) { ok = false; error = e.message }
  }
  await ReminderLog.create({ patientId: patient._id, kind, appointmentId: appt?._id, via, ok, error })
  if (ok && appt) { appt.reminderSentAt = new Date(); await appt.save() }
  return { ok, error }
}

// Called by the scheduler: send everything pending once the daily send time has passed.
export async function runAutoReminders() {
  const settings = await getSettings()
  if (!whatsappAuto() || !settings.reminders.enabled) return { sent: 0, skipped: true }
  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: config.tz })
  if (now < settings.reminders.sendAt) return { sent: 0, skipped: true }

  const { items } = await pendingReminders()
  // Don't hammer the API: a failed appointment reminder is retried at most every 6 hours
  const failed = new Set((await ReminderLog.distinct('appointmentId', { ok: false, createdAt: { $gte: new Date(Date.now() - 6 * 36e5) } })).map(String))
  let sent = 0
  for (const r of items) {
    if (r.kind === 'recall' && !settings.reminders.autoRecalls) continue
    if (failed.has(r.id)) continue
    const { ok } = await sendReminder(r.kind, r.id, 'auto')
    if (ok) sent += 1
  }
  return { sent }
}
