import Link from 'next/link';

export default function ArchiveTabs({ label, items, activeHref }: {
  label: string;
  items: readonly { name: string; href: string; count: number }[];
  activeHref: string;
}) {
  return (
    <nav className="archive-tabs" aria-label={label}>
      <ul>{items.map((item) => <li key={item.href}>
        <Link href={item.href} scroll={false} aria-current={item.href === activeHref ? 'page' : undefined}
          aria-label={`${item.name} ${item.count}건`}>
          {item.name}<span aria-hidden="true">{item.count}</span>
        </Link>
      </li>)}</ul>
    </nav>
  );
}
