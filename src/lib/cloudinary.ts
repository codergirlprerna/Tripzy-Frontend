const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export type CloudinaryUploadResult = {
  url: string
  publicId: string
  resourceType: string // 'image' | 'video' | 'raw' — Cloudinary's own bucket for the asset; needed later to delete it via the correct API endpoint
}

/**
 * Uploads a file/blob directly from the browser to Cloudinary using an unsigned
 * upload preset — no backend needed to sign the request. Used in place of
 * Firebase Storage, which now requires a billing card on file (Google's policy
 * change effective Feb 2026) even to stay on its free tier.
 *
 * Returns publicId + resourceType alongside the URL — deleting an asset later
 * (see api/delete-cloudinary-assets.ts) needs the publicId, since Cloudinary's
 * delete API doesn't accept a URL.
 */
export async function uploadToCloudinary(file: Blob, fileName: string): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured — check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env')
  }

  const formData = new FormData()
  formData.append('file', file, fileName)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.error?.message || 'Upload to Cloudinary failed')
  }

  const data = await response.json()
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    resourceType: data.resource_type as string,
  }
}