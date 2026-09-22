export default function ArchiveNotice({ title, children }: { title: string; children: string }) {
  return <aside className="archive-notice" aria-label={title}><strong>{title}</strong><p>{children}</p></aside>;
}
