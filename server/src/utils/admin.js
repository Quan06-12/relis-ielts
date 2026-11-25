// Who is an admin. Admins are listed by email in the ADMIN_EMAILS environment variable
// (comma separated), so the role is granted and taken away on Render without touching the database.
// A guest is never an admin, even if the list were misconfigured.

export function adminEmails(value = process.env.ADMIN_EMAILS) {
  return new Set(
    String(value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isAdminUser(user, emails = adminEmails()) {
  return Boolean(user && !user.isGuest && user.email && emails.has(String(user.email).toLowerCase()))
}
