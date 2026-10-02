import { config } from './config.js'
import { connectDB } from './db.js'
import { createApp } from './app.js'
import { startScheduler } from './services/scheduler.js'
import { seed } from './seed.js'
import { User } from './models/index.js'

await connectDB()
// In-memory DB starts empty: fill it with demo data so the app is usable straight away
if (config.mongoUri === 'memory' || !(await User.exists({}))) await seed({ demo: config.mongoUri === 'memory' })
startScheduler()
createApp().listen(config.port, () => console.log(`Dentiq API on http://localhost:${config.port}/api`))
