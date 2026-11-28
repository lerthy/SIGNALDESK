import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StateMessageProps {
  Icon: LucideIcon;
  title: string;
  tone?: 'neutral' | 'error';
  children?: ReactNode;
}

/** One layout for idle, empty and error states so they all look finished. */
export function StateMessage({ Icon, title, tone = 'neutral', children }: StateMessageProps) {
  const iconColor = tone === 'error' ? 'text-danger' : 'text-muted';
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line px-6 py-10"
    >
      <Icon size={22} className={iconColor} aria-hidden="true" />
      <h2 className="text-base font-medium">{title}</h2>
      {children && <div className="max-w-prose text-sm leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
