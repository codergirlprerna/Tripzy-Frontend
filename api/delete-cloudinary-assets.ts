import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { v2 as cloudinary } from 'cloudinary'

/**
 * Deletes Cloudinary assets (photos/voice notes) belonging to a trip.
 *
 * This exists because Cloudinary's delete API is a SIGNED request — it needs
 * your API secret, which can never be shipped to the browser (anyone could
 * read it from devtools and delete other people's files). So this one step
 * of "delete a trip" has to happen server-side, even though every other
 * write in this app goes straight from the client to Firestore.
 *
 * IMPORTANT — call ordering from the client (see lib/trips.ts deleteTrip()):
 * this must be called BEFORE the trip's Firestore document is deleted, not
 * after. Ownership is verified here by reading trips/{tripId}.members — once
 * that document is gone, there's nothing left to check the caller against,
 * so a call made after Firestore deletion would always fail.
 */

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is not set')
    }
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) })
  }
  return { auth: getAuth(), db: getFirestore() }
}

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET env vars are not set')
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
  return cloudinary
}

type CloudinaryAsset = { publicId: string; resourceType: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }
  const idToken = authHeader.slice('Bearer '.length)

  const { tripId, assets } = req.body as { tripId?: string; assets?: CloudinaryAsset[] }
  if (!tripId || !Array.isArray(assets)) {
    res.status(400).json({ error: 'Request body must include tripId and assets[]' })
    return
  }

  try {
    const { auth, db } = getFirebaseAdmin()
    const decoded = await auth.verifyIdToken(idToken)

    const tripSnap = await db.collection('trips').doc(tripId).get()
    if (!tripSnap.exists) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }
    const members = tripSnap.data()?.members || {}
    if (members[decoded.uid]?.role !== 'owner') {
      res.status(403).json({ error: 'Only the trip owner can delete its assets' })
      return
    }

    if (assets.length === 0) {
      res.status(200).json({ deleted: 0 })
      return
    }

    const cloudinaryClient = getCloudinary()

    // Cloudinary's delete endpoint is scoped by resource_type (image/video/raw),
    // so assets have to be grouped and deleted in separate calls per type.
    const byResourceType = new Map<string, string[]>()
    for (const asset of assets) {
      const list = byResourceType.get(asset.resourceType) || []
      list.push(asset.publicId)
      byResourceType.set(asset.resourceType, list)
    }

    let deletedCount = 0
    const errors: string[] = []

    for (const [resourceType, publicIds] of byResourceType) {
      try {
        const result = await cloudinaryClient.api.delete_resources(publicIds, {
          resource_type: resourceType,
          invalidate: true,
        })
        deletedCount += Object.values(result.deleted || {}).filter((status) => status === 'deleted').length
      } catch (err: any) {
        errors.push(`${resourceType}: ${err.message || 'unknown error'}`)
      }
    }

    res.status(200).json({ deleted: deletedCount, total: assets.length, errors: errors.length ? errors : undefined })
  } catch (err: any) {
    console.error('delete-cloudinary-assets failed:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
}