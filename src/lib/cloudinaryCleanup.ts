import { User } from 'firebase/auth'

type CloudinaryAsset = { publicId: string; resourceType: string }

/**
 * Asks the backend to delete a batch of Cloudinary assets for a trip. Must
 * be called with a still-valid trip (see lib/trips.ts deleteTrip() for why
 * ordering matters) since the server verifies trip ownership by reading
 * Firestore itself — it doesn't trust anything the client claims.
 *
 * Deliberately doesn't throw on failure — a Cloudinary cleanup hiccup
 * (rate limit, transient network error, one bad asset in the batch)
 * shouldn't block the rest of trip deletion. Returns false so the caller
 * can decide how to surface that, without it becoming a hard failure.
 */
export async function deleteCloudinaryAssets(
  user: User,
  tripId: string,
  assets: CloudinaryAsset[],
): Promise<boolean> {
  if (assets.length === 0) return true

  try {
    const idToken = await user.getIdToken()
    const response = await fetch('/api/delete-cloudinary-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ tripId, assets }),
    })
    if (!response.ok) {
      console.error('Cloudinary cleanup failed:', await response.text().catch(() => response.statusText))
      return false
    }
    const result = await response.json()
    if (result.errors) console.error('Cloudinary cleanup partial failure:', result.errors)
    return !result.errors
  } catch (err) {
    console.error('Cloudinary cleanup request failed:', err)
    return false
  }
}