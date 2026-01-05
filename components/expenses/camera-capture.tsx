'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

interface CameraCaptureProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCapture: (base64Image: string) => void
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
    const [selectedCamera, setSelectedCamera] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)

    // Fetch available cameras
    useEffect(() => {
        if (!open) return

        async function getCameras() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter(device => device.kind === 'videoinput')
                setCameras(videoDevices)

                // Prefer environment facing camera if available
                const envCamera = videoDevices.find(dev => dev.label.toLowerCase().includes('back') || dev.label.toLowerCase().includes('environment'))
                if (envCamera) {
                    setSelectedCamera(envCamera.deviceId)
                } else if (videoDevices.length > 0) {
                    setSelectedCamera(videoDevices[0].deviceId)
                }
            } catch (err) {
                console.error("Error enumerating devices:", err)
                // Don't error toast here, will fail gracefully when trying to get stream
            }
        }

        getCameras()
    }, [open])

    // Start video stream
    const startCamera = useCallback(async () => {
        if (!open) return

        setIsLoading(true)

        // Stop any existing stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                    facingMode: selectedCamera ? undefined : 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            }

            const newStream = await navigator.mediaDevices.getUserMedia(constraints)
            setStream(newStream)

            if (videoRef.current) {
                videoRef.current.srcObject = newStream
                videoRef.current.play()
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            toast.error("Could not access camera. Please ensure you have granted permission.")
            onOpenChange(false)
        } finally {
            setIsLoading(false)
        }
    }, [open, selectedCamera])

    // Start camera when opened or camera selection changes
    useEffect(() => {
        if (open) {
            startCamera()
        }

        return () => {
            // Cleanup on unmount or close
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [open, selectedCamera, startCamera]) // Added startCamera to dependencies

    // Stop stream when modal closes
    const handleClose = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        onOpenChange(false)
    }

    const switchCamera = () => {
        if (cameras.length <= 1) return

        const currentIndex = cameras.findIndex(c => c.deviceId === selectedCamera)
        const nextIndex = (currentIndex + 1) % cameras.length
        setSelectedCamera(cameras[nextIndex].deviceId)
    }

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const context = canvas.getContext('2d')
        if (context) {
            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Convert to base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
            onCapture(dataUrl)
            handleClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-black border-zinc-800">
                <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
                    <DialogTitle className="text-white sr-only">Take Photo</DialogTitle>
                    <div className="flex justify-between items-center w-full">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        {cameras.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={switchCamera}
                                className="text-white hover:bg-white/20 rounded-full"
                            >
                                <RefreshCw className="w-6 h-6" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-black flex items-center justify-center">
                    {isLoading && (
                        <div className="text-white flex flex-col items-center gap-2">
                            <Camera className="w-8 h-8 animate-pulse" />
                            <span>Starting camera...</span>
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="p-6 bg-black flex justify-center pb-8">
                    <Button
                        size="lg"
                        onClick={capturePhoto}
                        className="rounded-full w-16 h-16 p-0 border-4 border-white bg-transparent hover:bg-white/20 relative"
                    >
                        <span className="w-12 h-12 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
                        <span className="sr-only">Capture Photo</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
