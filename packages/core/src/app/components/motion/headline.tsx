import type { CSSProperties, ReactNode } from 'react';
import { easeOut, phaseAt, progress } from '../../lib/motion';
import { MorphElement } from '../morph-element';

export type HeadlineProps = {
  t: number;
  at: readonly number[];
  titles: readonly ReactNode[];
  subs?: readonly ReactNode[];
  titleHeight: number;
  subHeight?: number;
  duration?: number;
  morphId?: string;
  style?: CSSProperties;
  titleStyle?: CSSProperties;
  subStyle?: CSSProperties;
};

export function Headline({
  t,
  at,
  titles,
  subs,
  titleHeight,
  subHeight = 48,
  duration = 0.8,
  morphId,
  style,
  titleStyle,
  subStyle,
}: HeadlineProps) {
  const phase = phaseAt(t, at);
  // The first title stands still: when a morph carries the box in from the previous
  // page, a roll here would lift the text out from under the clone as it lands.
  const k = phase === 0 ? 1 : easeOut(progress(t, at[phase], duration));
  const sk = phase === 0 ? 1 : easeOut(progress(t, at[phase] + 0.1, duration));
  const row = (content: ReactNode, offset: number, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${offset}%)`,
        opacity,
        whiteSpace: 'nowrap',
        ...titleStyle,
      }}
    >
      {content}
    </div>
  );
  const title = (
    <div style={{ position: 'relative', height: titleHeight, overflow: 'hidden' }}>
      {phase > 0 && k < 1 ? row(titles[phase - 1], -100 * k, 1 - k) : null}
      {row(titles[phase], 100 * (1 - k), k)}
    </div>
  );
  return (
    <div style={style}>
      {morphId ? <MorphElement id={morphId}>{title}</MorphElement> : title}
      {subs ? (
        <div style={{ position: 'relative', height: subHeight, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: sk,
              transform: `translateY(${(1 - sk) * 12}px)`,
              ...subStyle,
            }}
          >
            {subs[phase]}
          </div>
        </div>
      ) : null}
    </div>
  );
}
