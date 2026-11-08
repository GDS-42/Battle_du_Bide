'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui';

const ITEMS = [
  { href: '/battles', label: 'Battles', icon: 'ring' as const },
  { href: '/pesee', label: 'Pesée', icon: 'scale' as const },
  { href: '/profil', label: 'Profil', icon: 'user' as const }
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-encre bg-violet pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-[520px] grid-cols-3">
        {ITEMS.map((it) => {
          const on = path === it.href || (it.href !== '/pesee' && path.startsWith(it.href + '/')) || (it.href === '/pesee' && path.startsWith('/pesee'));
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={on ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 font-display text-[13px] ${on ? 'text-soleil' : 'text-lilas'}`}>
                <Icon name={it.icon} size={24} />{it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
