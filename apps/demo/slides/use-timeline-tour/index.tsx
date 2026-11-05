import {
  Camera,
  Connector,
  Cursor,
  type DesignSystem,
  defocus,
  easeInOut,
  easeOut,
  Flight,
  keyframes,
  lerp,
  overshoot,
  Packet,
  type Page,
  type Point,
  progress,
  RollText,
  ramp,
  type SlideMeta,
  Step,
  Steps,
  TypedText,
  useTimeline,
  zoomDuration,
} from '@open-slide/core';
import type { ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0e1116', text: '#e8ecf1', accent: '#f5a524' },
  fonts: {
    display: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
    body: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
  },
  typeScale: { hero: 180, body: 40 },
  radius: 16,
};

const muted = '#7d8794';
const panel = '#161b22';
const line = '#2a313b';
const mono = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

const fill = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
} as const;

const heading = {
  fontFamily: 'var(--osd-font-display)',
  fontSize: 72,
  fontWeight: 800,
  lineHeight: 1.2,
  margin: 0,
} as const;

const eyebrow = {
  fontFamily: mono,
  fontSize: 26,
  letterSpacing: '0.18em',
  color: 'var(--osd-accent)',
} as const;

const Clock = ({
  t,
  stop,
  playing,
  stops,
}: {
  t: number;
  stop: number;
  playing: boolean;
  stops: readonly number[];
}) => {
  const end = stops[stops.length - 1];
  const width = 420;
  return (
    <div
      style={{
        position: 'absolute',
        right: 140,
        bottom: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        fontFamily: mono,
        fontSize: 26,
        color: muted,
      }}
    >
      <div style={{ position: 'relative', width, height: 24 }}>
        <div
          style={{ position: 'absolute', left: 0, right: 0, top: 11, height: 2, background: line }}
        />
        {stops.map((s) => (
          <div
            key={s}
            style={{
              position: 'absolute',
              left: (s / end) * width - 1,
              top: 4,
              width: 2,
              height: 16,
              background: t >= s ? 'var(--osd-accent)' : muted,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            width: 12,
            height: 12,
            borderRadius: 6,
            background: 'var(--osd-accent)',
            transform: `translateX(${(t / end) * width - 6}px)`,
          }}
        />
      </div>
      <span style={{ color: 'var(--osd-text)', minWidth: 150 }}>t = {t.toFixed(2)}s</span>
      <span>
        停點 {stop + 1} / {stops.length}
      </span>
      <span style={{ color: playing ? 'var(--osd-accent)' : muted, minWidth: 90 }}>
        {playing ? '播放中' : '停住'}
      </span>
    </div>
  );
};

const Cover: Page = () => {
  const { t } = useTimeline([1.6]);
  const track = easeInOut(progress(t, 0, 1.3));
  const title = easeOut(progress(t, 0.25, 0.8));
  const sub = easeOut(progress(t, 0.7, 0.8));
  return (
    <div style={fill}>
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 260,
          opacity: title,
          transform: `translateY(${(1 - title) * 32}px)`,
        }}
      >
        <div style={eyebrow}>OPEN-SLIDE · useTimeline</div>
        <h1
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 900,
            lineHeight: 1.1,
            margin: '36px 0 0',
          }}
        >
          頁內時間軸
        </h1>
      </div>
      <p
        style={{
          position: 'absolute',
          left: 160,
          top: 620,
          margin: 0,
          fontSize: 'var(--osd-size-body)',
          lineHeight: 1.6,
          color: muted,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 24}px)`,
        }}
      >
        按一下 →，頁面裡的東西就動到下一個停點。
      </p>
      <div
        style={{
          position: 'absolute',
          left: 160,
          right: 160,
          top: 840,
          height: 2,
          background: line,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 840,
          width: 1600,
          height: 2,
          background: 'var(--osd-accent)',
          transformOrigin: 'left',
          transform: `scaleX(${track})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 829,
          width: 24,
          height: 24,
          borderRadius: 12,
          background: 'var(--osd-accent)',
          transform: `translateX(${lerp(-12, 1588, track)}px)`,
        }}
      />
    </div>
  );
};

const IdeaCard = ({ tag, title, body }: { tag: string; title: string; body: string }) => (
  <div
    style={{
      width: 760,
      height: 420,
      boxSizing: 'border-box',
      padding: 56,
      background: panel,
      border: `2px solid ${line}`,
      borderRadius: 'var(--osd-radius)',
    }}
  >
    <div style={{ fontFamily: mono, fontSize: 32, color: 'var(--osd-accent)' }}>{tag}</div>
    <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.3, marginTop: 40 }}>{title}</div>
    <div style={{ fontSize: 34, lineHeight: 1.6, color: muted, marginTop: 28 }}>{body}</div>
  </div>
);

