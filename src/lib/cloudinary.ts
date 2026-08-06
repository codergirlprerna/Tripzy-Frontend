const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Uploads a file/blob directly from the browser to Cloudinary using an unsigned
 * upload preset — no backend needed to sign the request. Used in place of
 * Firebase Storage, which now requires a billing card on file (Google's policy
 * change effective Feb 2026) even to stay on its free tier.
 */
export async function uploadToCloudinary(file: Blob, fileName: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured — check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env')
  }

  const formData = new FormData()
  formData.append('file', file, fileName)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.error?.message || 'Upload to Cloudinary failed')
  }

  const data = await response.json()
  return data.secure_url as string
}