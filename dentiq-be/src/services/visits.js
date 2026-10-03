import { Appointment, Patient, Payment, Visit } from '../models/index.js'
import { today } from '../utils/date.js'
import { config } from '../config.js'
import { learnTreatments } from './settings.js'
import { HttpError } from '../middleware/error.js'

// Saving a visit updates everything the doctor would otherwise do by hand:
// patient dues/last visit, payment record, today's queue entry, follow-up booking, treatment usage.
// A past `date` back-fills history: it is recorded on that day and leaves today's queue and bookings alone.
export async function createVisit({ patientId, date: visitDate, items, teeth = [], notes = '', paid, mode = 'Cash', followUp }) {
  const patient = await Patient.findById(patientId)
  if (!patient) throw new HttpError(404, 'Patient not found')

  const date = visitDate || today()
  if (date > today()) throw new HttpError(400, 'Visit date cannot be in the future')
  const past = date < today()
  const total = items.reduce((s, i) => s + i.fee, 0)
  const amountPaid = paid ?? total
  const visit = await Visit.create({ patientId, date, items, teeth, notes, total, paid: amountPaid, mode })

  if (amountPaid > 0) await Payment.create({ patientId, visitId: visit._id, date, amount: amountPaid, mode, kind: 'visit' })

  patient.due = Math.max(patient.due + total - amountPaid, 0)
  if (!patient.lastVisit || date >= patient.lastVisit) { // an older back-filled visit doesn't replace a newer one
    patient.lastVisit = date
    patient.lastTreatment = items.map((i) => i.name).join(' + ')
  }
  await patient.save()
  await learnTreatments(items)
  if (past) return { visit, patient, followUp: null }

  // Close today's open appointment for this patient, or log a walk-in
  const open = await Appointment.findOne({ patientId, date, status: { $in: ['upcoming', 'now'] } }).sort({ time: 1 })
  const purpose = items.map((i) => i.name).join(' + ') + (teeth.length ? ` · #${teeth.join(', ')}` : '')
  if (open) Object.assign(open, { status: 'done', purpose, visitId: visit._id })
  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: config.tz })
  await (open || new Appointment({ patientId, date, time, purpose, status: 'done', remind: false, visitId: visit._id })).save()

  let next = null
  if (followUp?.date) {
    next = await Appointment.create({
      patientId, date: followUp.date, time: followUp.time || '', remind: followUp.remind ?? true,
      purpose: followUp.purpose || `Follow-up: ${items[0].name}`,
    })
  }

  return { visit, patient, followUp: next }
}

export async function collectDue(patientId, amount, mode = 'Cash') {
  const patient = await Patient.findById(patientId)
  if (!patient) throw new HttpError(404, 'Patient not found')
  const value = Math.min(amount ?? patient.due, patient.due)
  if (value <= 0) throw new HttpError(400, 'No dues to collect')
  await Payment.create({ patientId, date: today(), amount: value, mode, kind: 'due' })
  patient.due -= value
  await patient.save()
  return patient
}