const TwoKinds: Page = () => (
  <div style={{ ...fill, padding: '140px 160px', boxSizing: 'border-box' }}>
    <div style={eyebrow}>兩種「按一下」</div>
    <h2 style={{ ...heading, marginTop: 24 }}>出現的順序，跟移動的過程</h2>
    <div style={{ display: 'flex', gap: 80, marginTop: 88 }}>
      <Steps>
        <Step duration={240}>
          <IdeaCard
            tag="<Steps>"
            title="東西依序出現"
            body="每按一次，多一塊內容淡入。適合條列、論點。"
          />
        </Step>
        <Step duration={240}>
          <IdeaCard
            tag="useTimeline()"
            title="東西在頁面裡移動"
            body="每按一次，畫面播到下一個停點。適合流程、動畫。"
          />
        </Step>
      </Steps>
    </div>
  </div>
);

const PIPELINE_STOPS = [1.2, 2.4, 3.6];

const StageBox = ({
  x,
  label,
  detail,
  lit,
}: {
  x: number;
  label: string;
  detail: string;
  lit: number;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 170,
      top: 440,
      width: 340,
      height: 240,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: panel,
      borderRadius: 'var(--osd-radius)',
      border: `3px solid ${lit > 0.5 ? 'var(--osd-accent)' : line}`,
      transform: `scale(${1 + 0.04 * Math.sin(lit * Math.PI)})`,
    }}
  >
    <div style={{ fontSize: 56, fontWeight: 800 }}>{label}</div>
    <div style={{ fontFamily: mono, fontSize: 28, color: 'var(--osd-accent)', opacity: lit }}>
      {detail}
    </div>
  </div>
);

const Pipeline: Page = () => {
  const { t, stop, playing } = useTimeline(PIPELINE_STOPS);
  const title = easeOut(progress(t, 0, 0.6));
  const legs = [
    easeInOut(progress(t, 0.2, 0.9)),
    easeInOut(progress(t, 1.3, 0.9)),
    easeInOut(progress(t, 2.5, 0.9)),
  ];
  const x = 120 + 300 * legs[0] + 540 * legs[1] + 540 * legs[2];
  return (
    <div style={fill}>
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 140,
          opacity: title,
          transform: `translateY(${(1 - title) * 24}px)`,
        }}
      >
        <div style={eyebrow}>DEMO 1 · 移動</div>
        <h2 style={{ ...heading, marginTop: 24 }}>一次部署走過三站</h2>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 759,
          width: 1380,
          height: 2,
          background: line,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 758,
          width: 1380,
          height: 4,
          background: 'var(--osd-accent)',
          transformOrigin: 'left',
          transform: `scaleX(${(x - 120) / 1380})`,
        }}
      />
      <StageBox x={420} label="建置" detail="12s" lit={progress(t, 1.0, 0.25)} />
      <StageBox x={960} label="測試" detail="214 項過" lit={progress(t, 2.1, 0.25)} />
      <StageBox x={1500} label="上線" detail="v2.4.0" lit={progress(t, 3.3, 0.25)} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 742,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'var(--osd-accent)',
          boxShadow: '0 0 32px rgba(245, 165, 36, 0.6)',
          transform: `translateX(${x - 18}px)`,
        }}
      />
      <Clock t={t} stop={stop} playing={playing} stops={PIPELINE_STOPS} />
    </div>
  );
};

const CODE_STOPS = [1.5, 3.2, 4.5];

const kw = '#9cc0ff';
const str = '#b9d9a8';

const CodeRow = ({ n, children }: { n: number; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 40, height: 68, alignItems: 'center' }}>
    <span style={{ color: muted, width: 32, textAlign: 'right' }}>{n}</span>
    {children}
  </div>
);

const Typing: Page = () => {
  const { t, stop, playing } = useTimeline(CODE_STOPS);
  return (
    <div style={{ ...fill, padding: '140px 160px', boxSizing: 'border-box' }}>
      <div style={eyebrow}>DEMO 2 · 打字</div>
      <h2 style={{ ...heading, marginTop: 24 }}>程式碼自己打出來</h2>
      <div
        style={{
          marginTop: 72,
          padding: '48px 56px',
          background: panel,
          border: `2px solid ${line}`,
          borderRadius: 'var(--osd-radius)',
          fontFamily: mono,
          fontSize: 38,
        }}
      >
        <CodeRow n={1}>
          <TypedText
            t={t}
            at={0.1}
            text={[['const', kw], [' { t } = useTimeline(['], ['1.2, 3, 5', str], [']);']]}
          />
        </CodeRow>
        <CodeRow n={2}>
          <TypedText
            t={t}
            at={1.6}
            text={[['const', kw], [' card = ramp(t, '], ['1.2', str], [');']]}
          />
        </CodeRow>
        <CodeRow n={3}>
          <TypedText
            t={t}
            at={3.3}
            text={[['<Card', kw], [' style={{ opacity: card }} '], ['/>', kw]]}
          />
        </CodeRow>
      </div>
      <Clock t={t} stop={stop} playing={playing} stops={CODE_STOPS} />
    </div>
  );
};

