import 'dotenv/config'

const env = process.env

export const config = {
  port: Number(env.PORT) || 4000,
  mongoUri: env.MONGO_URI || 'memory',
  jwtSecret: env.JWT_SECRET || (env.NODE_ENV === 'production' ? null : 'dev-secret'),
  doctorPassword: env.DOCTOR_PASSWORD || 'dentiq',
  clientOrigin: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  tz: env.TZ_NAME || 'Asia/Kolkata',
  whatsapp: {
    token: env.WA_TOKEN,
    phoneNumberId: env.WA_PHONE_NUMBER_ID,
    templates: { appointment: env.WA_TEMPLATE_APPOINTMENT || 'appointment_reminder', recall: env.WA_TEMPLATE_RECALL || 'recall_reminder' },
    lang: env.WA_TEMPLATE_LANG || 'en',
  },
}

if (!config.jwtSecret) throw new Error('JWT_SECRET must be set in production')

export const whatsappAuto = () => Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId)
