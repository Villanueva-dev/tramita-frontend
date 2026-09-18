'use client'

import { useEffect, useRef, useState } from 'react'

export interface SignatureCapture {
  dataUrl: string
  hayFirma: boolean
}

interface CanvasFirmaProps {
  onChange: (capture: SignatureCapture) => void
}

interface Point {
  x: number
  y: number
}

const EMPTY_SIGNATURE: SignatureCapture = { dataUrl: '', hayFirma: false }
const CANVAS_HEIGHT = 160
const MINIMUM_STROKE_LENGTH = 4
const ACCEPTED_SIGNATURE_IMAGE_TYPES = ['image/png', 'image/jpeg']

function midpoint(from: Point, to: Point): Point {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  }
}

export function CanvasFirma({ onChange }: CanvasFirmaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const isCanvasPreparedRef = useRef(false)
  const previousPointRef = useRef<Point | null>(null)
  const strokeStartPointRef = useRef<Point | null>(null)
  const hasMeaningfulStrokeRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const [hayFirma, setHayFirma] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onChangeRef.current(EMPTY_SIGNATURE)
  }, [])

  function emit(capture: SignatureCapture) {
    setHayFirma(capture.hayFirma)
    onChangeRef.current(capture)
  }

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }

  function contextFor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar el lienzo de firma.')
    return context
  }

  function resizeCanvas(canvas: HTMLCanvasElement) {
    const bounds = canvas.getBoundingClientRect()
    const pixelRatio = window.devicePixelRatio || 1
    const width = bounds.width || canvas.clientWidth || 1
    const height = bounds.height || CANVAS_HEIGHT

    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)

    const context = contextFor(canvas)
    context.scale(pixelRatio, pixelRatio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2
  }

  function emitCanvasSignature(canvas: HTMLCanvasElement) {
    emit({ dataUrl: canvas.toDataURL('image/png'), hayFirma: true })
  }

  function capturePointer(canvas: HTMLCanvasElement, pointerId: number) {
    if (typeof canvas.setPointerCapture !== 'function') return

    try {
      canvas.setPointerCapture(pointerId)
    } catch {
      // Pointer capture improves continuity but drawing still works without it.
    }
  }

  function releasePointer(canvas: HTMLCanvasElement, pointerId: number) {
    if (typeof canvas.releasePointerCapture !== 'function') return

    try {
      canvas.releasePointerCapture(pointerId)
    } catch {
      // A pointer can end outside the canvas or without having been captured.
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget
    if (!isCanvasPreparedRef.current) {
      resizeCanvas(canvas)
      isCanvasPreparedRef.current = true
    }
    capturePointer(canvas, event.pointerId)

    const point = pointFromEvent(event)
    const context = contextFor(canvas)
    context.beginPath()
    context.moveTo(point.x, point.y)
    previousPointRef.current = point
    strokeStartPointRef.current = point
    hasMeaningfulStrokeRef.current = false
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!previousPointRef.current) return

    const canvas = event.currentTarget
    const nextPoint = pointFromEvent(event)
    const controlPoint = previousPointRef.current

    if (!hasMeaningfulStrokeRef.current && strokeStartPointRef.current) {
      const distanceFromStart = Math.hypot(
        nextPoint.x - strokeStartPointRef.current.x,
        nextPoint.y - strokeStartPointRef.current.y,
      )
      if (distanceFromStart < MINIMUM_STROKE_LENGTH) return
      hasMeaningfulStrokeRef.current = true
    }

    const endPoint = midpoint(controlPoint, nextPoint)
    const context = contextFor(canvas)

    context.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
    context.stroke()
    previousPointRef.current = nextPoint
    emitCanvasSignature(canvas)
  }

  function finishStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    releasePointer(event.currentTarget, event.pointerId)
    previousPointRef.current = null
    strokeStartPointRef.current = null
    hasMeaningfulStrokeRef.current = false
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (canvas && isCanvasPreparedRef.current) {
      const context = contextFor(canvas)
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  function clearSignature() {
    clearCanvas()
    previousPointRef.current = null
    strokeStartPointRef.current = null
    hasMeaningfulStrokeRef.current = false
    if (uploadInputRef.current) uploadInputRef.current.value = ''
    setUploadStatus(null)
    emit(EMPTY_SIGNATURE)
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_SIGNATURE_IMAGE_TYPES.includes(file.type)) {
      event.target.value = ''
      setUploadStatus('Seleccione una imagen PNG o JPEG de su firma.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      clearCanvas()
      setUploadStatus(`Imagen de firma cargada: ${file.name}`)
      emit({ dataUrl: reader.result, hayFirma: true })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        aria-label="Área para dibujar la firma"
        className="h-40 w-full touch-none rounded-lg border border-dashed border-border bg-muted/30"
        height={CANVAS_HEIGHT}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signature-upload">Cargar una imagen de firma</label>
        <input
          ref={uploadInputRef}
          id="signature-upload"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleUpload}
        />
        <p className="text-sm text-muted-foreground">
          Si no puede trazarla en el lienzo, cargue una imagen PNG o JPEG de su firma como alternativa accesible.
        </p>
        {uploadStatus ? <p role="status">{uploadStatus}</p> : null}
      </div>
      <button type="button" onClick={clearSignature} disabled={!hayFirma && !uploadStatus}>
        Limpiar firma
      </button>
    </div>
  )
}