const BAR_STOPS = [1.0, 2.0, 3.0];

const Bar = ({
  x,
  label,
  value,
  max,
  k,
}: {
  x: number;
  label: string;
  value: number;
  max: number;
  k: number;
}) => {
  const h = (value / max) * 460;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 860 - h - 72,
          width: 240,
          textAlign: 'center',
          fontFamily: mono,
          fontSize: 48,
          fontWeight: 700,
          opacity: k > 0 ? 1 : 0,
        }}
      >
        {Math.round(value * k)}
      </div>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 860 - h,
          width: 240,
          height: h,
          background: 'var(--osd-accent)',
          borderRadius: '8px 8px 0 0',
          transformOrigin: 'bottom',
          transform: `scaleY(${k})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 884,
          width: 240,
          textAlign: 'center',
          fontSize: 32,
          color: muted,
        }}
      >
        {label}
      </div>
    </>
  );
};

const Bars: Page = () => {
  const { t, stop, playing } = useTimeline(BAR_STOPS);
  return (
    <div style={fill}>
      <div style={{ position: 'absolute', left: 160, top: 140 }}>
        <div style={eyebrow}>DEMO 3 · 數字</div>
        <h2 style={{ ...heading, marginTop: 24 }}>每按一次，長出一根</h2>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 160,
          right: 160,
          top: 860,
          height: 2,
          background: line,
        }}
      />
      <Bar x={340} label="2024 每月部署" value={12} max={58} k={easeOut(progress(t, 0.1, 0.8))} />
      <Bar x={840} label="2025 每月部署" value={31} max={58} k={easeOut(progress(t, 1.1, 0.8))} />
      <Bar x={1340} label="2026 每月部署" value={58} max={58} k={easeOut(progress(t, 2.1, 0.8))} />
      <Clock t={t} stop={stop} playing={playing} stops={BAR_STOPS} />
    </div>
  );
};

const ok = '#4cc9a0';
const warn = '#ff6b5b';

const Wire = ({ from, to, draw, hot }: { from: Point; to: Point; draw: number; hot: number }) => (
  <>
    <Connector from={from} to={to} k={draw} color={line} markers={false} />
    <Connector from={from} to={to} k={hot} width={4} markers={false} />
  </>
);

const ArchNode = ({
  at,
  width = 260,
  label,
  note,
  appear,
  lit,
  tone = 'var(--osd-accent)',
}: {
  at: Point;
  width?: number;
  label: string;
  note?: string;
  appear: number;
  lit: number;
  tone?: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: at[0] - width / 2,
      top: at[1] - 65,
      width,
      height: 130,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      background: panel,
      borderRadius: 'var(--osd-radius)',
      border: `3px solid ${lit > 0.5 ? tone : line}`,
      boxShadow: lit > 0.5 ? `0 0 36px -8px ${tone}` : 'none',
      opacity: appear,
      transform: `scale(${lerp(0.85, 1, easeOut(appear)) + 0.05 * Math.sin(lit * Math.PI)})`,
    }}
  >
    <div style={{ fontSize: 34, fontWeight: 800 }}>{label}</div>
    {note ? (
      <div style={{ fontFamily: mono, fontSize: 24, color: tone, opacity: lit, height: 30 }}>
        {note}
      </div>
    ) : null}
  </div>
);

const ARCH_STOPS = [1.8, 3.2, 4.6, 6.0];

const CLIENT: Point = [250, 620];
const CDN: Point = [580, 620];
const GATEWAY: Point = [910, 620];
const AUTH: Point = [1250, 420];
const ORDERS: Point = [1250, 620];
const SEARCH: Point = [1250, 820];
const CACHE: Point = [1620, 500];
const DB: Point = [1620, 740];

const Architecture: Page = () => {
  const { t, stop, playing } = useTimeline(ARCH_STOPS);
  const col = (i: number) => easeOut(progress(t, 0.1 + i * 0.18, 0.5));
  const edge = (i: number) => easeInOut(progress(t, 0.5 + i * 0.12, 0.6));
  return (
    <div style={fill}>
      <div style={{ position: 'absolute', left: 160, top: 120 }}>
        <div style={eyebrow}>DEMO 4 · 架構圖</div>
        <h2 style={{ ...heading, marginTop: 24 }}>一個請求走過整套系統</h2>
      </div>
      <Wire from={CLIENT} to={CDN} draw={edge(0)} hot={progress(t, 1.9, 0.4)} />
      <Wire from={CDN} to={GATEWAY} draw={edge(1)} hot={progress(t, 2.3, 0.4)} />
      <Wire from={GATEWAY} to={AUTH} draw={edge(2)} hot={progress(t, 2.7, 0.3)} />
      <Wire from={GATEWAY} to={ORDERS} draw={edge(2)} hot={progress(t, 3.5, 0.2)} />
      <Wire from={GATEWAY} to={SEARCH} draw={edge(2)} hot={0} />
      <Wire from={ORDERS} to={CACHE} draw={edge(3)} hot={progress(t, 3.75, 0.3)} />
      <Wire from={ORDERS} to={DB} draw={edge(3)} hot={progress(t, 4.2, 0.2)} />
      <ArchNode
        at={CLIENT}
        width={220}
        label="使用者"
        note="182 ms"
        appear={col(0)}
        lit={progress(t, 5.65, 0.25)}
        tone={ok}
      />
      <ArchNode
        at={CDN}
        width={220}
        label="CDN"
        note="沒有快取"
        appear={col(1)}
        lit={progress(t, 2.25, 0.25)}
      />
      <ArchNode
        at={GATEWAY}
        width={240}
        label="API 閘道"
        note="轉送"
        appear={col(2)}
        lit={progress(t, 2.65, 0.25)}
      />
      <ArchNode
        at={AUTH}
        label="認證服務"
        note="token 有效"
        appear={col(3)}
        lit={progress(t, 2.95, 0.2)}
      />
      <ArchNode
        at={ORDERS}
        label="訂單服務"
        note="組回應"
        appear={col(3)}
        lit={progress(t, 3.65, 0.25)}
      />
      <ArchNode at={SEARCH} label="搜尋服務" appear={col(3)} lit={0} />
      <ArchNode
        at={CACHE}
        width={240}
        label="快取"
        note="MISS"
        appear={col(4)}
        lit={progress(t, 4.0, 0.25)}
        tone={warn}
      />
      <ArchNode
        at={DB}
        width={240}
        label="資料庫"
        note="查詢 38 ms"
        appear={col(4)}
        lit={progress(t, 4.35, 0.2)}
      />
      <Packet t={t} at={1.9} duration={0.4} from={CLIENT} to={CDN} />
      <Packet t={t} at={2.3} duration={0.4} from={CDN} to={GATEWAY} />
      <Packet t={t} at={2.7} duration={0.3} from={GATEWAY} to={AUTH} label="token?" />
      <Packet t={t} at={3.3} duration={0.2} from={AUTH} to={GATEWAY} />
      <Packet t={t} at={3.5} duration={0.2} from={GATEWAY} to={ORDERS} />
      <Packet t={t} at={3.75} duration={0.3} from={ORDERS} to={CACHE} />
      <Packet t={t} at={4.05} duration={0.15} from={CACHE} to={ORDERS} />
      <Packet t={t} at={4.2} duration={0.2} from={ORDERS} to={DB} label="SELECT" />
      <Packet t={t} at={4.7} duration={0.25} from={DB} to={ORDERS} color={ok} />
      <Packet t={t} at={4.95} duration={0.25} from={ORDERS} to={GATEWAY} color={ok} />
      <Packet t={t} at={5.2} duration={0.25} from={GATEWAY} to={CDN} color={ok} />
      <Packet t={t} at={5.45} duration={0.25} from={CDN} to={CLIENT} color={ok} label="200 OK" />
      <Clock t={t} stop={stop} playing={playing} stops={ARCH_STOPS} />
    </div>
  );
};

const HOOD_STOPS = [1.4, 2.6, 4.0];

const KEY: Point = [260, 560];
const PLAYER: Point = [595, 560];
const HOST: Point = [930, 560];
const TIMELINE: Point = [1265, 560];
const PAGE: Point = [1600, 560];
const PILL: Point = [595, 790];

const EdgeLabel = ({ at, text, k }: { at: Point; text: string; k: number }) => (
  <div
    style={{
      position: 'absolute',
      left: at[0] - 160,
      top: at[1],
      width: 320,
      textAlign: 'center',
      fontFamily: mono,
      fontSize: 24,
      color: 'var(--osd-accent)',
      opacity: k,
      transform: `translateY(${(1 - k) * 10}px)`,
    }}
  >
    {text}
  </div>
);

const IndicatorMock = ({ t, appear }: { t: number; appear: number }) => {
  const second = progress(t, 2.2, 0.1);
  const playingNow = t >= 2.75 && t < 3.9;
  const dot = (filled: number, pulse: boolean) => ({
    width: 22,
    height: 22,
    borderRadius: 11,
    boxSizing: 'border-box' as const,
    border: `3px solid ${filled > 0 ? (pulse ? 'var(--osd-accent)' : 'var(--osd-text)') : muted}`,
    background: filled > 0 ? (pulse ? 'var(--osd-accent)' : 'var(--osd-text)') : 'transparent',
    transform: `scale(${pulse ? 1 + 0.18 * Math.abs(Math.sin(t * 6)) : 1})`,
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: PILL[0] - 110,
        top: PILL[1] - 32,
        width: 220,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        borderRadius: 32,
        background: '#000',
        border: `2px solid ${line}`,
        opacity: appear,
      }}
    >
      <span style={dot(1, false)} />
      <span style={dot(second, playingNow)} />
      <span style={dot(0, false)} />
    </div>
  );
};

const UnderTheHood: Page = () => {
  const { t, stop, playing } = useTimeline(HOOD_STOPS);
  const col = (i: number) => easeOut(progress(t, 0.1 + i * 0.15, 0.5));
  const edge = (i: number) => easeInOut(progress(t, 0.5 + i * 0.12, 0.5));
  const press = Math.sin(progress(t, 1.5, 0.25) * Math.PI);
  const run = progress(t, 2.75, 1.15);
  const tShown = lerp(1.2, 3.0, run);
  return (
    <div style={fill}>
      <div style={{ position: 'absolute', left: 160, top: 120 }}>
        <div style={eyebrow}>DEMO 5 · 框架裡面</div>
        <h2 style={{ ...heading, marginTop: 24 }}>按下 → 之後發生什麼</h2>
      </div>
      <Wire from={KEY} to={PLAYER} draw={edge(0)} hot={progress(t, 1.6, 0.25)} />
      <Wire from={PLAYER} to={HOST} draw={edge(1)} hot={progress(t, 1.85, 0.25)} />
      <Wire from={HOST} to={TIMELINE} draw={edge(2)} hot={progress(t, 2.1, 0.25)} />
      <Wire from={TIMELINE} to={PAGE} draw={edge(3)} hot={progress(t, 2.75, 1.15)} />
      <Wire from={PLAYER} to={PILL} draw={edge(1)} hot={0} />
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        <path
          d={`M ${TIMELINE[0]} ${TIMELINE[1] + 65} L ${TIMELINE[0]} ${PILL[1]} L ${PILL[0] + 110} ${PILL[1]}`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - easeInOut(progress(t, 2.6, 0.5))}
          stroke={ok}
          strokeWidth={3}
          fill="none"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: KEY[0] - 70,
          top: KEY[1] - 70,
          width: 140,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 72,
          fontWeight: 800,
          background: panel,
          borderRadius: 24,
          border: `3px solid ${press > 0.1 ? 'var(--osd-accent)' : line}`,
          borderBottomWidth: 12 - 8 * press,
          opacity: col(0),
          transform: `translateY(${press * 8}px)`,
        }}
      >
        →
      </div>
      <ArchNode
        at={PLAYER}
        width={250}
        label="Player"
        note="收到按鍵"
        appear={col(1)}
        lit={progress(t, 1.75, 0.2)}
      />
      <ArchNode
        at={HOST}
        width={250}
        label="StepHost"
        note="advance()"
        appear={col(2)}
        lit={progress(t, 2.0, 0.2)}
      />
      <ArchNode
        at={TIMELINE}
        width={250}
        label="useTimeline"
        note={`t = ${tShown.toFixed(2)}`}
        appear={col(3)}
        lit={progress(t, 2.25, 0.2)}
      />
      <ArchNode
        at={PAGE}
        width={250}
        label="頁面樣式"
        note={run >= 1 ? '停在 3.00s' : '每一幀重畫'}
        appear={col(4)}
        lit={progress(t, 2.75, 0.2)}
      />
      <EdgeLabel at={[(HOST[0] + TIMELINE[0]) / 2, 420]} text="停點 +1" k={progress(t, 2.1, 0.3)} />
      <EdgeLabel
        at={[(TIMELINE[0] + PAGE[0]) / 2, 420]}
        text="t 從 1.2 播到 3.0"
        k={progress(t, 2.75, 0.3)}
      />
      <EdgeLabel at={[985, 740]} text="回報：播放中" k={progress(t, 2.9, 0.3)} />
      <IndicatorMock t={t} appear={col(1)} />
      <div
        style={{
          position: 'absolute',
          left: PILL[0] + 150,
          top: PILL[1] + 40,
          fontSize: 30,
          lineHeight: 1.5,
          color: muted,
          opacity: easeOut(progress(t, 2.9, 0.5)),
        }}
      >
        正在播的那一段會閃，播完就停；全部播完小框框就收起來。
      </div>
      <Clock t={t} stop={stop} playing={playing} stops={HOOD_STOPS} />
    </div>
  );
};

const CAM_STOPS = [1.4, 3.4, 5.6, 7.2];
const CAM_ANCHOR: Point = [960, 680];
const TOGGLE: Point = [858, 540];

const Toggle = ({ at, on }: { at: Point; on: number }) => (
  <div
    style={{
      position: 'absolute',
      left: at[0] - 36,
      top: at[1] - 20,
      width: 72,
      height: 40,
      borderRadius: 20,
      background: on > 0.5 ? 'var(--osd-accent)' : line,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 4,
        top: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        background: 'var(--osd-text)',
        transform: `translateX(${lerp(0, 32, on)}px)`,
      }}
    />
  </div>
);

const ServiceRow = ({ y, name, on }: { y: number; name: string; on: number }) => (
  <>
    <div style={{ position: 'absolute', left: 420, top: y - 24, fontSize: 34, fontWeight: 600 }}>
      {name}
    </div>
    <Toggle at={[858, y]} on={on} />
  </>
);

const LogLine = ({ y, children }: { y: number; children: ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      left: 990,
      top: y - 18,
      fontFamily: mono,
      fontSize: 24,
      color: muted,
      whiteSpace: 'pre',
    }}
  >
    {children}
  </div>
);

const CameraPage: Page = () => {
  const { t, stop, playing } = useTimeline(CAM_STOPS);
  const win = ramp(t, 0.2, 0.7);
  const zoom = zoomDuration(1, 2);
  const cam = keyframes(t, [
    [0, { x: CAM_ANCHOR[0], y: CAM_ANCHOR[1], scale: 1 }],
    [3.6, { x: CAM_ANCHOR[0], y: CAM_ANCHOR[1], scale: 1 }],
    [3.6 + zoom, { x: 1240, y: 560, scale: 2 }],
    [5.8, { x: 1240, y: 560, scale: 2 }],
    [5.8 + zoom, { x: CAM_ANCHOR[0], y: CAM_ANCHOR[1], scale: 1 }],
  ]);
  const toggled = overshoot(progress(t, 2.55, 0.35));
  const focusLog = ramp(t, 3.6, zoom) * (1 - ramp(t, 5.8, zoom));
  return (
    <div style={fill}>
      <Camera {...cam} anchor={CAM_ANCHOR}>
        <div
          style={{
            position: 'absolute',
            left: 360,
            top: 350,
            width: 1200,
            height: 580,
            background: panel,
            border: `2px solid ${line}`,
            borderRadius: 'var(--osd-radius)',
            opacity: win,
            transform: `translateY(${(1 - win) * 30}px)`,
          }}
        >
          <div
            style={{
              height: 56,
              borderBottom: `2px solid ${line}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingLeft: 24,
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 7, background: warn }} />
            <span style={{ width: 14, height: 14, borderRadius: 7, background: '#f5a524' }} />
            <span style={{ width: 14, height: 14, borderRadius: 7, background: ok }} />
            <span style={{ marginLeft: 20, fontFamily: mono, fontSize: 22, color: muted }}>
              服務設定（示意）
            </span>
          </div>
        </div>
        <div style={{ opacity: win }}>
          <div style={defocus(focusLog)}>
            <ServiceRow y={460} name="認證服務" on={1} />
            <ServiceRow y={TOGGLE[1]} name="訂單服務" on={toggled} />
            <ServiceRow y={620} name="搜尋服務" on={0} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 420,
              width: 570,
              height: 480,
              background: '#0a0d11',
              borderRadius: 12,
            }}
          />
          <LogLine y={460}>09:41:02 認證服務 ok</LogLine>
          <LogLine y={505}>09:41:05 搜尋服務 停用</LogLine>
          <LogLine y={550}>
            <span style={{ color: ok }}>
              <TypedText t={t} at={4.4} text="09:41:12 訂單服務 已啟動 · 3 個副本" cps={24} />
            </span>
          </LogLine>
        </div>
        <Cursor
          t={t}
          path={[
            [1.5, 1500, 1000],
            [2.4, TOGGLE[0] + 6, TOGGLE[1] + 4],
          ]}
          clicks={[2.5]}
          visible={progress(t, 1.5, 0.2) * (1 - progress(t, 3.45, 0.25))}
        />
      </Camera>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 300,
          background: 'var(--osd-bg)',
        }}
      />
      <div style={{ position: 'absolute', left: 160, top: 120 }}>
        <div style={eyebrow}>DEMO 6 · 鏡頭與游標</div>
        <RollText
          t={t}
          at={[0, 1.4, 3.4, 5.6]}
          height={92}
          lines={['一個設定畫面', '游標點下去，開關打開', '鏡頭推近看紀錄', '拉回來看全貌']}
          style={{ ...heading, marginTop: 24, width: 1600 }}
        />
      </div>
      <Clock t={t} stop={stop} playing={playing} stops={CAM_STOPS} />
    </div>
  );
};

