import {
  along,
  CodeMove,
  CountUp,
  type DesignSystem,
  Headline,
  Mark,
  type Page,
  type Point,
  progress,
  ramp,
  type SlideMeta,
  Step,
  Steps,
  useTimeline,
} from '@open-slide/core';
import type { ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#f6f3ec', text: '#1d1b18', accent: '#d9480f' },
  fonts: {
    display: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
    body: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
  },
  typeScale: { hero: 160, body: 40 },
  radius: 14,
};

const muted = '#857f74';
const panel = '#fffdf8';
const rule = '#e3ddd0';
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

const eyebrow = {
  fontFamily: mono,
  fontSize: 26,
  letterSpacing: '0.18em',
  color: 'var(--osd-accent)',
} as const;

const heading = {
  fontFamily: 'var(--osd-font-display)',
  fontSize: 72,
  fontWeight: 800,
  lineHeight: 1.2,
  margin: 0,
} as const;

const CodePanel = ({ children, label }: { children: ReactNode; label: string }) => (
  <div
    style={{
      background: panel,
      border: `2px solid ${rule}`,
      borderRadius: 'var(--osd-radius)',
      padding: '36px 48px',
      boxShadow: '0 24px 60px -32px rgba(60, 40, 10, 0.35)',
    }}
  >
    <div style={{ fontFamily: mono, fontSize: 22, color: muted, marginBottom: 24 }}>{label}</div>
    {children}
  </div>
);

const Cover: Page = () => {
  const { t } = useTimeline([2.0]);
  const rise = ramp(t, 0.1, 0.8);
  return (
    <div
      style={{
        ...fill,
        padding: '0 160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ ...eyebrow, opacity: rise }}>OPEN-SLIDE · MOTION KIT</div>
      <h1
        style={{
          ...heading,
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 1.1,
          marginTop: 32,
          opacity: rise,
          transform: `translateY(${(1 - rise) * 32}px)`,
        }}
      >
        讓程式碼
        <Mark t={t} at={0.9} type="highlight" duration={0.5}>
          自己動
        </Mark>
        <br />
        讓重點
        <Mark t={t} at={1.4} type="underline" duration={0.5} width={7}>
          自己亮
        </Mark>
      </h1>
      <p style={{ fontSize: 40, color: muted, marginTop: 48, opacity: ramp(t, 0.5) }}>
        CodeMove · Mark · CountUp · Steps dim · along
      </p>
    </div>
  );
};

const REFACTOR = [
  `function getUser(id) {
  return fetch('/api/users/' + id)
    .then((res) => res.json());
}`,
  `async function getUser(id) {
  const res = await fetch('/api/users/' + id);
  return res.json();
}`,
  `const cache = new Map();

async function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const res = await fetch('/api/users/' + id);
  const user = await res.json();
  cache.set(id, user);
  return user;
}`,
  `const cache = new Map<string, User>();

async function getUser(id: string): Promise<User> {
  if (cache.has(id)) return cache.get(id)!;
  const res = await fetch(\`/api/users/\${id}\`);
  const user: User = await res.json();
  cache.set(id, user);
  return user;
}`,
] as const;

const REFACTOR_AT = [0, 1.8, 3.6, 5.4] as const;

const MagicMove: Page = () => {
  const { t } = useTimeline([1.0, 2.8, 4.6, 6.4]);
  const enter = ramp(t, 0, 0.6);
  return (
    <div style={{ ...fill, padding: '96px 120px' }}>
      <div style={eyebrow}>CODE MOVE · 程式碼變形</div>
      <Headline
        t={t}
        at={REFACTOR_AT}
        titleHeight={96}
        titles={['原本：Promise 鏈', '改成 async / await', '加一層快取', '補上型別']}
        subs={[
          '每按一次 →，程式碼變成下一版',
          '沒變的字原地不動，fetch 那段滑到新的位置',
          '新增的三行淡入，原本的行往下讓位',
          '型別插進來，字串換成 template literal',
        ]}
        style={{ marginTop: 20 }}
        titleStyle={{ ...heading }}
        subStyle={{ fontSize: 34, color: muted }}
      />
      <div
        style={{ marginTop: 48, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` }}
      >
        <CodePanel label="user.ts">
          <CodeMove
            t={t}
            at={REFACTOR_AT}
            steps={REFACTOR}
            highlight={[undefined, '1-3', '1,4,7', '1,3,5-6']}
            fontSize={34}
            style={{ height: `${9 * 1.5}em` }}
          />
        </CodePanel>
      </div>
    </div>
  );
};

const WALK_AT = [0, 1.4, 2.8, 4.2, 5.6] as const;

const LineByLine: Page = () => {
  const { t } = useTimeline([0.8, 2.2, 3.6, 5.0, 6.4]);
  const enter = ramp(t, 0, 0.6);
  return (
    <div style={{ ...fill, padding: '110px 120px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...eyebrow, opacity: enter }}>LINE HIGHLIGHT · 一行一行講</div>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1080px 1fr',
          gap: 80,
          alignItems: 'center',
        }}
      >
        <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` }}>
          <CodePanel label="user.ts">
            <CodeMove
              t={t}
              at={WALK_AT}
              steps={WALK_AT.map(() => REFACTOR[3])}
              highlight={[undefined, '1', '4', '5-6', '7-8']}
              fontSize={30}
              lineHeight={1.7}
            />
          </CodePanel>
        </div>
        <Headline
          t={t}
          at={WALK_AT}
          titleHeight={96}
          subHeight={160}
          titles={['整段先看一次', '快取放在模組層', '有就直接回', '沒有才打 API', '存起來再回']}
          subs={[
            '再按 → 一次只亮一段，其他行變暗',
            '同一個 id 不會重複打 API',
            'Map 查得到就不用等網路',
            'await 兩次：一次拿回應，一次解析 JSON',
            '下一次同一個 id 就會走第 4 行',
          ]}
          titleStyle={{ ...heading, fontSize: 64 }}
          subStyle={{ fontSize: 36, color: muted, whiteSpace: 'normal', lineHeight: 1.5 }}
        />
      </div>
    </div>
  );
};

const Bullet = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 40, fontSize: 52, fontWeight: 700 }}>
    <span style={{ fontFamily: mono, fontSize: 32, color: 'var(--osd-accent)' }}>{n}</span>
    {children}
  </div>
);

