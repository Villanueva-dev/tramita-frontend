import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CanvasFirma, type SignatureCapture } from './canvas-firma'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CanvasFirma', () => {
  it('reports an unsigned initial capture', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()

    render(<CanvasFirma onChange={onChange} />)

    expect(onChange).toHaveBeenCalledWith({ dataUrl: '', hayFirma: false })
    expect(screen.getByRole('button', { name: 'Limpiar firma' }).hasAttribute('disabled')).toBe(true)
  })

  it('does not treat a blank PNG as a signature', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,BLANK')

    render(<CanvasFirma onChange={onChange} />)

    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: '', hayFirma: false })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('captures a drawn signature with pointer capture, pixel-ratio sizing, and midpoint smoothing', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    const pointerCapture = installPointerCapture()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 })

    render(<CanvasFirma onChange={onChange} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      bottom: 80,
      height: 80,
      left: 10,
      right: 210,
      top: 0,
      width: 200,
      x: 10,
      y: 0,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
    fireEvent.pointerMove(canvas, { clientX: 60, clientY: 30, pointerId: 4 })

    expect(pointerCapture.set).toHaveBeenCalledWith(4)
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(160)
    expect(context.scale).toHaveBeenCalledWith(2, 2)
    expect(context.quadraticCurveTo).toHaveBeenCalledWith(10, 10, 30, 20)
    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: 'data:image/png;base64,DRAWN', hayFirma: true })
  })

  it('draws when pointer capture is unavailable, as on touch environments that do not support it', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')
    const restorePointerCapture = removePointerCapture()

    try {
      render(<CanvasFirma onChange={onChange} />)
      const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement

      fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 30, pointerId: 4 })

      expect(context.quadraticCurveTo).toHaveBeenCalledWith(20, 10, 40, 20)
      expect(onChange).toHaveBeenLastCalledWith({ dataUrl: 'data:image/png;base64,DRAWN', hayFirma: true })
    } finally {
      restorePointerCapture()
    }
  })

  it('keeps the existing drawing when a second stroke starts', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    installPointerCapture()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')

    render(<CanvasFirma onChange={onChange} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
    fireEvent.pointerUp(canvas, { pointerId: 4 })
    fireEvent.pointerDown(canvas, { clientX: 60, clientY: 30, pointerId: 5 })

    expect(context.scale).toHaveBeenCalledTimes(1)
    expect(context.moveTo).toHaveBeenCalledWith(20, 10)
    expect(context.moveTo).toHaveBeenCalledWith(60, 30)
  })

  it('clears the signature state and preserves the gesture-prevention declaration', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    installPointerCapture()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')

    render(<CanvasFirma onChange={onChange} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar firma' }))

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height)
    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: '', hayFirma: false })
    expect(canvas.style.touchAction).toBe('none')
  })
})

function createCanvasContext() {
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    lineCap: 'butt',
    lineJoin: 'miter',
    lineTo: vi.fn(),
    lineWidth: 1,
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    scale: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

function installPointerCapture() {
  const set = vi.fn()
  Object.defineProperties(HTMLCanvasElement.prototype, {
    hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
    releasePointerCapture: { configurable: true, value: vi.fn() },
    setPointerCapture: { configurable: true, value: set },
  })
  return { set }
}

function removePointerCapture() {
  const descriptors = ['hasPointerCapture', 'releasePointerCapture', 'setPointerCapture'].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name),
  ] as const)

  for (const [name] of descriptors) {
    Object.defineProperty(HTMLCanvasElement.prototype, name, { configurable: true, value: undefined })
  }

  return () => {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLCanvasElement.prototype, name, descriptor)
      } else {
        Reflect.deleteProperty(HTMLCanvasElement.prototype, name)
      }
    }
  }
}
