/**
 * Client-side image compression utility.
 * Compresses any image file to fit under a target size (default 700KB)
 * using the Canvas API. Works entirely in the browser — no server needed.
 * 
 * Strategy:
 * 1. Resize to maxWidth if the image is too wide
 * 2. Start with quality 0.85, then iteratively reduce quality until
 *    the output is under the target size
 * 3. If still too large after quality = 0.1, reduce dimensions further
 * 4. Returns a Blob (not a data URL) for efficient FormData upload
 */

/**
 * Compress an image File to under targetSizeKB.
 * @param {File} file - The image file to compress
 * @param {Object} options
 * @param {number} options.maxSizeKB - Max output size in KB (default: 650, gives buffer for 700KB server limit)
 * @param {number} options.maxWidth - Max output width in px (default: 1200)
 * @param {number} options.maxHeight - Max output height in px (default: 1200)
 * @returns {Promise<{blob: Blob, dataUrl: string, originalSize: number, compressedSize: number}>}
 */
export const compressImageFile = (file, options = {}) => {
  const { maxSizeKB = 650, maxWidth = 1200, maxHeight = 1200 } = options

  return new Promise((resolve, reject) => {
    // If file is already small enough and is JPEG/WebP, return as-is
    if (file.size <= maxSizeKB * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve({
          blob: file,
          dataUrl: e.target.result,
          originalSize: file.size,
          compressedSize: file.size,
          wasCompressed: false
        })
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      try {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Scale down if too large
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Try progressively lower quality until we fit
        const targetBytes = maxSizeKB * 1024
        const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15, 0.1]

        const tryCompress = (qualityIdx, currentCanvas, currentWidth, currentHeight) => {
          if (qualityIdx >= qualities.length) {
            // All qualities exhausted at current size — shrink dimensions by 50% and retry
            if (currentWidth > 200) {
              const newW = Math.round(currentWidth * 0.6)
              const newH = Math.round(currentHeight * 0.6)
              const smallerCanvas = document.createElement('canvas')
              smallerCanvas.width = newW
              smallerCanvas.height = newH
              const smallerCtx = smallerCanvas.getContext('2d')
              smallerCtx.drawImage(currentCanvas, 0, 0, newW, newH)
              tryCompress(0, smallerCanvas, newW, newH)
            } else {
              // Give up gracefully — return the smallest we could get
              currentCanvas.toBlob(
                (blob) => {
                  if (!blob) return reject(new Error('Compression failed'))
                  blobToResult(blob)
                },
                'image/jpeg',
                0.1
              )
            }
            return
          }

          currentCanvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Compression failed'))

              if (blob.size <= targetBytes) {
                blobToResult(blob)
              } else {
                tryCompress(qualityIdx + 1, currentCanvas, currentWidth, currentHeight)
              }
            },
            'image/jpeg',
            qualities[qualityIdx]
          )
        }

        const blobToResult = (blob) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              blob,
              dataUrl: e.target.result,
              originalSize: file.size,
              compressedSize: blob.size,
              wasCompressed: true
            })
          }
          reader.onerror = () => reject(new Error('Failed to read compressed blob'))
          reader.readAsDataURL(blob)
        }

        tryCompress(0, canvas, width, height)
      } catch (err) {
        reject(new Error('Compression error: ' + err.message))
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}

/**
 * Legacy-compatible compressImage function.
 * Returns a data URL string (used by ReporterDashboard's existing code).
 * @param {File} file
 * @param {number} maxSizeKB
 * @param {number} maxWidth
 * @returns {Promise<string>} data URL
 */
export const compressImage = async (file, maxSizeKB = 650, maxWidth = 1200) => {
  const result = await compressImageFile(file, { maxSizeKB, maxWidth })
  return result.dataUrl
}

/**
 * Helper: get a human-readable file size string
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