const DimPrevious: Page = () => (
  <div style={{ ...fill, padding: '140px 160px' }}>
    <div style={eyebrow}>STEPS DIM · 講到哪亮到哪</div>
    <h2 style={{ ...heading, marginTop: 24 }}>做動畫前先問三件事</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56, marginTop: 96 }}>
      <Steps dim>
        <Step duration={240}>
          <Bullet n="01">它讓觀眾看懂什麼？</Bullet>
        </Step>
        <Step duration={240}>
          <Bullet n="02">拿掉它，這頁還講得通嗎？</Bullet>
        </Step>
        <Step duration={240}>
          <Bullet n="03">講者講到這裡時，它剛好出現嗎？</Bullet>
        </Step>
      </Steps>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 160,
        bottom: 110,
        fontFamily: mono,
        fontSize: 28,
        color: muted,
      }}
    >
      {'<Steps dim> … </Steps>'}
    </div>
  </div>
);

const MARK_STOPS = [1.0, 2.0, 3.0, 4.0, 5.0] as const;
const markAt = (i: number) => MARK_STOPS[i] - 0.8;

const Marks: Page = () => {
  const { t } = useTimeline(MARK_STOPS);
  const line = { fontSize: 50, fontWeight: 700, lineHeight: 1.4, margin: 0 } as const;
  return (
    <div style={{ ...fill, padding: '120px 160px' }}>
      <div style={eyebrow}>MARK · 手繪標記</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 58, marginTop: 80 }}>
        <p style={line}>
          動畫是用來
          <Mark t={t} at={markAt(0)} type="underline">
            引導視線
          </Mark>
          ，不是裝飾。
        </p>
        <p style={line}>
          一頁只講
          <Mark t={t} at={markAt(1)} type="circle" style={{ margin: '0 12px' }}>
            一件事
          </Mark>
          。
        </p>
        <p style={line}>
          關鍵字可以
          <Mark t={t} at={markAt(2)} type="box" style={{ margin: '0 8px' }}>
            框起來
          </Mark>
          。
        </p>
        <p style={line}>
          數字用螢光筆：回應時間
          <Mark t={t} at={markAt(3)} type="highlight">
            182 ms
          </Mark>
          。
        </p>
        <p style={line}>
          <Mark t={t} at={markAt(4)} type="strike">
            每一頁都加動畫
          </Mark>
          <span style={{ color: muted, opacity: ramp(t, markAt(4) + 0.4) }}>　← 不要</span>
        </p>
      </div>
    </div>
  );
};

