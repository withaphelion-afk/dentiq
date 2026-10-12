import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { randomBytes } from 'node:crypto'
import { join, basename } from 'node:path'
import { del, get, put } from '@vercel/blob'
import { config } from '../config.js'
import { Patient, Photo } from '../models/index.js'
import { HttpError } from '../middleware/error.js'

const MAX_BYTES = 3 * 1024 * 1024 // Vercel functions accept at most ~4.5 MB bodies; the app sends ~300 KB
const useBlob = Boolean(config.blobToken)

// Storage drivers. Blob: private store (no public URLs). Local: ./.uploads, development and tests only.
const storage = {
  async save(patientId, buf) {
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.jpg`
    if (useBlob) {
      const b = await put(`patients/${patientId}/${name}`, buf, { access: 'private', contentType: 'image/jpeg', addRandomSuffix: false })
      return b.pathname
    }
    if (config.production) throw new HttpError(503, 'Photo storage is not configured')
    await mkdir(config.uploadDir, { recursive: true })
    await writeFile(join(config.uploadDir, name), buf)
    return name
  },
  async read(path) {
    if (useBlob) {
      const r = await get(path, { access: 'private' })
      return r?.statusCode === 200 ? Readable.fromWeb(r.stream) : null
    }
    try { await readFile(join(config.uploadDir, basename(path))); return createReadStream(join(config.uploadDir, basename(path))) } catch { return null }
  },
  async remove(path) {
    if (useBlob) return del(path)
    await unlink(join(config.uploadDir, basename(path))).catch(() => {})
  },
}

const isJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff

export async function addPhoto({ patientId, buf, date, tooth, caption }) {
  if (!Buffer.isBuffer(buf) || buf.length < 1000) throw new HttpError(400, 'Send the photo as a JPEG image')
  if (buf.length > MAX_BYTES) throw new HttpError(413, 'Photo is too large')
  if (!isJpeg(buf)) throw new HttpError(400, 'Only JPEG photos are accepted')
  if (!(await Patient.exists({ _id: patientId }))) throw new HttpError(404, 'Patient not found')
  const path = await storage.save(patientId, buf)
  return Photo.create({ patientId, date, tooth, caption, path, size: buf.length })
}

export async function openPhoto(id) {
  const photo = await Photo.findById(id)
  if (!photo) throw new HttpError(404, 'Photo not found')
  const stream = await storage.read(photo.path)
  if (!stream) throw new HttpError(404, 'Photo file is missing')
  return { photo, stream }
}

export async function removePhoto(id) {
  const photo = await Photo.findById(id)
  if (!photo) throw new HttpError(404, 'Photo not found')
  await storage.remove(photo.path)
  await photo.deleteOne()
}
