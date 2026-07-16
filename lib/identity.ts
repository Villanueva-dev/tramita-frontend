// Identidad presentable derivada del email de sesión.
// El backend (GET /auth/me) solo entrega el email; acá lo formateamos para la UI
// sin inventar datos que el backend no provee.

function segments(email: string): string[] {
  const local = email.split('@')[0] ?? ''
  return local.split(/[._-]+/).filter(Boolean)
}

/** "ana.restrepo@remington.edu.co" -> "Ana Restrepo". Cae al email si no se puede derivar. */
export function displayNameFromEmail(email: string): string {
  const parts = segments(email)
  if (parts.length === 0) return email
  return parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

/** "ana.restrepo@..." -> "AR". Máximo dos iniciales. */
export function initialsFromEmail(email: string): string {
  const parts = segments(email)
  const initials = parts
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')
  return initials || email.charAt(0).toUpperCase()
}
