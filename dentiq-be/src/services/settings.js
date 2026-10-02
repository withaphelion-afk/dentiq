import { Settings } from '../models/index.js'

export const DEFAULTS = {
  treatments: [
    ['Consultation', 300], ['Extraction', 800], ['RCT', 4500], ['Scaling & Polishing', 1200], ['Composite Filling', 1000],
    ['Crown (PFM)', 5000], ['Crown (Zirconia)', 9000], ['X-Ray (IOPA)', 200], ['Braces Consultation', 500],
    ['Teeth Whitening', 6000], ['Implant', 25000], ['Denture', 12000],
  ].map(([name, fee]) => ({ name, fee, uses: 0 })),
  noteTemplates: ['LA given', 'Sitting 1/3', 'Sitting 2/3', 'Sitting 3/3', 'Advised X-ray', 'Painkillers prescribed', 'Antibiotics prescribed', 'Soft diet 24h', 'Review if pain'],
  medicalAlerts: ['Diabetes', 'BP', 'Heart', 'Allergy', 'Pregnant', 'Blood thinners', 'Asthma', 'Thyroid'],
}

export async function getSettings() {
  return (await Settings.findById('clinic')) || Settings.create({ _id: 'clinic', ...DEFAULTS })
}

// Count treatment usage (drives autocomplete order) and remember fees/new treatments
export async function learnTreatments(items) {
  const s = await getSettings()
  for (const { name, fee } of items) {
    const t = s.treatments.find((x) => x.name.toLowerCase() === name.toLowerCase())
    if (t) { t.uses += 1; t.fee = fee } else s.treatments.push({ name, fee, uses: 1 })
  }
  await s.save()
}
