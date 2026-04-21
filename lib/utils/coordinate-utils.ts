/**
 * Utility functions for handling image coordinates in labeling questions
 */

export interface ImageDimensions {
  naturalWidth: number
  naturalHeight: number
  displayWidth: number
  displayHeight: number
}

export interface Position {
  x: number
  y: number
  width: number
  height: number
}

export interface ClickCoordinates {
  clientX: number
  clientY: number
  imageRect: DOMRect
}

/**
 * Calculate the actual displayed image dimensions considering object-fit: contain
 */
export function getActualImageDimensions(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
): {
  actualWidth: number
  actualHeight: number
  offsetX: number
  offsetY: number
  scale: number
} {
  // Calculate scale factors
  const scaleX = containerWidth / naturalWidth
  const scaleY = containerHeight / naturalHeight
  const scale = Math.min(scaleX, scaleY) // object-fit: contain uses the smaller scale

  // Calculate actual displayed dimensions
  const actualWidth = naturalWidth * scale
  const actualHeight = naturalHeight * scale

  // Calculate offsets to center the image
  const offsetX = (containerWidth - actualWidth) / 2
  const offsetY = (containerHeight - actualHeight) / 2

  return {
    actualWidth,
    actualHeight,
    offsetX,
    offsetY,
    scale,
  }
}

/**
 * Convert click coordinates to percentage relative to actual image
 */
export function clickToPercentage(
  clickCoordinates: ClickCoordinates,
  naturalWidth: number,
  naturalHeight: number,
): { x: number; y: number } | null {
  const { clientX, clientY, imageRect } = clickCoordinates

  // Get click position relative to image container
  const clickX = clientX - imageRect.left
  const clickY = clientY - imageRect.top

  // Get actual image dimensions
  const { actualWidth, actualHeight, offsetX, offsetY } = getActualImageDimensions(
    naturalWidth,
    naturalHeight,
    imageRect.width,
    imageRect.height,
  )

  // Adjust click coordinates relative to actual image
  const adjustedX = clickX - offsetX
  const adjustedY = clickY - offsetY

  // Check if click is within image bounds
  if (adjustedX < 0 || adjustedY < 0 || adjustedX > actualWidth || adjustedY > actualHeight) {
    return null // Click is outside image
  }

  // Convert to percentage
  const x = (adjustedX / actualWidth) * 100
  const y = (adjustedY / actualHeight) * 100

  return { x, y }
}

/**
 * Convert percentage coordinates to pixel coordinates for API
 */
export function percentageToPixel(
  position: Position,
  imageWidth: number,
  imageHeight: number,
): {
  x: number
  y: number
  w: number
  h: number
} {
  return {
    x: Math.round((position.x / 100) * imageWidth),
    y: Math.round((position.y / 100) * imageHeight),
    w: Math.round((position.width / 100) * imageWidth),
    h: Math.round((position.height / 100) * imageHeight),
  }
}

/**
 * Convert pixel coordinates to percentage coordinates
 */
export function pixelToPercentage(
  coordinates: { x: number; y: number; w: number; h: number },
  imageWidth: number,
  imageHeight: number,
): Position {
  return {
    x: (coordinates.x / imageWidth) * 100,
    y: (coordinates.y / imageHeight) * 100,
    width: (coordinates.w / imageWidth) * 100,
    height: (coordinates.h / imageHeight) * 100,
  }
}

/**
 * Validate if coordinates are within image bounds
 */
export function validateCoordinates(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x + width <= 100 && y + height <= 100
}

/**
 * Clamp coordinates to ensure they stay within bounds
 */
export function clampCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const clampedX = Math.max(0, Math.min(100 - width, x))
  const clampedY = Math.max(0, Math.min(100 - height, y))
  const clampedWidth = Math.min(width, 100 - clampedX)
  const clampedHeight = Math.min(height, 100 - clampedY)

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  }
}
