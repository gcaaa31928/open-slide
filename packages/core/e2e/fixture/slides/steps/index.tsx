import { type Page, type SlideMeta, Step, Steps, useTimeline } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Steps Deck',
  createdAt: '2026-01-02T00:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#0d1117',
  color: '#e6edf3',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const One: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Steps page one</h1>
  </div>
);

const Two: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Steps page two</h1>
    <Steps dim>
      <Step>
        <p style={{ fontSize: 40 }}>Step item first</p>
      </Step>
      <Step>
        <p style={{ fontSize: 40 }}>Step item second</p>
      </Step>
    </Steps>
  </div>
);

const Three: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Steps page three</h1>
  </div>
);

const Four: Page = () => {
  const { t, stop, playing } = useTimeline([1, 2, 3]);
  return (
    <div style={fill}>
      <h1 style={{ fontSize: 96, margin: 0 }}>Timeline page four</h1>
      <p
        data-testid="timeline-state"
        data-t={t.toFixed(2)}
        data-stop={stop}
        data-playing={playing}
        style={{ fontSize: 40, opacity: Math.min(1, t / 3) }}
      >
        Timeline at {t.toFixed(2)}s
      </p>
    </div>
  );
};

export default [One, Two, Three, Four] satisfies Page[];