const ROUTE: readonly Point[] = [
  [1060, 760],
  [1260, 600],
  [1420, 680],
  [1560, 470],
  [1760, 380],
];

const routeD = ROUTE.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

const Stat = ({
  t,
  at,
  to,
  unit,
  label,
}: {
  t: number;
  at: number;
  to: number;
  unit: string;
  label: string;
}) => (
  <div style={{ opacity: ramp(t, at - 0.2, 0.4) }}>
    <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 1, color: 'var(--osd-accent)' }}>
      <CountUp t={t} at={at} to={to} />
      <span style={{ fontSize: 48, marginLeft: 8 }}>{unit}</span>
    </div>
    <div style={{ fontSize: 34, color: muted, marginTop: 16 }}>{label}</div>
  </div>
);

const Numbers: Page = () => {
  const { t } = useTimeline([2.0, 4.6]);
  const k = progress(t, 2.4, 1.8);
  const { point, angle } = along(ROUTE, k);
  return (
    <div style={{ ...fill, padding: '120px 160px' }}>
      <div style={eyebrow}>COUNTUP · ALONG</div>
      <h2 style={{ ...heading, marginTop: 24 }}>數字往上跳，箭頭沿路走</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 64, marginTop: 96 }}>
        <Stat t={t} at={0.3} to={182} unit="ms" label="平均回應時間" />
        <Stat t={t} at={0.7} to={99} unit="%" label="快取命中率" />
      </div>
      <svg
        aria-hidden="true"
        width={1920}
        height={1080}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
      >
        <path d={routeD} fill="none" stroke={rule} strokeWidth={6} strokeLinejoin="round" />
        <path
          d={routeD}
          fill="none"
          stroke="var(--osd-accent)"
          strokeWidth={6}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - k}
        />
        {ROUTE.map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={12}
            fill={panel}
            stroke={rule}
            strokeWidth={4}
          />
        ))}
        <g
          transform={`translate(${point[0]} ${point[1]}) rotate(${angle})`}
          opacity={ramp(t, 2.2, 0.3)}
        >
          <path d="M -22 -18 L 26 0 L -22 18 L -12 0 Z" fill="var(--osd-accent)" />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 1060,
          top: 840,
          fontFamily: mono,
          fontSize: 26,
          color: muted,
          opacity: ramp(t, 2.2),
        }}
      >
        {'const { point, angle } = along(route, k)'}
      </div>
    </div>
  );
};

export const meta: SlideMeta = {
  title: '程式碼動畫與重點標記',
  createdAt: '2026-11-05T09:00:00.000Z',
};

export const notes: (string | undefined)[] = [
  '進來時標題升起，「自己動」被螢光筆畫過，「自己亮」畫上底線。',
  `同一段程式碼改四版。每按一次 →，沒變的字留在原地，改到的字滑到新的位置，刪掉的淡出、新增的淡入。
沒在這一版改到的行會變暗，觀眾只會看有變的那幾行。`,
  `同一段程式碼不變，只換亮的那幾行。按 → 一段一段講：快取放哪、有就直接回、沒有才打 API、存起來再回。`,
  '按 → 一點一點出來，講到下一點時前一點會變暗。縮圖和匯出看到的是三點全亮。',
  '每按一次 → 畫一種標記：底線、圈起來、框起來、螢光筆、刪除線。',
  `進來時兩個數字往上跳。
按 →：路線畫出來，箭頭沿著路線走，轉彎時會跟著轉向。`,
];

export default [Cover, MagicMove, LineByLine, DimPrevious, Marks, Numbers] satisfies Page[];
