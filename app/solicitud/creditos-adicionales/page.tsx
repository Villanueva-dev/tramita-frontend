'use client'

import { useState } from 'react'
import { PublicRequestSections, type PublicRequestFormValues } from '@/components/do-fr-100/sections'

export const PUBLIC_REQUEST_DEFINITION_CODE = 'ADICION_CREDITOS'

const INITIAL_VALUES: PublicRequestFormValues = {
  studentName: '',
  studentDocument: '',
  studentEmail: '',
  studentPhone: '',
  program: '',
  campus: '',
  faculty: '',
  modality: '',
  semester: '',
  reason: '',
}

export default function PublicAdditionalCreditsPage() {
  const [values, setValues] = useState(INITIAL_VALUES)

  function handleChange(field: keyof PublicRequestFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Solicitud de matrícula de créditos adicionales
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete la información solicitada para radicar su solicitud.
          </p>
        </header>
        <PublicRequestSections values={values} onChange={handleChange} />
      </div>
    </main>
  )
}
