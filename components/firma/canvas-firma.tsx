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

function midpoint(from: Point, to: Point): Point {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  }
}

export function CanvasFirma({ onChange }: CanvasFirmaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isCanvasPreparedRef = useRef(false)
  const previousPointRef = useRef<Point | null>(null)
  const [hayFirma, setHayFirma] = useState(false)

  useEffect(() => {
    onChange(EMPTY_SIGNATURE)
  }, [onChange])

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

  function markAsSigned(canvas: HTMLCanvasElement) {
    if (hayFirma) return
    setHayFirma(true)
    onChange({ dataUrl: canvas.toDataURL('image/png'), hayFirma: true })
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
    context.lineTo(point.x, point.y)
    context.stroke()
    previousPointRef.current = point
    markAsSigned(canvas)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!previousPointRef.current) return

    const canvas = event.currentTarget
    const nextPoint = pointFromEvent(event)
    const controlPoint = previousPointRef.current
    const endPoint = midpoint(controlPoint, nextPoint)
    const context = contextFor(canvas)

    context.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
    context.stroke()
    previousPointRef.current = nextPoint
    onChange({ dataUrl: canvas.toDataURL('image/png'), hayFirma: true })
  }

  function finishStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    releasePointer(event.currentTarget, event.pointerId)
    previousPointRef.current = null
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (canvas) {
      const context = contextFor(canvas)
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
    previousPointRef.current = null
    setHayFirma(false)
    onChange(EMPTY_SIGNATURE)
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
      <button type="button" onClick={clearSignature} disabled={!hayFirma}>
        Limpiar firma
      </button>
    </div>
  )
}
