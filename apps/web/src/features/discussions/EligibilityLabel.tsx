import { ShieldAlert, ShieldCheck } from 'lucide-react';

/** Colour is never the only signal: the label repeats the state in words. */
export function EligibilityLabel({ eligible }: { eligible: boolean }) {
  if (eligible) {
    return (
      <span className="inline-flex items-center gap-1 text-accent">
        <ShieldCheck size={13} aria-hidden="true" />
        Draft allowed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber">
      <ShieldAlert size={13} aria-hidden="true" />
      Draft blocked
    </span>
  );
}