const BUILD_STOPS = [2.0, 3.9, 6.0];
const CODE_LEFT = 200;
const LINE_Y = [450, 520, 590];

const flightType = { fontFamily: mono, fontSize: 30, color: '#e6edf3' } as const;

const Built = ({ at, k, children }: { at: Point; k: number; children: ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      left: at[0],
      top: at[1],
      transform: `translate(${(1 - k) * 24}px, -50%)`,
      opacity: k,
    }}
  >
    {children}
  </div>
);

const CodeToScreen: Page = () => {
  const { t, stop, playing } = useTimeline(BUILD_STOPS);
  const titleAt: Point = [1120, 450];
  const badgeAt: Point = [1120, 590];
  const buttonAt: Point = [1120, 740];
  return (
    <div style={fill}>
      <div style={{ position: 'absolute', left: 160, top: 120 }}>
        <div style={eyebrow}>DEMO 7 · 程式碼 → 畫面</div>
        <h2 style={{ ...heading, marginTop: 24 }}>每打一行，它就飛到右邊變成畫面</h2>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 360,
          width: 760,
          height: 300,
          background: panel,
          border: `2px solid ${line}`,
          borderRadius: 'var(--osd-radius)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CODE_LEFT,
          top: LINE_Y[0] - 22,
          fontFamily: mono,
          fontSize: 30,
        }}
      >
        <TypedText
          t={t}
          at={0.2}
          text={[
            ['<Title>', kw],
            ['部署狀態', str],
            ['</Title>', kw],
          ]}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: CODE_LEFT,
          top: LINE_Y[1] - 22,
          fontFamily: mono,
          fontSize: 30,
        }}
      >
        <TypedText
          t={t}
          at={2.1}
          text={[
            ['<Badge>', kw],
            ['3 個副本', str],
            ['</Badge>', kw],
          ]}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: CODE_LEFT,
          top: LINE_Y[2] - 22,
          fontFamily: mono,
          fontSize: 30,
        }}
      >
        <TypedText
          t={t}
          at={4.0}
          text={[
            ['<Button>', kw],
            ['重新部署', str],
            ['</Button>', kw],
          ]}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1080,
          top: 360,
          width: 680,
          height: 480,
          border: `2px dashed ${line}`,
          borderRadius: 'var(--osd-radius)',
        }}
      />
      <Built at={[titleAt[0] + 30, titleAt[1]]} k={ramp(t, 1.5, 0.3)}>
        <div style={{ fontSize: 56, fontWeight: 800 }}>部署狀態</div>
      </Built>
      <Built at={[badgeAt[0] + 30, badgeAt[1]]} k={ramp(t, 3.3, 0.3)}>
        <div
          style={{
            padding: '8px 24px',
            borderRadius: 999,
            background: 'rgba(76, 201, 160, 0.15)',
            color: ok,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          ● 3 個副本
        </div>
      </Built>
      <Built at={[buttonAt[0] + 30, buttonAt[1]]} k={ramp(t, 5.35, 0.3)}>
        <div
          style={{
            padding: '16px 40px',
            borderRadius: 12,
            background: 'var(--osd-accent)',
            color: '#0e1116',
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          重新部署
        </div>
      </Built>
      <Flight
        t={t}
        at={0.8}
        duration={1.0}
        from={[CODE_LEFT, LINE_Y[0] - 22]}
        to={[titleAt[0] + 30, titleAt[1] - 20]}
        text="<Title>部署狀態</Title>"
        toText="部署狀態"
        style={flightType}
      />
      <Flight
        t={t}
        at={2.7}
        duration={0.9}
        from={[CODE_LEFT, LINE_Y[1] - 22]}
        to={[badgeAt[0] + 30, badgeAt[1] - 20]}
        text="<Badge>3 個副本</Badge>"
        toText="● 3 個副本"
        style={flightType}
      />
      <Flight
        t={t}
        at={4.75}
        duration={0.9}
        from={[CODE_LEFT, LINE_Y[2] - 22]}
        to={[buttonAt[0] + 30, buttonAt[1] - 20]}
        text="<Button>重新部署</Button>"
        toText="重新部署"
        style={flightType}
      />
      <Clock t={t} stop={stop} playing={playing} stops={BUILD_STOPS} />
    </div>
  );
};

const Row = ({ where, value }: { where: string; value: string }) => (
  <div
    style={{
      display: 'flex',
      height: 80,
      alignItems: 'center',
      borderBottom: `2px solid ${line}`,
      fontSize: 34,
    }}
  >
    <span style={{ width: 760 }}>{where}</span>
    <span style={{ color: 'var(--osd-accent)' }}>{value}</span>
  </div>
);

const WhereItLands: Page = () => (
  <div style={{ ...fill, padding: '120px 160px', boxSizing: 'border-box' }}>
    <div style={eyebrow}>不同地方看到的 t</div>
    <h2 style={{ ...heading, marginTop: 24 }}>只有簡報模式往前翻才會播</h2>
    <div style={{ marginTop: 56 }}>
      <Row where="簡報模式，往前翻進來" value="從 0 播到第一個停點" />
      <Row where="再按 →" value="播到下一個停點" />
      <Row where="還在播的時候按 →" value="先跳到這段的終點，再播下一段" />
      <Row where="按 ←" value="直接退回上一個停點" />
      <Row where="往回翻、跳頁進來" value="直接在最後一個停點" />
      <Row where="縮圖、編輯畫面、匯出 PDF" value="最後一個停點" />
      <Row where="預覽 ?step=n、講者畫面" value="第 n 個停點" />
      <Row where="系統開了「減少動態效果」" value="每個停點直接跳到，不播" />
    </div>
  </div>
);

const Rule = ({ n, text }: { n: string; text: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 48 }}>
    <span style={{ fontFamily: mono, fontSize: 40, color: 'var(--osd-accent)' }}>{n}</span>
    <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.3 }}>{text}</span>
  </div>
);

