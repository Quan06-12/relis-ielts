// Temporary content for pages that are built in later sprints.
export default function PagePlaceholder({ title, issue }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p style={{ color: 'var(--text-muted)' }}>Trang này được làm trong {issue}.</p>
    </main>
  )
}
