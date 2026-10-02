import cron from 'node-cron'
import { runAutoReminders } from './reminders.js'

// Checks every 15 minutes; sending is idempotent (reminderSentAt / recall log), so restarts are safe.
export function startScheduler() {
  return cron.schedule('*/15 * * * *', async () => {
    try {
      const { sent } = await runAutoReminders()
      if (sent) console.log(`WhatsApp reminders sent: ${sent}`)
    } catch (e) {
      console.error('Reminder job failed:', e.message)
    }
  })
}
