import { describe, expect, it } from 'vitest'
import { mockRequests } from './mock-requests'

describe('mock requests fixture hygiene', () => {
  it('uses role-based identities, synthetic identifiers, and example-domain email addresses', () => {
    expect(mockRequests).toHaveLength(6)
    for (const request of mockRequests) {
      expect(request.studentName).toMatch(/^Estudiante de prueba \d+$/)
      expect(request.studentCode).toMatch(/^TEST-STUDENT-\d+$/)
      expect(request.studentCedula).toMatch(/^TEST-DOCUMENT-\d+$/)
      expect(request.studentEmail).toMatch(/^student\d+@example\.com$/)
      expect(request.assignedTo).toBe('Coordinación de prueba')
    }
  })
})
