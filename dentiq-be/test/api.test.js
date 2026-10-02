import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { connectDB, disconnectDB } from '../src/db.js'
import { createApp } from '../src/app.js'
import { seed } from '../src/seed.js'
import { addDays, today } from '../src/utils/date.js'

let api, auth

before(async () => {
  await connectDB('memory')
  await seed({ demo: true })
  api = request(createApp())
  const { body } = await api.post('/api/auth/login').send({ password: 'dentiq' })
  auth = { Authorization: `Bearer ${body.token}` }
})
after(disconnectDB)

test('rejects requests without login and wrong passwords', async () => {
  await api.get('/api/patients').expect(401)
  await api.post('/api/auth/login').send({ password: 'nope' }).expect(401)
})

test('creates a patient, rejects a duplicate phone', async () => {
  const { body } = await api.post('/api/patients').set(auth).send({ name: 'Raj Malhotra', phone: '98765 43210', alerts: ['Diabetes'] }).expect(201)
  assert.equal(body.phone, '9876543210')
  assert.ok(body.id)
  await api.post('/api/patients').set(auth).send({ name: 'Someone', phone: '9876543210' }).expect(409)
  await api.post('/api/patients').set(auth).send({ name: 'Bad', phone: '123' }).expect(400)
})

test('a visit updates dues, payments, queue, follow-up and treatment usage', async () => {
  const patients = (await api.get('/api/patients').set(auth)).body
  const simran = patients.find((p) => p.name === 'Simran Kaur')
  const followDate = addDays(today(), 7)

  const { body } = await api.post('/api/visits').set(auth).send({
    patientId: simran.id, items: [{ name: 'Composite Filling', fee: 1000 }, { name: 'Night guard', fee: 2500 }],
    teeth: [14], paid: 1500, mode: 'UPI', followUp: { date: followDate, remind: true },
  }).expect(201)
  assert.equal(body.patient.due, 2000)
  assert.equal(body.followUp.date, followDate)

  const queue = (await api.get(`/api/appointments?from=${today()}&to=${today()}`).set(auth)).body
  assert.equal(queue.find((a) => a.patientId === simran.id).status, 'done')

  const payments = (await api.get('/api/payments').set(auth)).body
  assert.ok(payments.some((p) => p.amount === 1500 && p.mode === 'UPI'))

  const settings = (await api.get('/api/settings').set(auth)).body
  assert.equal(settings.treatments.find((t) => t.name === 'Night guard').fee, 2500)

  const profile = (await api.get(`/api/patients/${simran.id}`).set(auth)).body
  assert.equal(profile.visits[0].total, 3500)
  assert.equal(profile.appointments[0].date, followDate)
})

test('collecting dues reduces them and records a payment', async () => {
  const anjali = (await api.get('/api/patients').set(auth)).body.find((p) => p.name === 'Anjali Verma')
  assert.equal(anjali.due, 4000)
  const { body } = await api.post(`/api/patients/${anjali.id}/collect`).set(auth).send({ mode: 'Cash' }).expect(200)
  assert.equal(body.due, 0)
  await api.post(`/api/patients/${anjali.id}/collect`).set(auth).send({}).expect(400)
})

test('reminders: tomorrow\'s appointments and recalls, with WhatsApp links', async () => {
  const { body } = await api.get('/api/reminders').set(auth).expect(200)
  assert.equal(body.auto, false) // no Cloud API configured in tests
  const appt = body.items.find((i) => i.kind === 'appointment' && i.patient.name === 'Rohit Sharma')
  assert.match(appt.text, /Hi Rohit, .*Gagneja Dental Clinic.*11:00 AM/)
  assert.match(appt.link, /^https:\/\/wa\.me\/919814022311\?text=/)
  assert.ok(body.items.some((i) => i.kind === 'recall' && i.patient.name === 'Manoj Bansal'))

  await api.post(`/api/reminders/appointment/${appt.id}`).set(auth).send({ via: 'manual' }).expect(200)
  await api.post(`/api/reminders/recall/${appt.patient.id}`).set(auth).send({ via: 'auto' }).expect(400)
  const again = (await api.get('/api/reminders').set(auth)).body
  assert.ok(!again.items.some((i) => i.id === appt.id), 'sent reminder no longer pending')
})

test('monthly report adds up', async () => {
  const { body } = await api.get(`/api/reports?month=${today().slice(0, 7)}`).set(auth).expect(200)
  assert.equal(body.collected, body.byMode.Cash + body.byMode.UPI)
  assert.equal(body.daily.reduce((s, d) => s + d.amount, 0), body.collected)
  assert.ok(body.topTreatments.length > 0)
})

test('settings update and rescheduling an appointment', async () => {
  const { body } = await api.put('/api/settings').set(auth).send({ doctorName: 'Dr. R. Gagneja', reminders: { sendAt: '08:30' } }).expect(200)
  assert.equal(body.doctorName, 'Dr. R. Gagneja')
  assert.equal(body.reminders.sendAt, '08:30')
  assert.ok(body.reminders.appointmentMessage, 'other reminder fields kept')

  const appts = (await api.get('/api/appointments').set(auth)).body
  const a = appts.find((x) => x.status === 'upcoming')
  const moved = (await api.patch(`/api/appointments/${a.id}`).set(auth).send({ date: addDays(today(), 3), time: '15:30' }).expect(200)).body
  assert.equal(moved.time, '15:30')
})
