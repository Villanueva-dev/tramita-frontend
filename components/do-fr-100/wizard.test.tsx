import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

import { StepNavigation, StepPanel, StepProgress } from './wizard'
import type { StepId } from './steps'

afterEach(() => {
  cleanup()
})

describe('StepPanel', () => {
  it.each([
    ['applicant', 'Datos del solicitante'],
    ['reason', 'Motivo de la solicitud'],
    ['signature', 'Firma del solicitante'],
  ] as [StepId, string][])('titula el panel activo de %s con el encabezado oficial del bloque', (step, heading) => {
    render(
      <StepPanel step={step} active headingRef={createRef()} panelRef={createRef()}>
        <p>Contenido del paso</p>
      </StepPanel>,
    )

    const headingEl = screen.getByRole('heading', { level: 2, name: heading })
    expect(headingEl.tabIndex).toBe(-1)
  })

  it('muestra el contenido del panel activo', () => {
    render(
      <StepPanel step="applicant" active headingRef={createRef()} panelRef={createRef()}>
        <p>Contenido visible</p>
      </StepPanel>,
    )

    expect(screen.getByText('Contenido visible')).toBeDefined()
  })

  it('oculta el panel inactivo con el atributo hidden, invisible para las consultas por rol', () => {
    render(
      <StepPanel step="academic" active={false} headingRef={createRef()} panelRef={createRef()}>
        <p>Contenido oculto</p>
      </StepPanel>,
    )

    expect(screen.queryByRole('heading', { level: 2, name: 'Datos académicos' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Datos académicos', hidden: true })).toBeDefined()
  })

  it('asigna headingRef y panelRef solo cuando el panel está activo', () => {
    const activeHeadingRef = createRef<HTMLHeadingElement>()
    const activePanelRef = createRef<HTMLElement>()
    const { rerender } = render(
      <StepPanel step="applicant" active headingRef={activeHeadingRef} panelRef={activePanelRef}>
        <p>Contenido</p>
      </StepPanel>,
    )

    expect(activeHeadingRef.current).not.toBeNull()
    expect(activePanelRef.current).not.toBeNull()

    const inactiveHeadingRef = createRef<HTMLHeadingElement>()
    const inactivePanelRef = createRef<HTMLElement>()
    rerender(
      <StepPanel step="applicant" active={false} headingRef={inactiveHeadingRef} panelRef={inactivePanelRef}>
        <p>Contenido</p>
      </StepPanel>,
    )

    expect(inactiveHeadingRef.current).toBeNull()
    expect(inactivePanelRef.current).toBeNull()
  })
})

describe('StepProgress', () => {
  it('lista las cinco etiquetas de los pasos en el orden de la spec', () => {
    render(<StepProgress current="applicant" stepsWithErrors={new Set()} />)

    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'Sus datos',
      'Datos académicos',
      'Motivo de la solicitud',
      'Firma',
      'Revisar y enviar',
    ])
  })

  it('marca el paso activo con aria-current="step" y solo ese', () => {
    render(<StepProgress current="reason" stepsWithErrors={new Set()} />)

    const items = screen.getAllByRole('listitem')
    const current = items.filter((item) => item.getAttribute('aria-current') === 'step')
    expect(current).toHaveLength(1)
    expect(within(current[0]!).getByText('Motivo de la solicitud')).toBeDefined()
  })

  it('marca los pasos con error sin ocultar su etiqueta, para lectores de pantalla', () => {
    render(<StepProgress current="applicant" stepsWithErrors={new Set(['academic', 'signature'])} />)

    const items = screen.getAllByRole('listitem')
    const marked = items.filter((item) => within(item).queryByText('(con errores)', { exact: false }))
    expect(marked).toHaveLength(2)
    expect(marked[0]!.textContent ?? '').toContain('Datos académicos')
    expect(marked[1]!.textContent ?? '').toContain('Firma')
  })

  it('distingue de forma visible (no solo para lectores de pantalla) los pasos con error de los que no lo tienen', () => {
    render(<StepProgress current="applicant" stepsWithErrors={new Set(['academic', 'signature'])} />)

    const items = screen.getAllByRole('listitem')
    const withError = items.filter((item) => item.getAttribute('data-error') === 'true')
    const withoutError = items.filter((item) => item.getAttribute('data-error') !== 'true')

    expect(withError).toHaveLength(2)
    expect(withError[0]!.textContent ?? '').toContain('Datos académicos')
    expect(withError[1]!.textContent ?? '').toContain('Firma')
    expect(withoutError).toHaveLength(3)
  })

  it('mantiene distinguible el paso activo cuando también tiene error', () => {
    render(<StepProgress current="academic" stepsWithErrors={new Set(['academic'])} />)

    const items = screen.getAllByRole('listitem')
    const currentWithError = items.find((item) => item.getAttribute('aria-current') === 'step')

    expect(currentWithError).toBeDefined()
    expect(currentWithError!.getAttribute('data-error')).toBe('true')
  })

  it('no contiene ningún elemento interactivo: la barra no permite saltar de paso', () => {
    render(<StepProgress current="signature" stepsWithErrors={new Set(['applicant'])} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(document.querySelectorAll('button, a, input')).toHaveLength(0)
  })
})

describe('StepNavigation', () => {
  it('oculta Volver en el primer paso y ofrece Continuar como envío', () => {
    render(<StepNavigation step="applicant" isSubmitting={false} onBack={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull()
    const submit = screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement
    expect(submit.getAttribute('type')).toBe('submit')
  })

  it.each(['academic', 'reason', 'signature'] as StepId[])(
    'muestra Volver en los pasos siguientes (%s) y despacha onBack al pulsarlo',
    (step) => {
      const onBack = vi.fn()
      render(<StepNavigation step={step} isSubmitting={false} onBack={onBack} />)

      const back = screen.getByRole('button', { name: 'Volver' }) as HTMLButtonElement
      expect(back.getAttribute('type')).toBe('button')
      fireEvent.click(back)
      expect(onBack).toHaveBeenCalledTimes(1)
    },
  )

  it('cambia la etiqueta del botón de envío a Enviar solicitud en la revisión', () => {
    render(<StepNavigation step="review" isSubmitting={false} onBack={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDefined()
  })

  it('deshabilita el botón de envío y muestra el texto de progreso mientras isSubmitting', () => {
    render(<StepNavigation step="review" isSubmitting onBack={vi.fn()} />)

    const submit = screen.getByRole('button', { name: 'Enviando solicitud...' }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)
  })
})
