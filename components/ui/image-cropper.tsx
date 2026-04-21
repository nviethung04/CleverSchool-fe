"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import '@/styles/admin-profile-mobile.css'

interface ImageCropperProps {
    imageFile: File | null
    isOpen: boolean
    onClose: () => void
    onCropComplete: (croppedFile: File) => void
    aspectRatio?: number // width/height, default is 1 (square)
    cropSize?: number // size of crop area in pixels, default is 300
}

export default function ImageCropper({
    imageFile,
    isOpen,
    onClose,
    onCropComplete,
    aspectRatio = 1,
    cropSize = 300
}: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const [imageSrc, setImageSrc] = useState<string>('')
    const [scale, setScale] = useState([1])
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
    const [isMobile, setIsMobile] = useState(false)

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Prevent scrolling when dragging on mobile
    useEffect(() => {
        if (isDragging && isMobile) {
            document.body.style.overflow = 'hidden'
            document.body.style.touchAction = 'none'
        } else {
            document.body.style.overflow = ''
            document.body.style.touchAction = ''
        }

        return () => {
            document.body.style.overflow = ''
            document.body.style.touchAction = ''
        }
    }, [isDragging, isMobile])

    // Load image when file changes
    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader()
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImageSrc(e.target.result as string)
                }
            }
            reader.readAsDataURL(imageFile)
        }
    }, [imageFile])

    // Draw image on canvas
    const drawImage = useCallback(() => {
        const canvas = canvasRef.current
        const image = imageRef.current
        if (!canvas || !image) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate scaled image dimensions
        const scaledWidth = imageSize.width * scale[0]
        const scaledHeight = imageSize.height * scale[0]

        // Draw image
        ctx.drawImage(
            image,
            position.x,
            position.y,
            scaledWidth,
            scaledHeight
        )

        // Draw crop overlay
        const cropWidth = effectiveCropSize
        const cropHeight = effectiveCropSize / aspectRatio
        const cropX = (canvas.width - cropWidth) / 2
        const cropY = (canvas.height - cropHeight) / 2

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Clear crop area
        ctx.clearRect(cropX, cropY, cropWidth, cropHeight)

        // Redraw image in crop area
        ctx.save()
        ctx.beginPath()
        ctx.rect(cropX, cropY, cropWidth, cropHeight)
        ctx.clip()
        ctx.drawImage(
            image,
            position.x,
            position.y,
            scaledWidth,
            scaledHeight
        )
        ctx.restore()

        // Draw crop border
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
    }, [scale, position, imageSize, cropSize, aspectRatio])

    // Handle image load
    const handleImageLoad = useCallback(() => {
        const image = imageRef.current
        const canvas = canvasRef.current
        if (!image || !canvas) return

        // Set canvas size based on device
        const canvasSize = isMobile ? 280 : 500
        canvas.width = canvasSize
        canvas.height = canvasSize

        // Calculate initial image size and position
        const maxSize = isMobile ? 240 : 400
        let width = image.naturalWidth
        let height = image.naturalHeight

        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width
                width = maxSize
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height
                height = maxSize
            }
        }

        setImageSize({ width, height })
        setPosition({
            x: (canvas.width - width) / 2,
            y: (canvas.height - height) / 2
        })
        setScale([1])
    }, [isMobile])

    // Update crop size for mobile
    const effectiveCropSize = isMobile ? Math.min(cropSize, 200) : cropSize

    // Redraw when values change
    useEffect(() => {
        drawImage()
    }, [drawImage])

    // Unified pointer event handlers for both mouse and touch
    const getPointerPosition = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
        const pointerPos = getPointerPosition(e)
        setDragStart({
            x: pointerPos.x - position.x,
            y: pointerPos.y - position.y
        })

        // Capture pointer for consistent tracking
        if (canvasRef.current) {
            canvasRef.current.setPointerCapture(e.pointerId)
        }
    }, [position])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return
        e.preventDefault()
        e.stopPropagation()

        const pointerPos = getPointerPosition(e)
        setPosition({
            x: pointerPos.x - dragStart.x,
            y: pointerPos.y - dragStart.y
        })
    }, [isDragging, dragStart])

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        // Release pointer capture
        if (canvasRef.current) {
            canvasRef.current.releasePointerCapture(e.pointerId)
        }
    }, [])

    // Prevent context menu on long press (mobile)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
    }, [])

    // Crop and export image
    const handleCrop = useCallback(() => {
        const canvas = canvasRef.current
        const image = imageRef.current
        if (!canvas || !image) return

        // Create crop canvas
        const cropCanvas = document.createElement('canvas')
        const cropCtx = cropCanvas.getContext('2d')
        if (!cropCtx) return

        const cropWidth = effectiveCropSize
        const cropHeight = effectiveCropSize / aspectRatio
        cropCanvas.width = cropWidth
        cropCanvas.height = cropHeight

        // Calculate crop area
        const canvasCropX = (canvas.width - cropWidth) / 2
        const canvasCropY = (canvas.height - cropHeight) / 2

        // Calculate source coordinates on original image
        const scaledWidth = imageSize.width * scale[0]
        const scaledHeight = imageSize.height * scale[0]

        const sourceX = (canvasCropX - position.x) * (image.naturalWidth / scaledWidth)
        const sourceY = (canvasCropY - position.y) * (image.naturalHeight / scaledHeight)
        const sourceWidth = cropWidth * (image.naturalWidth / scaledWidth)
        const sourceHeight = cropHeight * (image.naturalHeight / scaledHeight)

        // Draw cropped image
        cropCtx.drawImage(
            image,
            Math.max(0, sourceX),
            Math.max(0, sourceY),
            Math.min(sourceWidth, image.naturalWidth - Math.max(0, sourceX)),
            Math.min(sourceHeight, image.naturalHeight - Math.max(0, sourceY)),
            0,
            0,
            cropWidth,
            cropHeight
        )

        // Convert to blob and create file
        cropCanvas.toBlob((blob) => {
            if (blob) {
                const croppedFile = new File([blob], 'cropped-avatar.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                })
                onCropComplete(croppedFile)
            }
        }, 'image/jpeg', 0.9)
    }, [scale, position, imageSize, effectiveCropSize, aspectRatio, onCropComplete])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`${isMobile ? 'max-w-sm w-[95vw] max-h-[90vh] overflow-y-auto p-4' : 'max-w-2xl'}`}>
                <DialogHeader>
                    <DialogTitle className={isMobile ? 'text-lg' : 'text-xl'}>Cắt ảnh đại diện</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4">
                    {/* Hidden image for reference */}
                    {imageSrc && (
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Source"
                            style={{ display: 'none' }}
                            onLoad={handleImageLoad}
                        />
                    )}

                    {/* Canvas for cropping */}
                    <div className="relative">
                        <canvas
                            ref={canvasRef}
                            className={`border border-gray-300 cursor-move select-none image-cropper-canvas ${isMobile ? 'touch-none' : ''
                                }`}
                            style={{
                                touchAction: 'none',
                                maxWidth: isMobile ? '100%' : 'none',
                                height: 'auto'
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            onContextMenu={handleContextMenu}
                        />
                        {isMobile && (
                            <div className="absolute -bottom-6 left-0 right-0 text-center">
                                <p className="text-xs text-gray-500">
                                    Chạm và kéo để di chuyển
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Scale slider */}
                    <div className={`w-full space-y-2 image-cropper-slider ${isMobile ? 'max-w-xs' : 'max-w-sm'}`}>
                        <label className="text-sm font-medium">Zoom</label>
                        <Slider
                            value={scale}
                            onValueChange={setScale}
                            min={0.5}
                            max={3}
                            step={0.1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>0.5x</span>
                            <span>3x</span>
                        </div>
                    </div>

                    {!isMobile && (
                        <p className="text-sm text-gray-600 text-center">
                            Kéo để di chuyển ảnh, sử dụng thanh trượt để phóng to/thu nhỏ
                        </p>
                    )}
                </div>

                <DialogFooter className={`image-cropper-button-group ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-2'}`}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className={isMobile ? 'w-full order-2' : ''}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCrop}
                        className={isMobile ? 'w-full order-1' : ''}
                    >
                        Cắt ảnh
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
