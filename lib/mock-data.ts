import type {
  AcademicRequest,
  RequestStatus,
  RequestType,
  RequestTypeConfig,
} from './types'

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  adicion_creditos: 'Adición de Créditos',
  novedad_notas: 'Novedad de Notas',
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  devuelto: 'Devuelto',
  aprobado: 'Aprobado',
  finalizado: 'Finalizado',
}

export const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Administración de Empresas',
  'Contaduría Pública',
  'Derecho',
  'Psicología',
]

export const COORDINATOR_NAME = 'Coord. Ana María Restrepo'

export const workflowConfig: RequestTypeConfig[] = [
  {
    id: 'adicion_creditos',
    label: 'Adición de Créditos',
    description:
      'Solicitud para inscribir créditos adicionales por encima del límite regular del semestre.',
    enabled: true,
    stages: [
      { id: 'radicacion', label: 'Radicación', description: 'Registro inicial de la solicitud' },
      { id: 'revision', label: 'Revisión de Coordinación', description: 'Validación de requisitos académicos' },
      { id: 'aprobacion', label: 'Aprobación', description: 'Decisión final del coordinador' },
      { id: 'cierre', label: 'Cierre y Notificación', description: 'Generación de PDF y notificación al estudiante' },
    ],
  },
  {
    id: 'novedad_notas',
    label: 'Novedad de Notas',
    description:
      'Solicitud de corrección o modificación de una calificación registrada.',
    enabled: true,
    stages: [
      { id: 'radicacion', label: 'Radicación', description: 'Registro inicial de la novedad' },
      { id: 'verificacion', label: 'Verificación Docente', description: 'Confirmación con el docente responsable' },
      { id: 'aprobacion', label: 'Aprobación', description: 'Autorización del cambio de nota' },
      { id: 'cierre', label: 'Cierre y Notificación', description: 'Generación de PDF y notificación al estudiante' },
    ],
  },
]

