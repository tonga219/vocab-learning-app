import { useId } from 'react';
import { cn } from '../utils/cn';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, className }: Props) {
  const id = useId();
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <label htmlFor={id} className="cursor-pointer select-none text-[13px] font-medium text-slate-600">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-blue-600' : 'bg-slate-300',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.25)] transition-transform duration-200 ease-[cubic-bezier(0.3,0.9,0.3,1)]',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function DefinitionToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <Toggle checked={checked} onChange={onChange} label="Show definitions" />;
}
