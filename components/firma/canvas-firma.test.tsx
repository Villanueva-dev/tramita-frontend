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
    expect(screen.getByRole('button', { name: 'Borrar y firmar de nuevo' }).hasAttribute('disabled')).toBe(true)
  })

  it('does not treat a blank PNG as a signature', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,BLANK')

    render(<CanvasFirma onChange={onChange} />)

    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: '', hayFirma: false })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('does not sign on a tap or sub-threshold movement', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')

    render(<CanvasFirma onChange={onChange} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
    fireEvent.pointerUp(canvas, { pointerId: 4 })
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 5 })
    fireEvent.pointerMove(canvas, { clientX: 22, clientY: 10, pointerId: 5 })
    fireEvent.pointerUp(canvas, { pointerId: 5 })

    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: '', hayFirma: false })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(context.stroke).not.toHaveBeenCalled()
    expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled()
  })

  it('draws independent continuous segments and serializes once when a meaningful stroke finishes', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    const pointerCapture = installPointerCapture()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    const toDataUrl = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')
    const restoreDevicePixelRatio = setDevicePixelRatio(2)

    try {
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
      fireEvent.pointerMove(canvas, { clientX: 100, clientY: 50, pointerId: 4 })

      expect(pointerCapture.set).toHaveBeenCalledWith(4)
      expect(canvas.width).toBe(400)
      expect(canvas.height).toBe(160)
      expect(context.scale).toHaveBeenCalledWith(2, 2)
      expect(context.lineWidth).toBe(2)
      expect(context.lineCap).toBe('round')
      expect(context.lineJoin).toBe('round')
      expect(context.beginPath).toHaveBeenCalledTimes(2)
      expect(context.moveTo).toHaveBeenNthCalledWith(1, 10, 10)
      expect(context.moveTo).toHaveBeenNthCalledWith(2, 30, 20)
      expect(context.quadraticCurveTo).toHaveBeenCalledWith(10, 10, 30, 20)
      expect(context.quadraticCurveTo).toHaveBeenCalledWith(50, 30, 70, 40)
      expect(context.stroke).toHaveBeenCalledTimes(2)
      expect(toDataUrl).not.toHaveBeenCalled()

      fireEvent.pointerUp(canvas, { clientX: 100, clientY: 50, pointerId: 4 })

      expect(toDataUrl).toHaveBeenCalledOnce()
      expect(toDataUrl).toHaveBeenCalledWith('image/png')
      expect(onChange).toHaveBeenLastCalledWith({ dataUrl: 'data:image/png;base64,DRAWN', hayFirma: true })
    } finally {
      restoreDevicePixelRatio()
    }
  })

  it('serializes a meaningful cancelled stroke so visible ink and parent state remain aligned', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    const toDataUrl = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')

    render(<CanvasFirma onChange={onChange} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
    fireEvent.pointerMove(canvas, { clientX: 60, clientY: 30, pointerId: 4 })
    fireEvent.pointerCancel(canvas, { pointerId: 4 })

    expect(toDataUrl).toHaveBeenCalledOnce()
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
      fireEvent.pointerUp(canvas, { clientX: 60, clientY: 30, pointerId: 4 })

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
    fireEvent.pointerMove(canvas, { clientX: 60, clientY: 10, pointerId: 4 })
    fireEvent.pointerUp(canvas, { pointerId: 4 })
    fireEvent.pointerDown(canvas, { clientX: 60, clientY: 30, pointerId: 5 })
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 40, pointerId: 5 })

    expect(context.scale).toHaveBeenCalledTimes(1)
    expect(context.moveTo).toHaveBeenNthCalledWith(1, 20, 10)
    expect(context.moveTo).toHaveBeenNthCalledWith(2, 60, 30)
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
    fireEvent.pointerMove(canvas, { clientX: 40, clientY: 10, pointerId: 4 })
    fireEvent.pointerUp(canvas, { pointerId: 4 })
    fireEvent.click(screen.getByRole('button', { name: 'Borrar y firmar de nuevo' }))

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height)
    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: '', hayFirma: false })
    expect(screen.getByRole('button', { name: 'Borrar y firmar de nuevo' }).hasAttribute('disabled')).toBe(true)
    expect(canvas.style.touchAction).toBe('none')
  })

  it('keeps an existing capture when the callback identity changes and reports later events to the latest callback', () => {
    const firstOnChange = vi.fn<(capture: SignatureCapture) => void>()
    const latestOnChange = vi.fn<(capture: SignatureCapture) => void>()
    const context = createCanvasContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,DRAWN')

    const { rerender } = render(<CanvasFirma onChange={firstOnChange} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 4 })
    fireEvent.pointerMove(canvas, { clientX: 40, clientY: 10, pointerId: 4 })

    rerender(<CanvasFirma onChange={latestOnChange} />)
    expect(latestOnChange).not.toHaveBeenCalledWith({ dataUrl: '', hayFirma: false })

    fireEvent.pointerMove(canvas, { clientX: 60, clientY: 10, pointerId: 4 })
    fireEvent.pointerUp(canvas, { pointerId: 4 })

    expect(latestOnChange).toHaveBeenLastCalledWith({ dataUrl: 'data:image/png;base64,DRAWN', hayFirma: true })
  })

  it('accepts an accessible PNG/JPEG upload as the signature alternative and clears its selection', () => {
    const onChange = vi.fn<(capture: SignatureCapture) => void>()
    const readAsDataURL = vi.fn()
    vi.stubGlobal('FileReader', class {
      onload: (() => void) | null = null
      result = 'data:image/png;base64,UPLOADED'

      readAsDataURL(file: Blob) {
        readAsDataURL(file)
        this.onload?.()
      }
    })

    render(<CanvasFirma onChange={onChange} />)
    const input = screen.getByLabelText('Cargar una imagen de firma') as HTMLInputElement
    const file = new File(['signature'], 'firma.png', { type: 'image/png' })
    input.focus()
    fireEvent.change(input, { target: { files: [file] } })

    expect(document.activeElement).toBe(input)
    expect(input.accept).toBe('image/png,image/jpeg')
    expect(readAsDataURL).toHaveBeenCalledWith(file)
    expect(screen.getByText('Imagen de firma cargada: firma.png')).toBeDefined()
    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: 'data:image/png;base64,UPLOADED', hayFirma: true })

    fireEvent.click(screen.getByRole('button', { name: 'Borrar y firmar de nuevo' }))

    expect(input.value).toBe('')
    expect(screen.queryByText('Imagen de firma cargada: firma.png')).toBeNull()
    expect(onChange).toHaveBeenLastCalledWith({ dataUrl: '', hayFirma: false })
  })

  it('grows the canvas to a 200 px drawing surface and a matching 52 px+ display height', () => {
    render(<CanvasFirma onChange={vi.fn()} />)
    const canvas = screen.getByLabelText('Área para dibujar la firma') as HTMLCanvasElement

    // El atributo `height` fija el lienzo de dibujo real (design.md, decisión 8: 160 → 200 px),
    // no solo su apariencia; `h-50` es la misma clase Tailwind que ya se verifica para los
    // botones (jsdom no calcula layout, así que la altura visible se lee de la clase declarada).
    expect(canvas.getAttribute('height')).toBe('200')
    expect(canvas.className).toContain('h-50')
  })

  it('overlays the signing guide and hint as non-drawn, inert elements over the canvas', () => {
    render(<CanvasFirma onChange={vi.fn()} />)

    const hint = screen.getByText('Firme aquí con el dedo o con el mouse')
    // `aria-hidden` y `pointerEvents: none` son el contrato real: un lector de pantalla lo
    // ignora y un dedo o el mouse lo atraviesan hasta el canvas — no se comprueba una clase
    // cosmética, sino el comportamiento de accesibilidad e interacción declarado.
    expect(hint.getAttribute('aria-hidden')).toBe('true')
    expect(hint.style.pointerEvents).toBe('none')
    expect(hint.tagName).not.toBe('CANVAS')
  })

  it('explains in visible text, linked via aria-describedby, when Borrar y firmar de nuevo is disabled', () => {
    render(<CanvasFirma onChange={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Borrar y firmar de nuevo' })
    const describedById = button.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()
    const explanation = document.getElementById(describedById as string)
    expect(explanation?.textContent).toBe('Se habilita cuando haya una firma.')
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

function setDevicePixelRatio(value: number) {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value })

  return () => {
    if (descriptor) {
      Object.defineProperty(window, 'devicePixelRatio', descriptor)
    } else {
      Reflect.deleteProperty(window, 'devicePixelRatio')
    }
  }
}
