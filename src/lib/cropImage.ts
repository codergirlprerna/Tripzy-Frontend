export type CropArea = { x: number; y: number; width: number; height: number }

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Crops and rotates an image per react-easy-crop's crop area, returning a JPEG blob.
 * Note: this necessarily strips EXIF metadata — a canvas re-encode has no way to
 * preserve it. Any EXIF-derived date/location must be extracted from the ORIGINAL
 * file before calling this, and carried forward separately.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  cropArea: CropArea,
  rotationDegrees: number,
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const radians = (rotationDegrees * Math.PI) / 180

  // Size a temp canvas big enough to hold the rotated full image, rotate into it,
  // then crop the requested area out of that rotated result.
  const rotatedWidth = Math.abs(Math.cos(radians) * image.width) + Math.abs(Math.sin(radians) * image.height)
  const rotatedHeight = Math.abs(Math.sin(radians) * image.width) + Math.abs(Math.cos(radians) * image.height)

  canvas.width = rotatedWidth
  canvas.height = rotatedHeight
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2)
  ctx.rotate(radians)
  ctx.drawImage(image, -image.width / 2, -image.height / 2)

  const rotatedImageData = ctx.getImageData(0, 0, rotatedWidth, rotatedHeight)

  const cropCanvas = document.createElement('canvas')
  const cropCtx = cropCanvas.getContext('2d')
  if (!cropCtx) throw new Error('Canvas not supported')

  cropCanvas.width = cropArea.width
  cropCanvas.height = cropArea.height

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = rotatedWidth
  tempCanvas.height = rotatedHeight
  tempCanvas.getContext('2d')!.putImageData(rotatedImageData, 0, 0)

  cropCtx.drawImage(tempCanvas, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height)

  return new Promise((resolve, reject) => {
    cropCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not export the edited image'))
      },
      'image/jpeg',
      0.92,
    )
  })
}