import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stopLabel } from '@/lib/step-strip';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

type Props = {
  count: number;
  stops: readonly number[] | null;
  current: number;
  onionSkin: boolean;
  onSelect: (stop: number) => void;
  onToggleOnionSkin: () => void;
};

const blurAfterClick = (event: React.MouseEvent<HTMLButtonElement>) => event.currentTarget.blur();

export function StepStrip({
  count,
  stops,
  current,
  onionSkin,
  onSelect,
  onToggleOnionSkin,
}: Props) {
  const t = useLocale();
  const indices = Array.from({ length: count + 1 }, (_, i) => i);
  return (
    <div
      data-inspector-ui
      data-osd-step-strip
      className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2"
    >
      <div className="pointer-events-auto flex h-9 items-center gap-0.5 rounded-[8px] border border-border bg-popover/95 px-1 shadow-overlay backdrop-blur-md">
        <span className="px-1.5 text-[11.5px] text-muted-foreground">{t.stepStrip.label}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.stepStrip.prevAria}
          disabled={current <= 0}
          onClick={(event) => {
            blurAfterClick(event);
            onSelect(current - 1);
          }}
        >
          <ChevronLeft />
        </Button>
        {indices.map((i) => (
          <Button
            key={i}
            size="xs"
            variant="ghost"
            aria-label={`${t.stepStrip.stop} ${i}`}
            aria-pressed={i === current}
            className={cn(
              'min-w-7 tabular-nums',
              i === current && 'bg-accent text-accent-foreground',
            )}
            onClick={(event) => {
              blurAfterClick(event);
              onSelect(i);
            }}
          >
            {stopLabel(stops, i)}
          </Button>
        ))}
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.stepStrip.nextAria}
          disabled={current >= count}
          onClick={(event) => {
            blurAfterClick(event);
            onSelect(current + 1);
          }}
        >
          <ChevronRight />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.stepStrip.onionSkinAria}
          aria-pressed={onionSkin}
          className={cn(onionSkin && 'bg-accent text-accent-foreground')}
          onClick={(event) => {
            blurAfterClick(event);
            onToggleOnionSkin();
          }}
        >
          <Layers />
        </Button>
      </div>
    </div>
  );
}
