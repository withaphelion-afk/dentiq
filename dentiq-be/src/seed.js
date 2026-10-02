import bcrypt from 'bcryptjs'
import { pathToFileURL } from 'node:url'
import { config } from './config.js'
import { Appointment, Patient, Payment, User, Visit } from './models/index.js'
import { getSettings } from './services/settings.js'
import { addDays, today } from './utils/date.js'

// Creates the doctor login + default settings. With demo=true, also adds sample patients (dates relative to today).
export async function seed({ demo = false } = {}) {
  if (!(await User.exists({ username: 'doctor' }))) {
    await User.create({ username: 'doctor', passwordHash: await bcrypt.hash(config.doctorPassword, 10) })
  }
  const settings = await getSettings()
  if (!demo || (await Patient.exists({}))) return

  const t = today()
  const d = (n) => addDays(t, n)
  const people = [
    ['Rohit Sharma', '9814022311', 34, 'M', ['BP']], ['Simran Kaur', '9872210456', 27, 'F'], ['Harpreet Singh', '9915088720', 52, 'M'],
    ['Anjali Verma', '9780044102', 41, 'F'], ['Gurdeep Gill', '9888031209', 63, 'M', ['Diabetes', 'Blood thinners']],
    ['Neha Arora', '9646077812', 19, 'F'], ['Manoj Bansal', '9815960034', 45, 'M'], ['Kiran Dhillon', '9417055298', 38, 'F'],
  ]
  const P = await Patient.insertMany(people.map(([name, phone, age, gender, alerts = []]) => ({ name, phone, age, gender, alerts })))
  const [rohit, simran, harpreet, anjali, gurdeep, neha, manoj, kiran] = P

  const history = [
    [rohit, -12, [['Consultation', 300], ['X-Ray (IOPA)', 200]], [36], 'Deep caries 36, advised RCT', 500, 'UPI'],
    [rohit, -5, [['RCT', 4500]], [36], 'LA given, Sitting 1/3', 2000, 'Cash'],
    [simran, -186, [['Composite Filling', 1000]], [24], '', 1000, 'UPI'],
    [simran, -3, [['Scaling & Polishing', 1200]], [], 'Mild gingivitis', 1200, 'UPI'],
    [harpreet, -18, [['Extraction', 800]], [48], 'LA given, Painkillers prescribed, Soft diet 24h', 800, 'Cash'],
    [anjali, -25, [['RCT', 4500]], [26], 'Sitting 3/3 done', 4500, 'UPI'],
    [anjali, -11, [['Crown (Zirconia)', 9000]], [26], 'Impression taken', 5000, 'UPI'],
    [gurdeep, -45, [['Denture', 12000]], [], 'Upper complete denture, impression', 6000, 'Cash'],
    [neha, -2, [['Braces Consultation', 500]], [], 'Crowding lower anteriors', 500, 'UPI'],
    [manoj, -184, [['Scaling & Polishing', 1200]], [], '', 1200, 'Cash'],
    [kiran, -189, [['Composite Filling', 1000], ['Composite Filling', 1000]], [16, 46], '', 2000, 'UPI'],
    [neha, 0, [['Consultation', 300]], [], 'Advised braces records', 300, 'UPI'],
    [rohit, 0, [['X-Ray (IOPA)', 200]], [36], 'Sitting 2/3, working length X-ray', 200, 'Cash'],
  ]
  for (const [p, day, items, teeth, notes, paid, mode] of history) {
    const its = items.map(([name, fee]) => ({ name, fee }))
    const total = its.reduce((s, i) => s + i.fee, 0)
    const v = await Visit.create({ patientId: p._id, date: d(day), items: its, teeth, notes, total, paid, mode })
    await Payment.create({ patientId: p._id, visitId: v._id, date: d(day), amount: paid, mode })
    Object.assign(p, { lastVisit: d(day), lastTreatment: its.map((i) => i.name).join(' + '), due: p.due + total - paid })
  }
  await Promise.all(P.map((p) => p.save()))

  await Appointment.insertMany([
    [neha, 0, '10:00', 'Consultation', 'done'], [rohit, 0, '10:45', 'RCT – Sitting 2/3 · #36', 'done'],
    [simran, 0, '11:30', 'Composite Filling · #14', 'now'], [anjali, 0, '12:15', 'Crown fitting · #26'],
    [harpreet, 0, '17:00', 'Post-extraction check'], [gurdeep, 0, '18:30', 'Denture trial'],
    [rohit, 1, '11:00', 'RCT – Sitting 3/3'], [kiran, 1, '17:30', 'Filling check-up'], [neha, 4, '16:00', 'Braces records'],
    [anjali, 7, '12:00', 'Crown review'],
  ].map(([p, day, time, purpose, status = 'upcoming']) => ({ patientId: p._id, date: d(day), time, purpose, status })))

  // Make the demo autocomplete order realistic
  const uses = { Consultation: 50, RCT: 42, Extraction: 38, 'Scaling & Polishing': 30, 'Composite Filling': 27, 'X-Ray (IOPA)': 20, 'Crown (PFM)': 12, 'Crown (Zirconia)': 8 }
  settings.treatments.forEach((x) => { x.uses = uses[x.name] || 1 })
  await settings.save()
}

// `npm run seed` (add --demo for sample data)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDB, disconnectDB } = await import('./db.js')
  await connectDB()
  await seed({ demo: process.argv.includes('--demo') })
  console.log('Seeded')
  await disconnectDB()
}
