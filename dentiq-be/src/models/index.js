import mongoose from 'mongoose'
import { toJSONPlugin } from './plugin.js'

mongoose.plugin(toJSONPlugin)
const { Schema, model } = mongoose
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name, required: true, index: true })

const patientSchema = new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true }, // 10 digits, stored without spaces
  age: Number,
  gender: { type: String, enum: ['M', 'F', 'O', ''] },
  alerts: [String],
  note: String,
  due: { type: Number, default: 0 },
  lastVisit: String,
  lastTreatment: { type: String, default: 'New patient' },
}, { timestamps: true })
patientSchema.index({ name: 'text' })

const itemSchema = new Schema({ name: { type: String, required: true }, fee: { type: Number, min: 0, required: true } }, { _id: false })

const visitSchema = new Schema({
  patientId: ref('Patient'),
  date: { type: String, required: true, index: true },
  items: { type: [itemSchema], validate: (v) => v.length > 0 },
  teeth: [Number],
  notes: String,
  total: Number,
  paid: { type: Number, default: 0 },
  mode: { type: String, enum: ['Cash', 'UPI'], default: 'Cash' },
}, { timestamps: true })

const appointmentSchema = new Schema({
  patientId: ref('Patient'),
  date: { type: String, required: true, index: true },
  time: { type: String, default: '' },
  purpose: { type: String, default: 'Check-up' },
  status: { type: String, enum: ['upcoming', 'now', 'done', 'cancelled'], default: 'upcoming' },
  remind: { type: Boolean, default: true },
  reminderSentAt: Date,
  visitId: { type: Schema.Types.ObjectId, ref: 'Visit' },
}, { timestamps: true })

const paymentSchema = new Schema({
  patientId: ref('Patient'),
  visitId: { type: Schema.Types.ObjectId, ref: 'Visit' },
  date: { type: String, required: true, index: true },
  amount: { type: Number, min: 0, required: true },
  mode: { type: String, enum: ['Cash', 'UPI'], default: 'Cash' },
  kind: { type: String, enum: ['visit', 'due'], default: 'visit' },
}, { timestamps: true })

const reminderLogSchema = new Schema({
  patientId: ref('Patient'),
  kind: { type: String, enum: ['appointment', 'recall'], required: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  via: { type: String, enum: ['auto', 'manual'], required: true },
  ok: { type: Boolean, default: true },
  error: String,
}, { timestamps: true })

const settingsSchema = new Schema({
  _id: { type: String, default: 'clinic' }, // singleton
  clinicName: { type: String, default: 'Gagneja Dental Clinic' },
  doctorName: { type: String, default: 'Dr. Gagneja' },
  clinicPhone: { type: String, default: '' },
  treatments: [{ _id: false, name: String, fee: Number, uses: { type: Number, default: 0 } }],
  noteTemplates: [String],
  medicalAlerts: [String],
  reminders: {
    enabled: { type: Boolean, default: true },
    sendAt: { type: String, default: '09:00' },
    recallMonths: { type: Number, default: 6 },
    autoRecalls: { type: Boolean, default: false },
    appointmentMessage: { type: String, default: 'Hi {name}, this is a reminder of your dental appointment at {clinic} on {date}{time}. Reply to reschedule.' },
    recallMessage: { type: String, default: 'Hi {name}, it has been a while since your last check-up at {clinic}. Time for your routine dental visit. Reply to book a slot.' },
  },
}, { timestamps: true })

const userSchema = new Schema({ username: { type: String, unique: true, default: 'doctor' }, passwordHash: String })

export const Patient = model('Patient', patientSchema)
export const Visit = model('Visit', visitSchema)
export const Appointment = model('Appointment', appointmentSchema)
export const Payment = model('Payment', paymentSchema)
export const ReminderLog = model('ReminderLog', reminderLogSchema)
export const Settings = model('Settings', settingsSchema)
export const User = model('User', userSchema)
