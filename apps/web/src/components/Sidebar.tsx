import { FileText, Info, LayoutDashboard, MessagesSquare } from 'lucide-react';

export type View = 'overview' | 'discussions' | 'drafts' | 'about';

const NAV_ITEMS = [
  { view: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { view: 'discussions', label: 'Discussions', Icon: MessagesSquare },
  { view: 'drafts', label: 'Drafts', Icon: FileText },
  { view: 'about', label: 'About', Icon: Info },
] as const;

interface SidebarProps {
  current: View;
  onNavigate: (view: View) => void;
}

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-8 lg:px-5 lg:py-6">
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect
              x="2"
              y="12"
              width="4"
              height="8"
              rx="1"
              fill="var(--color-accent)"
              opacity="0.5"
            />
            <rect
              x="9"
              y="6"
              width="4"
              height="14"
              rx="1"
              fill="var(--color-accent)"
              opacity="0.75"
            />
            <rect x="16" y="2" width="4" height="18" rx="1" fill="var(--color-accent)" />
          </svg>
          <span className="text-base font-semibold tracking-tight">SignalDesk</span>
        </div>

        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {NAV_ITEMS.map(({ view, label, Icon }) => (
              <li key={view}>
                <button
                  type="button"
                  onClick={() => onNavigate(view)}
                  aria-current={current === view ? 'page' : undefined}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink aria-[current=page]:bg-raised aria-[current=page]:text-ink"
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mt-auto hidden px-5 pb-6 text-xs leading-relaxed text-muted lg:block">
        Nothing is ever sent. Every reply is written, edited and reviewed by a person.
      </p>
    </aside>
  );
}
