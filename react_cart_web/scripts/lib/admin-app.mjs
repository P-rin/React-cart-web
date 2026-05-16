import 'dotenv/config'
import fs from 'node:fs'
import admin from 'firebase-admin'

export function initAdminFirestore() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error('Missing env var VITE_FIREBASE_PROJECT_ID')
  }

  if (admin.apps.length === 0) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

    if (serviceAccountPath) {
      const raw = fs.readFileSync(serviceAccountPath, 'utf8')
      const serviceAccount = JSON.parse(raw)

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      })
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      })
    }
  }

  return admin.firestore()
}

export const adminTimestamp = () => admin.firestore.FieldValue.serverTimestamp()