const Rules: Page = () => (
  <div style={{ ...fill, padding: '140px 160px', boxSizing: 'border-box' }}>
    <div style={eyebrow}>寫的時候記得</div>
    <h2 style={{ ...heading, marginTop: 24 }}>三條規則</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56, marginTop: 88 }}>
      <Rule n="01" text="一頁只呼叫一次 useTimeline" />
      <Rule n="02" text="同一頁不要再放 <Steps>" />
      <Rule n="03" text="最後一個停點要是一頁完整的投影片" />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 160,
        bottom: 120,
        fontFamily: mono,
        fontSize: 30,
        color: muted,
      }}
    >
      import {'{ useTimeline }'} from '@open-slide/core';
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: '頁內時間軸 useTimeline',
  createdAt: '2026-11-05T00:19:56.520Z',
};

export const notes: (string | undefined)[] = [
  '進入這頁時，底下那條線會從左畫到右，標題跟著浮上來。這頁只有一個停點，再按 → 就換頁。',
  '這頁用的是原本的 <Steps>：按 → 兩張卡片依序淡入，用來對照時間軸。',
  `進來時封包先走到「建置」。
按 → 走到「測試」，再按 → 走到「上線」。
右下角是時鐘：目前的 t、第幾個停點、是不是還在播。`,
  '三行程式碼，每按一次 → 打出下一行。按 ← 會直接退回上一行，不會倒著刪字。',
  '三根長條依序長出來，上面的數字跟著往上數。',
  `進來時整張架構圖先長出來：節點一欄一欄出現，連線畫出來。
按 →：請求從使用者經過 CDN、API 閘道，先到認證服務驗 token。
再按 →：轉到訂單服務，快取 MISS，改查資料庫。
再按 →：回應沿原路回到使用者，總共 182 ms。`,
  `這頁講框架裡面的流程。
按 →：Player 收到按鍵，交給 StepHost，StepHost 把這頁的停點加一。
再按 →：useTimeline 把 t 從 1.2 播到 3.0，同時回報「播放中」給 Player，Player 下面那個小框框就讓正在播的那一格閃。`,
  `鏡頭、游標、翻牌標題都是框架內建的元件（Camera、Cursor、RollText）。
按 →：游標移到「訂單服務」的開關點下去，開關打開。
再按 →：鏡頭推近右邊的紀錄，新的一行打出來。
再按 →：鏡頭拉回全貌。畫面上的設定視窗是示意。`,
  `左邊每打完一行程式碼，那一行就飛到右邊，落地變成它產生的元素（TypedText、Flight）。
按 → 一次打一行。`,
  '只有簡報模式往前翻進來才會播；縮圖、匯出、跳頁進來都直接是最後一個停點，所以最後一個停點一定要是完整的畫面。',
  undefined,
];

export default [
  Cover,
  TwoKinds,
  Pipeline,
  Typing,
  Bars,
  Architecture,
  UnderTheHood,
  CameraPage,
  CodeToScreen,
  WhereItLands,
  Rules,
] satisfies Page[];