export const mockRequests: AcademicRequest[] = [
  {
    id: 'REQ-2401',
    radicado: 'TRA-2025-0142',
    type: 'adicion_creditos',
    status: 'pendiente',
    priority: 'urgente',
    createdAt: '2025-01-08T09:12:00',
    updatedAt: '2025-01-08T09:12:00',
    dueDate: '2025-01-11T23:59:00',
    studentCode: '1090234',
    studentCedula: '1017234567',
    studentName: 'Juliana Gómez Vélez',
    studentEmail: 'juliana.gomez@estudiante.remington.edu.co',
    program: 'Ingeniería de Sistemas',
    semester: 'Semestre 7',
    subjects: [
      { code: 'IS-704', name: 'Arquitectura de Software', credits: 3, group: 'A1' },
      { code: 'IS-712', name: 'Gestión de Proyectos TI', credits: 2, group: 'B2' },
    ],
    reason:
      'Solicito adición de 5 créditos para poder adelantar materias y graduarme en el periodo previsto. Cuento con promedio acumulado de 4.3.',
    attachments: [
      { id: 'a1', name: 'historial_academico.pdf', size: '248 KB', type: 'application/pdf' },
      { id: 'a2', name: 'carta_solicitud.pdf', size: '96 KB', type: 'application/pdf' },
    ],
    currentStage: 'radicacion',
    assignedTo: COORDINATOR_NAME,
    timeline: [
      {
        id: 't1',
        date: '2025-01-08T09:12:00',
        actor: 'Sistema Trámita',
        action: 'Solicitud radicada',
        toStatus: 'pendiente',
        comment: 'Solicitud creada y registrada en el sistema.',
      },
    ],
  },
  {
    id: 'REQ-2402',
    radicado: 'TRA-2025-0143',
    type: 'novedad_notas',
    status: 'en_revision',
    priority: 'normal',
    createdAt: '2025-01-07T14:30:00',
    updatedAt: '2025-01-08T08:05:00',
    dueDate: '2025-01-14T23:59:00',
    studentCode: '1088765',
    studentCedula: '1019876543',
    studentName: 'Andrés Felipe Cardona',
    studentEmail: 'andres.cardona@estudiante.remington.edu.co',
    program: 'Administración de Empresas',
    semester: 'Semestre 4',
    subjects: [
      {
        code: 'AD-402',
        name: 'Contabilidad Financiera',
        credits: 3,
        group: 'C1',
        currentGrade: '2.9',
        proposedGrade: '3.6',
      },
    ],
    reason:
      'El docente reportó una nota que no corresponde al promedio de las evaluaciones. Se adjunta acta de calificaciones firmada.',
    attachments: [
      { id: 'a3', name: 'acta_calificaciones.pdf', size: '312 KB', type: 'application/pdf' },
    ],
    currentStage: 'verificacion',
    assignedTo: COORDINATOR_NAME,
    timeline: [
      {
        id: 't1',
        date: '2025-01-07T14:30:00',
        actor: 'Sistema Trámita',
        action: 'Solicitud radicada',
        toStatus: 'pendiente',
      },
      {
        id: 't2',
        date: '2025-01-08T08:05:00',
        actor: COORDINATOR_NAME,
        action: 'Inició revisión',
        fromStatus: 'pendiente',
        toStatus: 'en_revision',
        comment: 'Se solicita verificación con el docente responsable.',
      },
    ],
  },
  {
    id: 'REQ-2403',
    radicado: 'TRA-2025-0139',
    type: 'adicion_creditos',
    status: 'devuelto',
    priority: 'normal',
    createdAt: '2025-01-05T10:00:00',
    updatedAt: '2025-01-06T16:20:00',
    dueDate: '2025-01-12T23:59:00',
    studentCode: '1077654',
    studentCedula: '1015551212',
    studentName: 'María Camila Ospina',
    studentEmail: 'maria.ospina@estudiante.remington.edu.co',
    program: 'Contaduría Pública',
    semester: 'Semestre 6',
    subjects: [
      { code: 'CP-601', name: 'Auditoría I', credits: 3, group: 'A2' },
    ],
    reason: 'Solicito adición de créditos para nivelar el plan de estudios.',
    attachments: [],
    currentStage: 'revision',
    assignedTo: COORDINATOR_NAME,
    timeline: [
      {
        id: 't1',
        date: '2025-01-05T10:00:00',
        actor: 'Sistema Trámita',
        action: 'Solicitud radicada',
        toStatus: 'pendiente',
      },
      {
        id: 't2',
        date: '2025-01-06T16:20:00',
        actor: COORDINATOR_NAME,
        action: 'Devolvió la solicitud',
        fromStatus: 'en_revision',
        toStatus: 'devuelto',
        comment:
          'Falta adjuntar el historial académico y la carta de justificación. Por favor completar la documentación.',
      },
    ],
  },
  {
    id: 'REQ-2404',
    radicado: 'TRA-2025-0138',
    type: 'novedad_notas',
    status: 'aprobado',
    priority: 'normal',
    createdAt: '2025-01-04T11:45:00',
    updatedAt: '2025-01-07T09:30:00',
    dueDate: '2025-01-13T23:59:00',
    studentCode: '1066543',
    studentCedula: '1013334455',
    studentName: 'Santiago Herrera López',
    studentEmail: 'santiago.herrera@estudiante.remington.edu.co',
    program: 'Derecho',
    semester: 'Semestre 8',
    subjects: [
      {
        code: 'DE-805',
        name: 'Derecho Procesal',
        credits: 4,
        group: 'A1',
        currentGrade: '3.1',
        proposedGrade: '3.9',
      },
    ],
    reason:
      'Error en el cargue de la nota final del segundo corte. El docente confirma la corrección.',
    attachments: [
      { id: 'a4', name: 'correo_docente.pdf', size: '84 KB', type: 'application/pdf' },
      { id: 'a5', name: 'acta_correccion.pdf', size: '190 KB', type: 'application/pdf' },
    ],
    currentStage: 'aprobacion',
    assignedTo: COORDINATOR_NAME,
    timeline: [
      { id: 't1', date: '2025-01-04T11:45:00', actor: 'Sistema Trámita', action: 'Solicitud radicada', toStatus: 'pendiente' },
      { id: 't2', date: '2025-01-05T08:15:00', actor: COORDINATOR_NAME, action: 'Inició revisión', fromStatus: 'pendiente', toStatus: 'en_revision' },
      { id: 't3', date: '2025-01-07T09:30:00', actor: COORDINATOR_NAME, action: 'Aprobó la solicitud', fromStatus: 'en_revision', toStatus: 'aprobado', comment: 'Verificado con el docente. Se autoriza el cambio de nota.' },
    ],
  },
  {
    id: 'REQ-2405',
    radicado: 'TRA-2025-0130',
    type: 'adicion_creditos',
    status: 'finalizado',
    priority: 'normal',
    createdAt: '2024-12-18T08:00:00',
    updatedAt: '2024-12-20T15:10:00',
    dueDate: '2024-12-27T23:59:00',
    studentCode: '1055432',
    studentCedula: '1011112233',
    studentName: 'Valentina Ríos Mejía',
    studentEmail: 'valentina.rios@estudiante.remington.edu.co',
    program: 'Psicología',
    semester: 'Semestre 5',
    subjects: [
      { code: 'PS-503', name: 'Psicología Clínica', credits: 3, group: 'B1' },
    ],
    reason: 'Adición de créditos autorizada para adelanto de plan de estudios.',
    attachments: [
      { id: 'a6', name: 'historial_academico.pdf', size: '260 KB', type: 'application/pdf' },
    ],
    currentStage: 'cierre',
    assignedTo: COORDINATOR_NAME,
    timeline: [
      { id: 't1', date: '2024-12-18T08:00:00', actor: 'Sistema Trámita', action: 'Solicitud radicada', toStatus: 'pendiente' },
      { id: 't2', date: '2024-12-18T13:20:00', actor: COORDINATOR_NAME, action: 'Inició revisión', fromStatus: 'pendiente', toStatus: 'en_revision' },
      { id: 't3', date: '2024-12-19T10:05:00', actor: COORDINATOR_NAME, action: 'Aprobó la solicitud', fromStatus: 'en_revision', toStatus: 'aprobado' },
      { id: 't4', date: '2024-12-20T15:10:00', actor: COORDINATOR_NAME, action: 'Finalizó el trámite', fromStatus: 'aprobado', toStatus: 'finalizado', comment: 'PDF generado y notificación enviada al estudiante.' },
    ],
  },
  {
    id: 'REQ-2406',
    radicado: 'TRA-2025-0144',
    type: 'novedad_notas',
    status: 'pendiente',
    priority: 'urgente',
    createdAt: '2025-01-08T07:40:00',
    updatedAt: '2025-01-08T07:40:00',
    dueDate: '2025-01-10T23:59:00',
    studentCode: '1099887',
    studentCedula: '1018889900',
    studentName: 'Daniel Estrada Correa',
    studentEmail: 'daniel.estrada@estudiante.remington.edu.co',
    program: 'Ingeniería de Sistemas',
    semester: 'Semestre 9',
    subjects: [
      {
        code: 'IS-901',
        name: 'Proyecto de Grado',
        credits: 6,
        group: 'A1',
        currentGrade: '3.4',
        proposedGrade: '4.2',
      },
    ],
    reason:
      'La sustentación fue calificada por el jurado pero la nota no se reflejó en el sistema. Adjunto acta del jurado.',
    attachments: [
      { id: 'a7', name: 'acta_jurado.pdf', size: '410 KB', type: 'application/pdf' },
    ],
    currentStage: 'radicacion',
    assignedTo: COORDINATOR_NAME,
    timeline: [
      { id: 't1', date: '2025-01-08T07:40:00', actor: 'Sistema Trámita', action: 'Solicitud radicada', toStatus: 'pendiente' },
    ],
  },
]
