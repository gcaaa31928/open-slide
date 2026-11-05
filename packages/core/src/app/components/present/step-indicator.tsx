import { usePanelMount } from '@/components/panel/panel-shell';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

const MAX_DOTS = 12;

type Props = {
  revealed: number;
  stepCount: number;
  playing: boolean;
};

export function PresentStepIndicator({ revealed, stepCount, playing }: Props) {
  const t = useLocale();
  const remaining = Math.max(0, stepCount - revealed);
  const { mounted, animVisible } = usePanelMount(stepCount > 0 && (remaining > 0 || playing));
  if (!mounted) return null;
  return (
    <div
      role="img"
      aria-label={format(plural(remaining, t.present.stepsRemaining), { count: remaining })}
      data-osd-step-indicator
      data-remaining={remaining}
      data-playing={playing}
      className={cn(
        'pointer-events-none absolute right-5 bottom-5 z-10 flex h-8 items-center gap-2 rounded-full bg-black/60 px-3.5 shadow-lg backdrop-blur-md motion-safe:transition-opacity',
        animVisible ? 'opacity-100 motion-safe:duration-200' : 'opacity-0 motion-safe:duration-200',
      )}
    >
      {stepCount > MAX_DOTS ? (
        <span className="text-[12px] text-white/85 tabular-nums">
          {revealed} / {stepCount}
        </span>
      ) : (
        Array.from({ length: stepCount }, (_, i) => (
          <StepDot
            // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional
            key={i}
            state={i < revealed ? (playing && i === revealed - 1 ? 'playing' : 'done') : 'pending'}
          />
        ))
      )}
    </div>
  );
}

function StepDot({ state }: { state: 'done' | 'playing' | 'pending' }) {
  return (
    <span
      className={cn(
        'size-2.5 rounded-full',
        state === 'done' && 'bg-white/85',
        state === 'playing' && 'bg-[var(--brand,#e5484d)] motion-safe:animate-pulse',
        state === 'pending' && 'ring-[1.5px] ring-white/60 ring-inset',
      )}
    />
  );
}
