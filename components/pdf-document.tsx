import type { AcademicRequest } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { REQUEST_TYPE_LABELS } from '@/lib/mock-data'

export function PdfDocument({ request }: { request: AcademicRequest }) {
  const completed = request.timeline.find((h) => h.toStatus === 'finalizado')
  const folio = `RC-${request.id.replace(/\D/g, '').padStart(6, '0')}`
  const isNotas = request.type === 'novedad_notas'
  const primary = request.subjects[0]

  return (
    <div className="mx-auto w-full max-w-[820px] bg-white text-[#1a1a1a] shadow-sm">
      <div className="w-full px-10 py-10 sm:px-16 sm:py-14">
        {/* Header */}
        <header className="flex items-start justify-between border-b-2 border-[#0a2a66] pb-6">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-md bg-[#0a2a66] font-serif text-2xl font-bold text-white">
              R
            </div>
            <div>
              <p className="font-serif text-lg font-bold leading-tight text-[#0a2a66]">
                Universidad Remington
              </p>
              <p className="text-sm text-[#555]">
                Sede Cali · Coordinación Académica
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-[#555]">
            <p className="font-semibold text-[#b00020]">DOCUMENTO OFICIAL</p>
            <p>Folio: {folio}</p>
            <p>Radicado: {request.radicado}</p>
            <p>
              Fecha:{' '}
              {completed
                ? formatDate(completed.date)
                : formatDate(request.updatedAt)}
            </p>
          </div>
        </header>

        {/* Title */}
        <div className="mt-8 text-center">
          <h1 className="font-serif text-xl font-bold uppercase tracking-wide text-[#0a2a66]">
            Constancia de {REQUEST_TYPE_LABELS[request.type]}
          </h1>
          <p className="mt-1 text-sm text-[#666]">
            Resolución de solicitud académica
          </p>
        </div>

        {/* Body */}
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-[#333]">
          <p>
            La Coordinación Académica de la Universidad Remington, Sede Cali,
            hace constar que se ha tramitado y resuelto la siguiente solicitud
            académica conforme al procedimiento institucional vigente:
          </p>

          <table className="w-full border-collapse text-sm">
            <tbody>
              {[
                ['Estudiante', request.studentName],
                ['Documento / Cédula', request.studentCedula],
                ['Código estudiantil', request.studentCode],
                ['Programa', request.program],
                ['Semestre', request.semester],
                ['Correo institucional', request.studentEmail],
                ['Tipo de trámite', REQUEST_TYPE_LABELS[request.type]],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-[#e5e5e5]">
                  <td className="w-1/3 py-2 pr-4 align-top font-semibold text-[#0a2a66]">
                    {k}
                  </td>
                  <td className="py-2 text-[#333]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <p className="font-semibold text-[#0a2a66]">Detalle del trámite</p>
            {isNotas ? (
              <p className="mt-1">
                Se autoriza la novedad de notas para la asignatura{' '}
                <strong>{primary?.name}</strong> ({primary?.code}), modificando
                la calificación de{' '}
                <strong>{primary?.currentGrade ?? '—'}</strong> a{' '}
                <strong>{primary?.proposedGrade ?? '—'}</strong>.
              </p>
            ) : (
              <p className="mt-1">
                Se autoriza la adición de{' '}
                <strong>
                  {request.subjects.reduce((sum, s) => sum + s.credits, 0)}{' '}
                  créditos
                </strong>{' '}
                correspondientes a{' '}
                {request.subjects.map((s, i) => (
                  <span key={s.code}>
                    {i > 0 ? ', ' : ''}
                    <strong>{s.name}</strong> ({s.code})
                  </span>
                ))}
                .
              </p>
            )}
          </div>

          <div>
            <p className="font-semibold text-[#0a2a66]">Justificación</p>
            <p className="mt-1 text-[#333]">{request.reason}</p>
          </div>

          {completed?.comment && (
            <div>
              <p className="font-semibold text-[#0a2a66]">
                Observación de cierre
              </p>
              <p className="mt-1 text-[#333]">{completed.comment}</p>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="mt-14 flex items-end justify-between gap-8">
          <div className="flex-1 text-center">
            <div className="border-t border-[#333] pt-2">
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {completed?.actor ?? request.assignedTo}
              </p>
              <p className="text-xs text-[#666]">
                Coordinador(a) Académico · Sede Cali
              </p>
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="mb-1 grid h-16 place-items-center">
              <div className="grid size-16 place-items-center rounded-md border-2 border-dashed border-[#b00020] text-[9px] font-semibold uppercase text-[#b00020]">
                Sello
              </div>
            </div>
            <div className="border-t border-[#333] pt-2">
              <p className="text-xs text-[#666]">
                Registro y Control Académico
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#e5e5e5] pt-4 text-center text-[10px] leading-relaxed text-[#999]">
          <p>
            Documento generado electrónicamente por Trámita · Verificable con
            folio {folio}. Universidad Remington — Sede Cali.
          </p>
        </footer>
      </div>
    </div>
  )
}
