import type { AnnexRequirement } from '@/lib/types'

/**
 * El sistema no sabe si el anexo se adjuntó: el texto solo recuerda qué documento llevar y
 * de dónde sale, nunca lo da por entregado. Presentacional, como `CurrentStateBlock`: el
 * contenedor decide si renderizarlo o no.
 */
export function AnnexRequirementNotice({ documentName, sourceHint }: AnnexRequirement) {
  return (
    <section
      aria-labelledby="annex-requirement-heading"
      className="rounded-xl border p-5 shadow-sm border-primary/30 bg-primary/5"
    >
      <h3 id="annex-requirement-heading" className="font-semibold leading-none tracking-tight">
        Anexo requerido
      </h3>
      <p className="mt-3 text-sm">
        Para reenviar a la facultad, adjunte: {documentName}. {sourceHint}.
      </p>
    </section>
  )
}
