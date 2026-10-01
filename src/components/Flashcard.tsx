import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '../utils/cn';

interface Face {
  label: string;
  text: string;
  lang: string;
}

interface Props {
  front: Face;
  back: Face;
  flipped: boolean;
  onFlip: () => void;
  /** Skip the flip transition (e.g. when the front language changes). */
  instant?: boolean;
  /** Direction the card slides in from when it mounts. */
  enterFrom?: 'left' | 'right' | null;
}

function textSize(text: string): string {
  const len = text.length;
  if (len <= 14) return 'text-[34px] sm:text-[46px] leading-[1.15]';
  if (len <= 24) return 'text-[28px] sm:text-[38px] leading-[1.2]';
  if (len <= 48) return 'text-[22px] sm:text-[30px] leading-[1.3]';
  return 'text-lg sm:text-[22px] leading-[1.45]';
}

function CardFace({ face, side, hint }: { face: Face; side: 'front' | 'back'; hint: string }) {
  return (
    <div
      className={cn(
        'flip-face flex flex-col overflow-hidden rounded-[22px] border border-slate-200/90',
        side === 'front' ? 'bg-white' : 'back bg-[#FCFDFF]',
        'shadow-card',
      )}
    >
      {/* index-card header rule */}
      <div className="flex items-center justify-between px-6 pt-5 sm:px-8 sm:pt-6">
        <span className="eyebrow">{face.label}</span>
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            side === 'front' ? 'bg-blue-600' : 'bg-blue-300',
          )}
          aria-hidden
        />
      </div>
      <div className="mx-6 mt-4 h-px bg-gradient-to-r from-blue-200 via-blue-100 to-transparent sm:mx-8" aria-hidden />

      {side === 'back' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-14 top-[96px] sm:inset-x-8"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 39px, rgba(219,234,254,0.7) 39px, rgba(219,234,254,0.7) 40px)',
            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          }}
        />
      )}

      <div className="relative flex flex-1 items-center justify-center px-6 sm:px-12">
        <p
          lang={face.lang}
          className={cn(
            'max-w-full break-words text-center font-semibold tracking-[-0.02em] text-ink [text-wrap:balance]',
            textSize(face.text),
          )}
        >
          {face.text}
        </p>
      </div>

      <div className="relative flex items-center justify-center gap-1.5 pb-5 text-xs font-medium text-slate-400 sm:pb-6">
        <RotateCw size={13} aria-hidden />
        {hint}
      </div>
    </div>
  );
}

/**
 * A physical-feeling study card with a real 3D flip (rotateY + preserve-3d +
 * backface-visibility). The card is a button, so Enter / Space flip it.
 */
export function Flashcard({ front, back, flipped, onFlip, instant, enterFrom }: Props) {
  const [liftKey, setLiftKey] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!instant) setLiftKey((k) => k + 1);
  }, [flipped, instant]);

  const visible = flipped ? back : front;

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[640px]',
        enterFrom === 'right' && 'animate-card-in-right',
        enterFrom === 'left' && 'animate-card-in-left',
      )}
    >
      {/* Deck depth: stationary cards peeking out beneath */}
      <div aria-hidden className="absolute inset-x-6 -bottom-3 top-6 rounded-[22px] border border-slate-200/70 bg-white/70 shadow-soft" />
      <div aria-hidden className="absolute inset-x-3 -bottom-1.5 top-3 rounded-[22px] border border-slate-200/80 bg-white/90 shadow-soft" />

      <button
        type="button"
        onClick={onFlip}
        aria-label={`Flashcard, ${flipped ? 'back' : 'front'} side: ${visible.text}. Press to flip.`}
        className={cn(
          'group relative block h-[min(56vh,440px)] w-full cursor-pointer rounded-[22px] text-left sm:h-auto sm:aspect-[8/5]',
          'transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]',
          'focus-visible:outline-offset-4',
        )}
      >
        <div className={cn('flip-scene h-full w-full', liftKey > 0 && (liftKey % 2 ? 'animate-card-lift' : 'animate-card-lift-alt'))}>
          <div className={cn('flip-inner', flipped && 'is-flipped', instant && 'no-transition')}>
            <CardFace face={front} side="front" hint="Tap to flip" />
            <CardFace face={back} side="back" hint="Tap to flip back" />
          </div>
        </div>
      </button>
      <span className="sr-only" aria-live="polite">
        {flipped ? `${back.label}: ${back.text}` : ''}
      </span>
    </div>
  );
}
