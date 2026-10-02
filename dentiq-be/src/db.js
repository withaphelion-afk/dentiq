import dns from 'node:dns'
import mongoose from 'mongoose'
import { config } from './config.js'

let memoryServer

export async function connectDB(uri = config.mongoUri) {
  // Some Windows setups can't resolve mongodb+srv records with Node's resolver; allow public DNS
  if (process.env.DNS_SERVERS) dns.setServers(process.env.DNS_SERVERS.split(','))
  if (uri === 'memory') {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    memoryServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
    uri = memoryServer.getUri()
    console.warn('Using in-memory MongoDB: data is lost on restart')
  }
  await mongoose.connect(uri)
  return mongoose.connection
}

export async function disconnectDB() {
  await mongoose.disconnect()
  await memoryServer?.stop()
}
