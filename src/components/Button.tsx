import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white shadow-[0_1px_2px_rgba(30,64,175,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300',
  secondary: 'bg-white text-ink border border-line shadow-soft hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  subtle: 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200/70',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink active:bg-slate-200/70',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 active:bg-red-100',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export function buttonClass({ variant = 'primary', size = 'md', block }: { variant?: Variant; size?: Size; block?: boolean } = {}) {
  return cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-all duration-150 ease-out',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, block, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonClass({ variant, size, block }), className)}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-150',
        'hover:bg-slate-100 hover:text-ink active:scale-95 active:bg-slate-200/70',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
