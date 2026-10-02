# dentiq-be

Backend for Dentiq: REST API, MongoDB models, WhatsApp reminder scheduler.

Planned stack (MERN, JavaScript only):

- Node.js + Express: REST API
- MongoDB + Mongoose: patients, visits, appointments, payments
- Services: WhatsApp reminders, auth for the doctor

The frontend's `dentiq-fe/src/data/store.jsx` is the integration point: its actions (`addPatient`, `addVisit`, …) will call this API.
