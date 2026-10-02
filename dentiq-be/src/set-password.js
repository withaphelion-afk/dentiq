// `npm run set-password`: updates the doctor's login to DOCTOR_PASSWORD from .env
import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { connectDB, disconnectDB } from './db.js'
import { User } from './models/index.js'

if (!config.doctorPassword || config.doctorPassword.length < 6) throw new Error('Set DOCTOR_PASSWORD (6+ characters) in .env')
await connectDB()
await User.updateOne({ username: 'doctor' }, { passwordHash: await bcrypt.hash(config.doctorPassword, 10) }, { upsert: true })
console.log('Doctor password updated')
await disconnectDB()
