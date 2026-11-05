import {
  Camera,
  Connector,
  Cursor,
  type DesignSystem,
  defocus,
  easeInOut,
  easeOut,
  Flight,
  Headline,
  keyframes,
  lerp,
  overshoot,
  Packet,
  type Page,
  type Point,
  phaseAt,
  progress,
  pulse,
  RollText,
  ramp,
  type SlideMeta,
  type SlideTransition,
  TypedText,
  useTimeline,
  zoomDuration,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#f5f4f0', text: '#18181b', accent: '#e5484d' },
  fonts: {
    display: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
    body: '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
  },
  typeScale: { hero: 150, body: 34 },
  radius: 18,
};

const C = {
  ink: '#18181b',
  sub: '#6b6b73',
  faint: '#c4c0b6',
  line: '#dcd8cf',
  card: '#ffffff',
  accent: '#e5484d',
  code: '#1e1f24',
  codeText: '#e6e6e9',
  codeDim: '#8b8d98',
} as const;

const mono = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace';

type LayerKey = 'author' | 'server' | 'browser' | 'output';
type Layer = { name: string; deep: string; soft: string; line: string };
const LAYER: Record<LayerKey, Layer> = {
  author: { name: '作者端', deep: '#9a5c06', soft: '#fbefd9', line: '#e3a33b' },
  server: { name: 'dev server', deep: '#2559b8', soft: '#e2ebfb', line: '#5b8ee8' },
  browser: { name: '瀏覽器', deep: '#17734c', soft: '#dcf1e6', line: '#3fae7c' },
  output: { name: '輸出', deep: '#6640b8', soft: '#ece4fb', line: '#9a76e6' },
};
const LAYER_ORDER: LayerKey[] = ['author', 'server', 'browser', 'output'];

const fill: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

const DOTS: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `radial-gradient(circle, ${C.line} 1.6px, transparent 1.8px)`,
  backgroundSize: '40px 40px',
  backgroundPosition: '20px 20px',
};

// Every chapter page shares one title box and one cut, so the title holds still across
// the page change and then rolls to the new page's line.
const TITLE_ID = 'arch-title';
const CUT: SlideTransition = {
  duration: 280,
  exit: {
    duration: 308,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    keyframes: [{ opacity: 1 }, { opacity: 1 }],
  },
  enter: {
    duration: 308,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  morph: { duration: 868, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const Stage = ({ children, chapter }: { children: ReactNode; chapter?: string }) => (
  <div style={fill}>
    <div style={DOTS} />
    {children}
    {chapter ? (
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 104,
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: '0.08em',
          color: C.sub,
        }}
      >
        {chapter}
      </div>
    ) : null}
  </div>
);

// Painted after a <Camera>, so whatever the camera pushes in slides under the title.
const TitleBand = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1920,
      height: 270,
      background: 'linear-gradient(var(--osd-bg) 82%, transparent)',
    }}
  />
);

const Title = ({
  t,
  at,
  titles,
  subs,
}: {
  t: number;
  at: number[];
  titles: string[];
  subs: string[];
}) => (
  <Headline
    t={t}
    at={at}
    titles={titles}
    subs={subs}
    titleHeight={112}
    subHeight={48}
    morphId={TITLE_ID}
    style={{ position: 'absolute', left: 120, top: 72, width: 1380 }}
    titleStyle={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: 84,
      fontWeight: 800,
      lineHeight: '112px',
      letterSpacing: '-0.01em',
      color: C.ink,
    }}
    subStyle={{ fontSize: 30, lineHeight: '48px', fontWeight: 500, color: C.sub }}
  />
);

const Mock = ({ x, y }: { x: number; y: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      padding: '2px 12px',
      borderRadius: 999,
      background: '#ecebe6',
      fontSize: 20,
      color: C.sub,
    }}
  >
    示意
  </div>
);

const glow = (layer: Layer, lit: number): CSSProperties => ({
  borderColor: `color-mix(in srgb, ${layer.line} ${Math.round(Math.min(1, lit) * 100)}%, ${C.line})`,
  boxShadow: `0 0 0 ${8 * lit}px color-mix(in srgb, ${layer.soft} ${Math.round(Math.min(1, lit) * 100)}%, transparent), 0 10px 30px rgba(24, 24, 27, 0.06)`,
});

// Follows a polyline at constant speed; u in 0…1.
function along(points: readonly Point[], u: number): Point {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] === 0 ? 1 : Math.min(1, left / lengths[i]);
      return [lerp(points[i][0], points[i + 1][0], k), lerp(points[i][1], points[i + 1][1], k)];
    }
    left -= lengths[i];
  }
  return points[points.length - 1];
}

const polyD = (points: readonly Point[]) =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

const PolyWire = ({
  points,
  k,
  color,
  dashed,
}: {
  points: readonly Point[];
  k: number;
  color: string;
  dashed?: boolean;
}) =>
  k <= 0 ? null : (
    <svg
      aria-hidden="true"
      width={1920}
      height={1080}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <path
        d={polyD(points)}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeDasharray={dashed ? undefined : '1 1'}
        strokeDashoffset={dashed ? undefined : 1 - k}
        opacity={dashed ? k : 1}
        style={dashed ? { strokeDasharray: '6 10' } : undefined}
      />
    </svg>
  );

const PolyPacket = ({
  t,
  at,
  duration,
  points,
  color = C.accent,
  label,
}: {
  t: number;
  at: number;
  duration: number;
  points: readonly Point[];
  color?: string;
  label?: string;
}) => {
  if (t < at || t >= at + duration) return null;
  const [x, y] = along(points, easeInOut(progress(t, at, duration)));
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - 11,
          top: y - 11,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 22%, transparent)`,
        }}
      />
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: x + 20,
            top: y - 46,
            padding: '0 8px',
            fontFamily: mono,
            fontSize: 22,
            color,
            background: 'var(--osd-bg)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};

/* ---------------------------------------------------------------- the map */

type CardId =
  | 'you'
  | 'file'
  | 'skills'
  | 'cli'
  | 'plugin'
  | 'vmod'
  | 'presenter'
  | 'player'
  | 'editor'
  | 'pdf'
  | 'html'
  | 'pptx';

const ZONE = { x0: 92, w: 392, gap: 56, y: 300, h: 620, pad: 24 };
const CARD = { w: 344, h: 120, rows: [400, 570, 740] };
const zoneX = (i: number) => ZONE.x0 + i * (ZONE.w + ZONE.gap);

const CARDS: Record<CardId, { layer: LayerKey; row: number; title: string; detail: string }> = {
  you: { layer: 'author', row: 0, title: '你，或 agent', detail: 'Claude Code · Codex' },
  file: { layer: 'author', row: 1, title: '一份 slide', detail: 'slides/<id>/index.tsx' },
  skills: { layer: 'author', row: 2, title: '寫法說明', detail: 'slide-authoring 等 skill' },
  cli: { layer: 'server', row: 0, title: 'open-slide dev', detail: 'CLI，把 Vite 帶起來' },
  plugin: { layer: 'server', row: 1, title: 'open-slide 外掛', detail: 'handleHotUpdate' },
  vmod: { layer: 'server', row: 2, title: '虛擬模組', detail: 'virtual:open-slide/slides' },
  presenter: { layer: 'browser', row: 0, title: '講者視窗', detail: '/s/:slideId/presenter' },
  player: { layer: 'browser', row: 1, title: 'Player + StepHost', detail: 'useTimeline，一按一拍' },
  editor: { layer: 'browser', row: 2, title: '編輯畫面', detail: '/s/:slideId' },
  pdf: { layer: 'output', row: 0, title: 'PDF', detail: '交給瀏覽器列印' },
  html: { layer: 'output', row: 1, title: 'HTML', detail: '一個 .html 帶走' },
  pptx: { layer: 'output', row: 2, title: 'PPTX', detail: '逐頁量版面，帶講稿' },
};

const cardBox = (id: CardId) => {
  const c = CARDS[id];
  return { x: zoneX(LAYER_ORDER.indexOf(c.layer)) + ZONE.pad, y: CARD.rows[c.row] };
};

type Side = 'l' | 'r' | 't' | 'b';
const pin = (id: CardId, side: Side, dy = 0): Point => {
  const { x, y } = cardBox(id);
  if (side === 'l') return [x, y + CARD.h / 2 + dy];
  if (side === 'r') return [x + CARD.w, y + CARD.h / 2 + dy];
  if (side === 't') return [x + CARD.w / 2, y];
  return [x + CARD.w / 2, y + CARD.h];
};

type WireId =
  | 'youFile'
  | 'cliPlugin'
  | 'filePlugin'
  | 'pluginVmod'
  | 'vmodEditor'
  | 'editorPlayer'
  | 'playerPresenter'
  | 'editorPdf'
  | 'editorHtml'
  | 'editorPptx';

const WIRES: Record<WireId, [Point, Point]> = {
  youFile: [pin('you', 'b'), pin('file', 't')],
  cliPlugin: [pin('cli', 'b'), pin('plugin', 't')],
  filePlugin: [pin('file', 'r', -20), pin('plugin', 'l', -20)],
  pluginVmod: [pin('plugin', 'b'), pin('vmod', 't')],
  vmodEditor: [pin('vmod', 'r'), pin('editor', 'l')],
  editorPlayer: [pin('editor', 't'), pin('player', 'b')],
  playerPresenter: [pin('player', 't'), pin('presenter', 'b')],
  editorPdf: [pin('editor', 'r', -24), pin('pdf', 'l')],
  editorHtml: [pin('editor', 'r', 0), pin('html', 'l')],
  editorPptx: [pin('editor', 'r', 24), pin('pptx', 'l')],
};

// The edit that goes back to the source: under the zones, up the gap, into the file.
const BACK: Point[] = [
  pin('editor', 'b'),
  [pin('editor', 'b')[0], 960],
  [512, 960],
  [512, pin('file', 'r', 30)[1]],
  pin('file', 'r', 30),
];

const SAVE_PATH: { wire: WireId; card: CardId }[] = [
  { wire: 'filePlugin', card: 'plugin' },
  { wire: 'pluginVmod', card: 'vmod' },
  { wire: 'vmodEditor', card: 'editor' },
  { wire: 'editorPlayer', card: 'player' },
];

type WorldState = {
  zone: (layer: LayerKey) => number;
  card: (id: CardId) => { k: number; lit: number };
  wire: (id: WireId) => number;
  back: number;
};

const WorldCard = ({ id, k, lit }: { id: CardId; k: number; lit: number }) => {
  const c = CARDS[id];
  const layer = LAYER[c.layer];
  const { x, y } = cardBox(id);
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: CARD.w,
        height: CARD.h,
        boxSizing: 'border-box',
        padding: '20px 24px',
        background: C.card,
        borderRadius: 16,
        border: `2px solid ${C.line}`,
        opacity: k,
        transform: `translateY(${(1 - k) * 18}px)`,
        ...glow(layer, lit),
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: '40px', whiteSpace: 'nowrap' }}>
        {c.title}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 19,
          lineHeight: '30px',
          color: layer.deep,
          whiteSpace: 'nowrap',
        }}
      >
        {c.detail}
      </div>
    </div>
  );
};

const ArchWorld = ({ s, children }: { s: WorldState; children?: ReactNode }) => (
  <>
    {LAYER_ORDER.map((key, i) => {
      const k = s.zone(key);
      if (k <= 0) return null;
      const layer = LAYER[key];
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            left: zoneX(i),
            top: ZONE.y,
            width: ZONE.w,
            height: ZONE.h,
            borderRadius: 28,
            background: `color-mix(in srgb, ${layer.soft} 70%, transparent)`,
            opacity: k,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: ZONE.pad,
              top: 26,
              padding: '4px 16px',
              borderRadius: 999,
              background: layer.soft,
              color: layer.deep,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {layer.name}
          </div>
        </div>
      );
    })}
    {(Object.keys(WIRES) as WireId[]).map((id) => (
      <Connector
        key={id}
        from={WIRES[id][0]}
        to={WIRES[id][1]}
        k={s.wire(id)}
        color={C.faint}
        width={3}
      />
    ))}
    <PolyWire points={BACK} k={s.back} color={LAYER.author.line} />
    {s.back > 0.98 ? (
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 938,
          padding: '0 10px',
          fontFamily: mono,
          fontSize: 22,
          color: LAYER.author.deep,
          background: 'var(--osd-bg)',
        }}
      >
        POST /__edit
      </div>
    ) : null}
    {(Object.keys(CARDS) as CardId[]).map((id) => (
      <WorldCard key={id} id={id} {...s.card(id)} />
    ))}
    {children}
  </>
);

/* ---------------------------------------------------------------- 01 cover */

const COVER_STOPS = [2.8];

const Cover: Page = () => {
  const { t } = useTimeline(COVER_STOPS);
  const word = 'open-slide';
  const trackK = easeInOut(progress(t, 0.9, 1.1));
  return (
    <Stage>
      <div style={{ position: 'absolute', left: 160, top: 250 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 28,
            letterSpacing: '0.2em',
            color: C.accent,
            opacity: ramp(t, 0.1, 0.5),
          }}
        >
          ARCHITECTURE TOUR
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            height: 170,
            overflow: 'hidden',
          }}
        >
          {[...word].map((ch, i) => {
            const k = ramp(t, 0.15 + i * 0.05, 0.7, easeOut);
            return (
              <span
                key={`${ch}-${i}`}
                style={{
                  display: 'inline-block',
                  transform: `translateY(${(1 - k) * 100}%)`,
                  opacity: k,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 48,
            fontWeight: 700,
            opacity: ramp(t, 0.8, 0.6),
            transform: `translateY(${(1 - ramp(t, 0.8, 0.6)) * 16}px)`,
          }}
        >
          一份 slide，從寫下去到上台的整條路
        </div>
      </div>
      <svg
        aria-hidden="true"
        width={1920}
        height={1080}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <line
          x1={160}
          y1={800}
          x2={160 + 1600 * trackK}
          y2={800}
          stroke={C.faint}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>
      {LAYER_ORDER.map((key, i) => {
        const at = 1.2 + i * 0.28;
        const pop = overshoot(progress(t, at, 0.5));
        const layer = LAYER[key];
        const x = 160 + i * 520;
        return (
          <div key={key}>
            <div
              style={{
                position: 'absolute',
                left: x - 18,
                top: 782,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: layer.line,
                boxShadow: `0 0 0 8px ${layer.soft}`,
                transform: `scale(${pop})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: x - 18,
                top: 846,
                fontSize: 32,
                fontWeight: 700,
                color: layer.deep,
                opacity: ramp(t, at + 0.15, 0.4),
              }}
            >
              {layer.name}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 960,
          fontSize: 24,
          color: C.sub,
          opacity: ramp(t, 2.2, 0.5),
        }}
      >
        每一頁都用 useTimeline 播，按 → 往下走
      </div>
    </Stage>
  );
};

/* ---------------------------------------------------------------- 02 the whole map */

const MAP_STOPS = [3.2, 6.6, 9.4, 11.8];
const MAP_TITLES = [
  '一份簡報，從一個檔案開始',
  '存檔之後，一路傳到瀏覽器',
  '在畫面上改，也寫得回原始碼',
  '最後交出三種檔案',
];
const MAP_SUBS = [
  '左邊寫、中間編譯、右邊播：open-slide 就這四塊。',
  '外掛認出這份 slide 改了，通知瀏覽器只重載它。',
  '在畫面上點一下就能改，改動寫回原本的 index.tsx。',
  '匯出時，每一頁都停在最後一個停點。',
];
const MAP_AT = [0, 3.3, 6.7, 9.5];

const HOP = 0.6;
const saveHops = (start: number) => SAVE_PATH.map((h, i) => ({ ...h, at: start + i * HOP }));

const MapPage: Page = () => {
  const { t } = useTimeline(MAP_STOPS);
  const pull = 0.9;
  const cam = keyframes(t, [
    [0, { x: 264, y: 630, scale: 2.2 }],
    [pull, { x: 264, y: 630, scale: 2.2 }],
    [pull + zoomDuration(2.2, 1) * 1.6, { x: 960, y: 650, scale: 1 }],
  ]);
  const hops = saveHops(3.5);
  const exportAt = [10.0, 10.15, 10.3];
  const s: WorldState = {
    zone: (key) => {
      const i = LAYER_ORDER.indexOf(key);
      const k = ramp(t, 1.2 + i * 0.15, 0.6);
      return key === 'output' ? k * (0.35 + 0.65 * ramp(t, 9.6, 0.5)) : k;
    },
    card: (id) => {
      const c = CARDS[id];
      const i = LAYER_ORDER.indexOf(c.layer);
      const k = id === 'file' ? 1 : ramp(t, 1.35 + i * 0.15 + c.row * 0.06, 0.5);
      const hop = hops.find((h) => h.card === id);
      let lit = hop ? pulse(t, hop.at + HOP * 0.9, 0.15, 0.4, 0.5) : 0;
      if (id === 'file') lit = Math.max(lit, pulse(t, 8.55, 0.15, 0.5, 0.5));
      if (c.layer === 'output') {
        lit = pulse(t, exportAt[c.row] + 0.7, 0.15, 0.6, 0.5);
      }
      return { k, lit };
    },
    wire: (id) => {
      if (id === 'editorPdf' || id === 'editorHtml' || id === 'editorPptx') {
        const i = ['editorPdf', 'editorHtml', 'editorPptx'].indexOf(id);
        return easeInOut(progress(t, 9.6 + i * 0.15, 0.5));
      }
      const order: WireId[] = [
        'youFile',
        'filePlugin',
        'cliPlugin',
        'pluginVmod',
        'vmodEditor',
        'editorPlayer',
        'playerPresenter',
      ];
      return easeInOut(progress(t, 2.0 + order.indexOf(id) * 0.12, 0.5));
    },
    back: easeInOut(progress(t, 6.9, 0.8)),
  };
  return (
    <Stage chapter="00 · 全景">
      <Camera {...cam} anchor={[960, 650]}>
        <ArchWorld s={s}>
          {hops.map((h) => (
            <Packet
              key={h.wire}
              t={t}
              at={h.at}
              duration={HOP}
              from={WIRES[h.wire][0]}
              to={WIRES[h.wire][1]}
            />
          ))}
          <PolyPacket t={t} at={7.7} duration={0.9} points={BACK} color={LAYER.author.line} />
          {exportAt.map((at, i) => {
            const id = (['editorPdf', 'editorHtml', 'editorPptx'] as const)[i];
            return (
              <Packet
                key={id}
                t={t}
                at={at}
                duration={0.7}
                from={WIRES[id][0]}
                to={WIRES[id][1]}
                color={LAYER.output.line}
              />
            );
          })}
        </ArchWorld>
      </Camera>
      <TitleBand />
      <Title t={t} at={MAP_AT} titles={MAP_TITLES} subs={MAP_SUBS} />
    </Stage>
  );
};
MapPage.transition = CUT;

/* ---------------------------------------------------------------- 03 an agent writes a page */

const KW = '#ff7b72';
const STR = '#a5d6ff';
const FN = '#d2a8ff';
const TX = C.codeText;

type Seg = readonly [string, string?];
const CODE_LINES: Seg[][] = [
  [
    ['import', KW],
    [' { Headline, useTimeline } ', TX],
    ['from', KW],
    [" '@open-slide/core'", STR],
    [';', TX],
  ],
  [],
  [
    ['const', KW],
    [' Hmr', FN],
    [': Page = () => {', TX],
  ],
  [
    ['  const', KW],
    [' { t } = ', TX],
    ['useTimeline', FN],
    ['([2, 5]);', TX],
  ],
  [
    ['  return', KW],
    [' (', TX],
  ],
  [['    <Stage>', TX]],
  [
    ['      <', TX],
    ['Headline', FN],
    [' t={t} at={[0, 2]} titles={TITLES} />', TX],
  ],
  [['    </Stage>', TX]],
  [['  );', TX]],
  [['};', TX]],
  [],
  [
    ['export default', KW],
    [' [Hmr] ', TX],
    ['satisfies', KW],
    [' Page[];', TX],
  ],
];
const CODE_CPS = 90;
const CODE_START = 3.4;
const codeAt = (() => {
  let at = CODE_START;
  return CODE_LINES.map((segs) => {
    const start = at;
    const n = segs.reduce((sum, [s]) => sum + [...s].length, 0);
    at += n / CODE_CPS + 0.06;
    return start;
  });
})();

const ED = { x: 860, y: 290, w: 940, h: 640, top: 104, lh: 42, gutter: 64 };
const CHAT = { x: 120, y: 290, w: 680, h: 640 };

type ChatLine = { at: number; kind: 'you' | 'tool' | 'say'; text: string };
const CHAT_LINES: ChatLine[] = [
  { at: 0.6, kind: 'you', text: '幫我做一頁講 HMR 的投影片，要有動畫' },
  { at: 1.4, kind: 'tool', text: 'Read(slide-authoring/SKILL.md)' },
  { at: 1.9, kind: 'tool', text: 'Read(references/timeline.md)' },
  { at: 2.5, kind: 'tool', text: 'Write(slides/hmr/index.tsx)' },
  { at: 7.8, kind: 'say', text: '寫好了，dev server 會自己更新畫面。' },
];
const WRITE_LINE = 3;
const chatY = (i: number) => CHAT.y + 104 + i * 64;

const ChatPanel = ({ t, beat }: { t: number; beat: number }) => (
  <div
    style={{
      position: 'absolute',
      left: CHAT.x,
      top: CHAT.y,
      width: CHAT.w,
      height: CHAT.h,
      boxSizing: 'border-box',
      background: C.card,
      border: `2px solid ${C.line}`,
      borderRadius: 20,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 72,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 28px',
        borderBottom: `1px solid ${C.line}`,
        fontSize: 24,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#d97757' }} />
      Claude Code
    </div>
    {CHAT_LINES.map((line, i) => {
      const k = ramp(t, line.at, 0.35);
      if (k <= 0) return null;
      const isBeat = i === WRITE_LINE;
      return (
        <div
          key={line.text}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: chatY(i) - CHAT.y - 8,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 12px',
            borderRadius: 12,
            background:
              line.kind === 'you'
                ? '#eef3f9'
                : isBeat
                  ? `rgba(229, 72, 77, ${0.1 * beat})`
                  : 'transparent',
            opacity: k,
            transform: `translateY(${(1 - k) * 14}px)`,
            fontSize: line.kind === 'tool' ? 22 : 24,
            fontFamily: line.kind === 'tool' ? mono : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              color: line.kind === 'you' ? '#3b6fb6' : line.kind === 'tool' ? '#3fae7c' : '#d97757',
            }}
          >
            {line.kind === 'you' ? '>' : '●'}
          </span>
          {line.kind === 'you' ? (
            <TypedText t={t} at={line.at} text={line.text} cps={40} />
          ) : (
            line.text
          )}
        </div>
      );
    })}
  </div>
);

const Editor = ({ t, saved }: { t: number; saved: number }) => (
  <div
    style={{
      position: 'absolute',
      left: ED.x,
      top: ED.y,
      width: ED.w,
      height: ED.h,
      boxSizing: 'border-box',
      background: C.code,
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: mono,
      fontSize: 22,
      color: TX,
    }}
  >
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 28px',
        background: '#26272d',
      }}
    >
      <span style={{ color: C.codeDim }}>slides/hmr/</span>
      <span>index.tsx</span>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: saved > 0.5 ? '#3fae7c' : '#e3a33b',
          transform: `scale(${1 + 0.6 * pulse(t, 8.0, 0.15, 0.3, 0.4)})`,
        }}
      />
      <span style={{ marginLeft: 'auto', color: '#3fae7c', opacity: saved }}>已存檔</span>
    </div>
    {CODE_LINES.map((segs, i) => (
      <div
        key={`line-${i}`}
        style={{
          position: 'absolute',
          left: 0,
          top: ED.top + i * ED.lh,
          height: ED.lh,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            width: ED.gutter,
            textAlign: 'right',
            color: '#55575f',
            opacity: t >= codeAt[i] ? 1 : 0.35,
          }}
        >
          {i + 1}
        </span>
        <span style={{ marginLeft: 28, whiteSpace: 'pre' }}>
          {segs.length > 0 ? <TypedText t={t} at={codeAt[i]} text={segs} cps={CODE_CPS} /> : null}
        </span>
      </div>
    ))}
  </div>
);

const WRITE_STOPS = [2.9, 7.4, 9.9];
const WRITE_AT = [0, 0.4, 3.0, 7.6];
const WRITE_TITLES = [
  MAP_TITLES[3],
  '叫 agent 做一頁',
  'agent 照 skill 寫出 index.tsx',
  '存檔，接著交給 dev server',
];
const WRITE_SUBS = [
  MAP_SUBS[3],
  '在 Claude Code 或 Codex 裡講一句話就好。',
  '先讀 slide-authoring，再把一頁寫成一個 React 元件。',
  'slides/<id>/index.tsx 一寫進去，dev server 就收到了。',
];
const SHIP: Point = [1500, 1000];

const WritePage: Page = () => {
  const { t } = useTimeline(WRITE_STOPS);
  const beat = pulse(t, 2.5, 0.3, 0.9, 0.6);
  const saved = ramp(t, 8.0, 0.3);
  const landed = ramp(t, 9.3, 0.3);
  return (
    <Stage chapter="01 · 寫">
      <ChatPanel t={t} beat={beat} />
      <Mock x={CHAT.x + CHAT.w - 96} y={CHAT.y + 20} />
      <Editor t={t} saved={saved} />
      <Connector
        from={[CHAT.x + CHAT.w - 24, chatY(WRITE_LINE) + 20]}
        to={[ED.x + 24, ED.y + ED.top + 20]}
        k={easeInOut(progress(t, 3.0, 0.4))}
        fade={1 - progress(t, 7.4, 0.4)}
        color={C.accent}
      />
      <Flight
        t={t}
        at={8.3}
        duration={1.0}
        from={[ED.x + 28, ED.y + 18]}
        to={[SHIP[0] + 24, SHIP[1] - 18]}
        text="slides/hmr/index.tsx"
        toText="→ dev server"
        color={LAYER.server.line}
        style={{ fontFamily: mono, fontSize: 24, color: C.ink, lineHeight: '36px' }}
      />
      {landed > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: SHIP[0],
            top: SHIP[1] - 30,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderRadius: 999,
            background: LAYER.server.soft,
            color: LAYER.server.deep,
            fontFamily: mono,
            fontSize: 24,
            opacity: landed,
            boxShadow: `0 0 0 ${10 * pulse(t, 9.3, 0.15, 0.3, 0.5)}px ${LAYER.server.soft}`,
          }}
        >
          → dev server
        </div>
      ) : null}
      <Title t={t} at={WRITE_AT} titles={WRITE_TITLES} subs={WRITE_SUBS} />
    </Stage>
  );
};
WritePage.transition = CUT;

/* ---------------------------------------------------------------- 04 one save, end to end */

const TRACK_Y = 650;
const HOT = { x0: 120, step: 600, w: 460, h: 168 };
type HotCard = { title: string; detail: string; layer: LayerKey };
const HOT_CARDS: HotCard[] = [
  { title: '存檔', detail: 'slides/hmr/index.tsx', layer: 'author' },
  { title: 'Vite 監看檔案', detail: 'watcher.add(slides/)', layer: 'server' },
  { title: 'open-slide 外掛', detail: 'handleHotUpdate', layer: 'server' },
  { title: '通知瀏覽器', detail: 'open-slide:slide-changed', layer: 'server' },
  { title: 'useSlideModule', detail: '只認自己的 slideId', layer: 'browser' },
  { title: '重新載入', detail: 'loadSlide(id) · ?t=', layer: 'browser' },
  { title: '畫面更新', detail: '新版本畫上去', layer: 'browser' },
];
const hotX = (i: number) => HOT.x0 + i * HOT.step;
const hotCx = (i: number) => hotX(i) + HOT.w / 2;
const HOT_HOPS = [1.4, 2.6, 5.2, 7.8, 8.6, 9.4];
const HOT_DUR = 0.7;
const hotArrive = (i: number) => (i === 0 ? 1.2 : HOT_HOPS[i - 1] + HOT_DUR);

const HOT_STOPS = [2.4, 5.0, 7.6, 10.4, 12.6];
const HOT_AT = [0, 0.4, 2.5, 5.1, 7.7, 10.5];
const HOT_TITLES = [
  WRITE_TITLES[3],
  '一次存檔，怎麼變成畫面更新',
  '外掛認出這是 slide 的入口檔',
  '透過 Vite 的 WebSocket 通知',
  '瀏覽器只重新載入這一份',
  '整段路：存檔到畫面',
];
const HOT_SUBS = [
  WRITE_SUBS[3],
  'Vite 預設不看使用者的 slides/，外掛自己把它加進監看。',
  '只有 slides/<id>/index.tsx 算數，其他檔案不會觸發這條路。',
  '100 ms 內的存檔合併成一次，送出改到的 slideId 清單。',
  '每個畫面只聽自己的 slideId，換一個 ?t= 重新 import。',
  '從存檔到畫面更新，中間沒有整頁重新整理。',
];

// A card fades as the camera carries it to the canvas edge, so a pan never parks on a half-cut card.
const edgeFade = (i: number, cam: { x: number; scale: number }, anchorX: number) => {
  const left = anchorX + (hotX(i) - cam.x) * cam.scale;
  const right = anchorX + (hotX(i) + HOT.w - cam.x) * cam.scale;
  return Math.max(0, Math.min(1, (Math.min(left, 1920 - right) + 60) / 80));
};

const HotCardView = ({ i, k, lit }: { i: number; k: number; lit: number }) => {
  const c = HOT_CARDS[i];
  const layer = LAYER[c.layer];
  return (
    <div
      style={{
        position: 'absolute',
        left: hotX(i),
        top: TRACK_Y - HOT.h / 2,
        width: HOT.w,
        height: HOT.h,
        boxSizing: 'border-box',
        padding: '26px 30px',
        background: C.card,
        border: `2px solid ${C.line}`,
        borderRadius: 20,
        opacity: k,
        transform: `translateY(${(1 - k) * 20}px)`,
        ...glow(layer, lit),
      }}
    >
      <div style={{ fontFamily: mono, fontSize: 20, color: C.sub }}>
        {String(i + 1).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: '52px', whiteSpace: 'nowrap' }}>
        {c.title}
      </div>
      <div style={{ fontFamily: mono, fontSize: 22, color: layer.deep, whiteSpace: 'nowrap' }}>
        {c.detail}
      </div>
    </div>
  );
};

const SaveTicks = ({ t }: { t: number }) => {
  const merge = easeInOut(progress(t, 6.2, 0.8));
  const x0 = hotCx(3);
  return (
    <>
      {[-90, 0, 90].map((dx, i) => {
        const appear = ramp(t, 5.5 + i * 0.15, 0.3);
        return (
          <div
            key={dx}
            style={{
              position: 'absolute',
              left: x0 + dx * (1 - merge) - 14,
              top: TRACK_Y + 140,
              width: 28,
              height: 28,
              borderRadius: 8,
              background: LAYER.author.line,
              opacity: appear * (i === 1 ? 1 : 1 - merge),
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: x0 - 200,
          width: 400,
          top: TRACK_Y + 190,
          textAlign: 'center',
          fontSize: 26,
          color: C.sub,
          opacity: ramp(t, 6.8, 0.4),
        }}
      >
        三次存檔 → 一則通知
      </div>
    </>
  );
};

const OtherSlides = ({ t }: { t: number }) => {
  const ids = ['intro', 'hmr', 'pricing'];
  return (
    <div
      style={{ position: 'absolute', left: hotX(4), top: TRACK_Y + 120, display: 'flex', gap: 14 }}
    >
      {ids.map((id, i) => {
        const on = id === 'hmr';
        const k = ramp(t, 8.3 + i * 0.08, 0.3);
        return (
          <div
            key={id}
            style={{
              padding: '8px 18px',
              borderRadius: 12,
              fontFamily: mono,
              fontSize: 24,
              background: on ? LAYER.browser.soft : '#ecebe6',
              color: on ? LAYER.browser.deep : C.faint,
              opacity: k,
              boxShadow: on
                ? `0 0 0 ${8 * pulse(t, 9.0, 0.15, 0.4, 0.5)}px ${LAYER.browser.soft}`
                : undefined,
            }}
          >
            {id}
          </div>
        );
      })}
    </div>
  );
};

const HotPage: Page = () => {
  const { t } = useTimeline(HOT_STOPS);
  const cam = keyframes(t, [
    [0, { x: 960, y: TRACK_Y, scale: 1 }],
    [2.6, { x: 960, y: TRACK_Y, scale: 1 }],
    [3.4, { x: 1510, y: TRACK_Y, scale: 1 }],
    [5.2, { x: 1510, y: TRACK_Y, scale: 1 }],
    [6.0, { x: 2150, y: TRACK_Y, scale: 1 }],
    [7.8, { x: 2150, y: TRACK_Y, scale: 1 }],
    [8.8, { x: 3110, y: TRACK_Y, scale: 1 }],
    [9.8, { x: 3480, y: TRACK_Y, scale: 1 }],
    [10.6, { x: 3480, y: TRACK_Y, scale: 1 }],
    [10.6 + zoomDuration(1, 0.44) * 1.4, { x: 2150, y: TRACK_Y, scale: 0.44 }],
  ]);
  const reach = (() => {
    for (let i = HOT_HOPS.length - 1; i >= 0; i--) {
      const p = progress(t, HOT_HOPS[i], HOT_DUR);
      if (p > 0) return lerp(hotX(i) + HOT.w, hotX(i + 1), easeInOut(p));
    }
    return hotX(0) + HOT.w;
  })();
  const slideIdFlight = 3.4;
  return (
    <Stage chapter="02 · 熱更新">
      <Camera {...cam} anchor={[960, 690]}>
        <svg
          aria-hidden="true"
          width={4400}
          height={1080}
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
        >
          <line
            x1={hotX(0) + HOT.w}
            y1={TRACK_Y}
            x2={hotX(6)}
            y2={TRACK_Y}
            stroke={C.faint}
            strokeWidth={4}
            strokeDasharray="4 12"
            strokeLinecap="round"
          />
          <line
            x1={hotX(0) + HOT.w}
            y1={TRACK_Y}
            x2={reach}
            y2={TRACK_Y}
            stroke={C.accent}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={t > HOT_HOPS[0] ? 1 : 0}
          />
        </svg>
        {HOT_CARDS.map((c, i) => (
          <HotCardView
            key={c.title}
            i={i}
            k={
              edgeFade(i, cam, 960) *
              (i === 0
                ? ramp(t, 0.2, 0.5)
                : ramp(
                    t,
                    Math.min(hotArrive(i) - 0.5, i < 3 ? 0.4 + i * 0.15 : hotArrive(i) - 0.5),
                    0.5,
                  ))
            }
            lit={pulse(t, hotArrive(i), 0.15, i === 0 ? 0.3 : 0.6, 0.5)}
          />
        ))}
        {HOT_HOPS.map((at, i) => (
          <Packet
            key={at}
            t={t}
            at={at}
            duration={HOT_DUR}
            from={[hotX(i) + HOT.w, TRACK_Y]}
            to={[hotX(i + 1), TRACK_Y]}
          />
        ))}
        <Flight
          t={t}
          at={slideIdFlight}
          duration={1.0}
          from={[hotX(2) + 30, TRACK_Y + 120]}
          to={[hotX(2) + 30, TRACK_Y + 120]}
          lift={36}
          text="slideIdForEntry(file)"
          toText="'hmr'"
          color={LAYER.server.line}
          style={{ fontFamily: mono, fontSize: 26, lineHeight: '40px', color: C.ink }}
        />
        {t >= slideIdFlight + 1.0 ? (
          <div
            style={{
              position: 'absolute',
              left: hotX(2) + 18,
              top: TRACK_Y + 120,
              padding: '0 12px',
              fontFamily: mono,
              fontSize: 26,
              lineHeight: '40px',
              color: LAYER.server.deep,
              background: LAYER.server.soft,
              borderRadius: 8,
            }}
          >
            slideId = 'hmr'
          </div>
        ) : null}
        {t >= 5.4 ? <SaveTicks t={t} /> : null}
        {t >= 8.2 ? <OtherSlides t={t} /> : null}
      </Camera>
      <TitleBand />
      <Title t={t} at={HOT_AT} titles={HOT_TITLES} subs={HOT_SUBS} />
    </Stage>
  );
};
HotPage.transition = CUT;

/* ---------------------------------------------------------------- 05 click to edit the source */

const SRC = { x: 120, y: 300, w: 860, h: 520, top: 88, lh: 52, first: 10 };
const SRC_LINES = [
  'const Status: Page = () => (',
  '  <Stage>',
  '    <h1 style={T}>部署狀態</h1>',
  '    <Badge>3 個副本</Badge>',
  '  </Stage>',
  ');',
];
const H1_ROW = 2;
const LOC_TEXT = '    <h1 data-slide-loc="12:4" style={T}>';
const srcRowY = (i: number) => SRC.y + SRC.top + i * SRC.lh;
const CANVAS5 = { x: 1060, y: 300, w: 740, h: 416 };
const H1_ON_CANVAS: Point = [CANVAS5.x + 60, CANVAS5.y + 120];
const FIELD = { x: 1060, y: 760, w: 740, h: 150 };

const EDIT_STOPS = [2.4, 5.4, 8.4, 12.4];
const EDIT_AT = [0, 0.4, 2.5, 5.5, 8.5];
const EDIT_TITLES = [
  HOT_TITLES[5],
  '點一下，改的是原始碼',
  '每個元素都記得自己在哪一行',
  '點畫面，就知道是哪一行',
  '改完送回去，寫進檔案',
];
const EDIT_SUBS = [
  HOT_SUBS[5],
  '編輯畫面上的修改，最後都落在 index.tsx 裡。',
  'dev 模式編譯時，外掛替每個元素加上 data-slide-loc。',
  '點到的元素帶著「第 12 行第 4 欄」，對回原始碼。',
  'POST /__edit 改好檔案，熱更新再把新版畫回來。',
];

const EditPage: Page = () => {
  const { t } = useTimeline(EDIT_STOPS);
  const injected = t >= 3.7;
  const rowLit = pulse(t, 7.2, 0.2, 0.8, 0.5);
  const selected = ramp(t, 6.5, 0.25);
  const typedAt = 8.8;
  const fileAt = 10.4;
  const hmrAt = 10.9;
  return (
    <Stage chapter="03 · 編輯">
      <div
        style={{
          position: 'absolute',
          left: SRC.x,
          top: SRC.y,
          width: SRC.w,
          height: SRC.h,
          background: C.code,
          borderRadius: 20,
          fontFamily: mono,
          fontSize: 24,
          color: TX,
          opacity: ramp(t, 0.5, 0.5),
        }}
      >
        <div style={{ position: 'absolute', left: 28, top: 26, color: C.codeDim, fontSize: 22 }}>
          slides/status/index.tsx
        </div>
        {SRC_LINES.map((text, i) => {
          const isH1 = i === H1_ROW;
          const shown = isH1 && t >= fileAt ? text.replace('部署狀態', '上線狀態') : text;
          return (
            <div
              key={text}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: SRC.top + i * SRC.lh,
                height: SRC.lh,
                display: 'flex',
                alignItems: 'center',
                background: isH1
                  ? `rgba(229, 72, 77, ${0.25 * Math.max(rowLit, pulse(t, fileAt, 0.15, 0.5, 0.5))})`
                  : undefined,
              }}
            >
              <span style={{ width: 64, textAlign: 'right', color: '#55575f' }}>
                {SRC.first + i}
              </span>
              <span style={{ marginLeft: 28, whiteSpace: 'pre' }}>
                {isH1 && injected ? (
                  <>
                    <span>{'    <h1 '}</span>
                    <span style={{ color: '#f2c97d' }}>data-slide-loc="12:4"</span>
                    <span>{` style={T}>${shown.includes('上線') ? '上線狀態' : '部署狀態'}</h1>`}</span>
                  </>
                ) : (
                  shown
                )}
              </span>
            </div>
          );
        })}
      </div>
      <Flight
        t={t}
        at={2.7}
        duration={1.0}
        from={[SRC.x + 92, srcRowY(H1_ROW) + 8]}
        to={[SRC.x + 92, srcRowY(H1_ROW) + 8]}
        lift={60}
        text={SRC_LINES[H1_ROW]}
        toText={LOC_TEXT}
        color="#f2c97d"
        style={{ fontFamily: mono, fontSize: 24, lineHeight: '36px', color: C.ink }}
      />
      <div
        style={{
          position: 'absolute',
          left: SRC.x,
          top: SRC.y + SRC.h + 24,
          fontSize: 24,
          color: C.sub,
          opacity: ramp(t, 3.9, 0.4),
        }}
      >
        只在 dev 模式編譯時加上，原始檔裡看不到這個屬性
      </div>
      <div
        style={{
          position: 'absolute',
          left: CANVAS5.x,
          top: CANVAS5.y,
          width: CANVAS5.w,
          height: CANVAS5.h,
          boxSizing: 'border-box',
          background: C.card,
          border: `2px solid ${C.line}`,
          borderRadius: 16,
          opacity: ramp(t, 0.7, 0.5),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 54,
            top: 92,
            padding: '6px 10px',
            outline: `3px dashed rgba(229, 72, 77, ${selected})`,
            outlineOffset: 4,
            fontSize: 64,
            fontWeight: 800,
            height: 84,
            overflow: 'hidden',
          }}
        >
          <RollText
            t={t}
            at={[0, hmrAt + 0.6]}
            lines={['部署狀態', '上線狀態']}
            height={84}
            style={{ width: 300 }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 230,
            padding: '8px 22px',
            borderRadius: 999,
            background: LAYER.browser.soft,
            color: LAYER.browser.deep,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          ● 3 個副本
        </div>
        <div
          style={{
            position: 'absolute',
            left: 54,
            top: 46,
            padding: '2px 10px',
            borderRadius: 6,
            background: C.accent,
            color: '#fff',
            fontFamily: mono,
            fontSize: 20,
            opacity: selected,
          }}
        >
          h1 · 12:4
        </div>
      </div>
      <Mock x={CANVAS5.x + CANVAS5.w - 96} y={CANVAS5.y + 16} />
      <Cursor
        t={t}
        path={[
          [5.6, 1660, 640],
          [6.4, H1_ON_CANVAS[0] + 140, H1_ON_CANVAS[1] + 30],
          [8.6, H1_ON_CANVAS[0] + 140, H1_ON_CANVAS[1] + 30],
          [9.0, FIELD.x + 380, FIELD.y + 96],
        ]}
        clicks={[6.4, 9.0]}
        visible={progress(t, 5.6, 0.2) * (1 - progress(t, 10.0, 0.3))}
      />
      <Connector
        from={[CANVAS5.x + 60, CANVAS5.y + 58]}
        to={[SRC.x + SRC.w - 20, srcRowY(H1_ROW) + 26]}
        k={easeInOut(progress(t, 6.8, 0.5))}
        fade={1 - progress(t, 8.4, 0.4)}
        color={C.accent}
      />
      <div
        style={{
          position: 'absolute',
          left: FIELD.x,
          top: FIELD.y,
          width: FIELD.w,
          height: FIELD.h,
          boxSizing: 'border-box',
          padding: '22px 28px',
          background: C.card,
          border: `2px solid ${C.line}`,
          borderRadius: 16,
          opacity: ramp(t, 8.6, 0.4),
        }}
      >
        <div style={{ fontSize: 22, color: C.sub }}>文字</div>
        <div style={{ marginTop: 10, fontSize: 36, fontWeight: 700, height: 48 }}>
          {t < typedAt + 0.4 ? (
            '部署狀態'
          ) : (
            <TypedText t={t} at={typedAt + 0.4} text="上線狀態" cps={8} />
          )}
        </div>
      </div>
      <PolyPacket
        t={t}
        at={fileAt - 0.8}
        duration={0.8}
        points={[
          [FIELD.x, FIELD.y + 75],
          [SRC.x + SRC.w + 40, FIELD.y + 75],
          [SRC.x + SRC.w + 40, srcRowY(H1_ROW) + 26],
          [SRC.x + SRC.w - 10, srcRowY(H1_ROW) + 26],
        ]}
        label="POST /__edit · set-text"
      />
      <Packet
        t={t}
        at={hmrAt}
        duration={0.6}
        from={[SRC.x + SRC.w - 10, srcRowY(H1_ROW) + 26]}
        to={[CANVAS5.x + 10, CANVAS5.y + 140]}
        color={LAYER.server.line}
        label="slide-changed"
      />
      <Title t={t} at={EDIT_AT} titles={EDIT_TITLES} subs={EDIT_SUBS} />
    </Stage>
  );
};
EditPage.transition = CUT;

/* ---------------------------------------------------------------- 06 one canvas, every screen */

const SCREEN_C: Point = [960, 660];
type Screen = { w: number; h: number };
const SCREENS: { at: number; name: string; size: string; box: Screen }[] = [
  { at: 2.8, name: '編輯畫面', size: '主畫面那一格', box: { w: 1000, h: 600 } },
  { at: 5.4, name: '筆電全螢幕', size: '1440 × 900', box: { w: 864, h: 540 } },
  { at: 8.0, name: '直立的手機', size: '390 × 844', box: { w: 234, h: 506 } },
];
const LOGICAL = 0.42;

const MiniSlide = ({ s }: { s: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1920,
      height: 1080,
      transform: `scale(${s})`,
      transformOrigin: '0 0',
      background: '#ffffff',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 140,
        top: 150,
        fontSize: 150,
        fontWeight: 800,
        color: C.ink,
      }}
    >
      部署狀態
    </div>
    <div
      style={{
        position: 'absolute',
        left: 150,
        top: 420,
        padding: '20px 56px',
        borderRadius: 999,
        background: LAYER.browser.soft,
        color: LAYER.browser.deep,
        fontSize: 80,
        fontWeight: 700,
      }}
    >
      ● 3 個副本
    </div>
    <div
      style={{
        position: 'absolute',
        left: 150,
        top: 700,
        width: 1620,
        height: 18,
        borderRadius: 9,
        background: '#ecebe6',
      }}
    >
      <div style={{ width: '62%', height: '100%', borderRadius: 9, background: C.accent }} />
    </div>
  </div>
);

const CANVAS_STOPS = [2.4, 5.0, 7.6, 10.4];
const CANVAS_AT = [0, 0.4, 2.5, 5.1, 7.7];
const CANVAS_TITLES = [
  EDIT_TITLES[4],
  '每一頁都畫在 1920 × 1080 上',
  '編輯畫面：等比例縮到放得下',
  '上台：放到最大，比例不變',
  '手機和縮圖，也是同一張',
];
const CANVAS_SUBS = [
  EDIT_SUBS[4],
  '頁面用固定的像素寫，不管最後顯示在哪裡。',
  'SlideCanvas 用 transform: scale(s) 縮放整頁。',
  's 取寬和高兩個比例裡比較小的那個。',
  '縮圖用同一個元件，只是 s 更小，而且不播動畫。',
];

const CanvasPage: Page = () => {
  const { t } = useTimeline(CANVAS_STOPS);
  const start: Screen = { w: 1920 * LOGICAL, h: 1080 * LOGICAL };
  const box = keyframes<Screen>(t, [
    [2.8, start],
    [3.7, SCREENS[0].box],
    [5.4, SCREENS[0].box],
    [6.3, SCREENS[1].box],
    [8.0, SCREENS[1].box],
    [8.9, SCREENS[2].box],
  ]);
  const s = Math.min(box.w / 1920, box.h / 1080);
  const cw = 1920 * s;
  const ch = 1080 * s;
  const frameK = ramp(t, 2.8, 0.5);
  const phase = phaseAt(t, [0, 2.8, 5.4, 8.0]);
  const screen = phase > 0 ? SCREENS[phase - 1] : null;
  const fullscreen = phase >= 2 ? ramp(t, 5.4, 0.5) : 0;
  const rulers = 1 - frameK;
  const thumbs = ramp(t, 8.9, 0.5);
  return (
    <Stage chapter="04 · 畫布">
      <div
        style={{
          position: 'absolute',
          left: SCREEN_C[0] - box.w / 2,
          top: SCREEN_C[1] - box.h / 2,
          width: box.w,
          height: box.h,
          boxSizing: 'border-box',
          borderRadius: phase === 3 ? 34 : 14,
          border: `${4 * frameK}px solid ${C.ink}`,
          background: `rgba(24, 24, 27, ${0.92 * fullscreen})`,
          opacity: Math.max(frameK, rulers > 0 ? 0 : 1),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: SCREEN_C[0] - cw / 2,
          top: SCREEN_C[1] - ch / 2,
          width: cw,
          height: ch,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(24,24,27,0.12)',
          opacity: ramp(t, 0.5, 0.5),
        }}
      >
        <MiniSlide s={s} />
      </div>
      {rulers > 0 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: SCREEN_C[0] - 403,
              top: SCREEN_C[1] - 227 - 52,
              width: 806,
              textAlign: 'center',
              fontFamily: mono,
              fontSize: 28,
              color: C.sub,
              opacity: rulers * ramp(t, 1.0, 0.4),
            }}
          >
            ← 1920 →
          </div>
          <div
            style={{
              position: 'absolute',
              left: SCREEN_C[0] + 403 + 20,
              top: SCREEN_C[1] - 20,
              fontFamily: mono,
              fontSize: 28,
              color: C.sub,
              opacity: rulers * ramp(t, 1.2, 0.4),
            }}
          >
            1080
          </div>
        </>
      ) : null}
      {screen ? (
        <div
          style={{
            position: 'absolute',
            left: SCREEN_C[0] - box.w / 2,
            top: SCREEN_C[1] - box.h / 2 - 50,
            fontSize: 26,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            opacity: ramp(t, screen.at + 0.5, 0.4),
          }}
        >
          {screen.name}
          <span style={{ marginLeft: 14, fontFamily: mono, fontWeight: 400, color: C.sub }}>
            {screen.size}
          </span>
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 990,
          fontFamily: mono,
          fontSize: 34,
          color: C.ink,
          opacity: ramp(t, 0.6, 0.4),
        }}
      >
        transform: scale(<span style={{ color: C.accent }}>{s.toFixed(3)}</span>)
      </div>
      {thumbs > 0
        ? [0, 1, 2, 3].map((i) => {
            const k = ramp(t, 8.9 + i * 0.1, 0.4);
            const ts = 0.09;
            return (
              <div
                key={`thumb-${i}`}
                style={{
                  position: 'absolute',
                  left: 1480,
                  top: 380 + i * 120,
                  width: 1920 * ts,
                  height: 1080 * ts,
                  overflow: 'hidden',
                  borderRadius: 6,
                  border: `2px solid ${i === 1 ? C.accent : C.line}`,
                  opacity: k,
                  transform: `translateX(${(1 - k) * 30}px)`,
                }}
              >
                <MiniSlide s={ts} />
              </div>
            );
          })
        : null}
      {thumbs > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 1480,
            top: 336,
            fontSize: 24,
            color: C.sub,
            opacity: thumbs,
          }}
        >
          縮圖：同一個元件，s 更小
        </div>
      ) : null}
      <Title t={t} at={CANVAS_AT} titles={CANVAS_TITLES} subs={CANVAS_SUBS} />
    </Stage>
  );
};
CanvasPage.transition = CUT;

/* ---------------------------------------------------------------- 07 one press of → */

const FLOW7 = { y: 470, w: 330, h: 130, xs: [440, 850, 1260] };
const FLOW7_CARDS = [
  { title: 'Player', detail: '收到 →' },
  { title: 'StepHost', detail: 'revealed + 1' },
  { title: 'useTimeline', detail: 'target = stops[n]' },
];
const KEY7: Point = [180, 470];
const RULER = { x0: 300, x1: 1540, y: 790 };
const MINI_STOPS = [1.2, 3.0, 5.0, 6.4];
const MINI_MAX = 6.4;
const rx = (mt: number) => lerp(RULER.x0, RULER.x1, mt / MINI_MAX);

// The page's own t drives a smaller clock on the ruler: it parks, plays, and on the
// press mid-segment jumps to the stop it was heading for.
const miniT = (t: number) =>
  keyframes(
    t,
    [
      [0.6, 0],
      [2.0, 1.2],
      [4.4, 1.2],
      [5.8, 3.0],
      [6.7, 3.0],
      [7.5, 3.8],
      [7.52, 5.0],
      [8.9, 6.4],
    ],
    (k) => k,
  );

const PRESS_STOPS = [2.4, 6.0, 9.4, 12.0];
const PRESS_AT = [0, 0.4, 2.5, 6.1, 9.5];
const PRESS_TITLES = [
  CANVAS_TITLES[4],
  '按一下 → 發生了什麼',
  '往下播一段，停在下一個停點',
  '還在播就按：直接跳到終點',
  '最後一個停點，就是縮圖的樣子',
];
const PRESS_SUBS = [
  CANVAS_SUBS[4],
  'Player 接到按鍵，交給 StepHost，StepHost 告訴 useTimeline 下一站在哪。',
  'useTimeline 把 t 一格一格往前推，頁面上每個值都跟著 t 算。',
  '講者已經講到下一句，就不用等這段播完。',
  '縮圖、預覽 ?step=n、匯出都直接停在那裡，不用播。',
];

const PressPage: Page = () => {
  const { t } = useTimeline(PRESS_STOPS);
  const mt = miniT(t);
  const presses = [2.8, 6.3, 7.5];
  const keyDown = Math.max(...presses.map((at) => pulse(t, at, 0.08, 0.12, 0.2)));
  const chain = (at: number) => [
    { from: [KEY7[0] + 80, KEY7[1] + 65] as Point, to: [FLOW7.xs[0], FLOW7.y + 65] as Point, at },
    {
      from: [FLOW7.xs[0] + FLOW7.w, FLOW7.y + 65] as Point,
      to: [FLOW7.xs[1], FLOW7.y + 65] as Point,
      at: at + 0.4,
    },
    {
      from: [FLOW7.xs[1] + FLOW7.w, FLOW7.y + 65] as Point,
      to: [FLOW7.xs[2], FLOW7.y + 65] as Point,
      at: at + 0.8,
    },
  ];
  const revealed = t < 3.4 ? 0 : t < 6.9 ? 1 : t < 8.1 ? 2 : 3;
  const playing = (t > 0.6 && t < 2.0) || (t > 4.4 && t < 5.8) || (t > 6.7 && t < 8.9);
  const jumpFlash = pulse(t, 7.5, 0.05, 0.4, 0.5);
  return (
    <Stage chapter="05 · 播放">
      <div
        style={{
          position: 'absolute',
          left: KEY7[0] - 80,
          top: KEY7[1],
          width: 160,
          height: 130,
          boxSizing: 'border-box',
          borderRadius: 22,
          background: C.card,
          border: `3px solid ${C.ink}`,
          boxShadow: `0 ${10 - 8 * keyDown}px 0 ${C.ink}`,
          transform: `translateY(${8 * keyDown}px)`,
          display: 'grid',
          placeItems: 'center',
          fontSize: 72,
          fontWeight: 800,
          opacity: ramp(t, 0.5, 0.4),
        }}
      >
        →
      </div>
      {FLOW7_CARDS.map((c, i) => (
        <div
          key={c.title}
          style={{
            position: 'absolute',
            left: FLOW7.xs[i],
            top: FLOW7.y,
            width: FLOW7.w,
            height: FLOW7.h,
            boxSizing: 'border-box',
            padding: '20px 26px',
            background: C.card,
            border: `2px solid ${C.line}`,
            borderRadius: 18,
            opacity: ramp(t, 0.7 + i * 0.12, 0.5),
            ...glow(
              LAYER.browser,
              Math.max(...presses.map((at) => pulse(t, at + 0.4 * (i + 1), 0.12, 0.3, 0.4))),
            ),
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 800 }}>{c.title}</div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 22,
              color: LAYER.browser.deep,
              marginTop: 6,
              display: 'flex',
              gap: 8,
            }}
          >
            {i === 1 ? (
              <>
                revealed =
                <RollText
                  t={t}
                  at={[0, 3.4, 6.9, 8.1]}
                  lines={['0', '1', '2', '3']}
                  height={30}
                  style={{ width: 24 }}
                />
              </>
            ) : (
              c.detail
            )}
          </div>
        </div>
      ))}
      {presses.flatMap((at) =>
        chain(at).map((hop) => (
          <Packet
            key={`${at}-${hop.at}`}
            t={t}
            at={hop.at}
            duration={0.4}
            from={hop.from}
            to={hop.to}
            size={18}
          />
        )),
      )}
      <svg
        aria-hidden="true"
        width={1920}
        height={1080}
        style={{ position: 'absolute', left: 0, top: 0, opacity: ramp(t, 0.4, 0.4) }}
      >
        <line
          x1={RULER.x0}
          y1={RULER.y}
          x2={RULER.x1}
          y2={RULER.y}
          stroke={C.faint}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1={RULER.x0}
          y1={RULER.y}
          x2={rx(mt)}
          y2={RULER.y}
          stroke={C.accent}
          strokeWidth={6}
          strokeLinecap="round"
        />
        {MINI_STOPS.map((st) => (
          <line
            key={st}
            x1={rx(st)}
            y1={RULER.y - 22}
            x2={rx(st)}
            y2={RULER.y + 22}
            stroke={mt >= st - 1e-6 ? C.accent : C.faint}
            strokeWidth={4}
          />
        ))}
      </svg>
      {MINI_STOPS.map((st, i) => (
        <div
          key={`lab-${st}`}
          style={{
            position: 'absolute',
            left: rx(st) - 60,
            width: 120,
            top: RULER.y + 34,
            textAlign: 'center',
            fontFamily: mono,
            fontSize: 22,
            color: C.sub,
            opacity: ramp(t, 0.6, 0.4),
          }}
        >
          stops[{i}]
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: rx(mt) - 18,
          top: RULER.y - 18,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: C.accent,
          boxShadow: `0 0 0 ${8 + 14 * jumpFlash}px rgba(229, 72, 77, ${0.18 + 0.2 * jumpFlash})`,
          opacity: ramp(t, 0.5, 0.3),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: rx(mt) - 70,
          width: 140,
          top: RULER.y - 80,
          textAlign: 'center',
          fontFamily: mono,
          fontSize: 26,
          color: C.ink,
          opacity: ramp(t, 0.6, 0.3),
        }}
      >
        t={mt.toFixed(1)}
      </div>
      {jumpFlash > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: rx(4.2) - 120,
            width: 240,
            top: RULER.y - 140,
            textAlign: 'center',
            fontSize: 26,
            fontWeight: 700,
            color: C.accent,
            opacity: jumpFlash,
          }}
        >
          跳到 stops[2]
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 1640,
          top: RULER.y - 22,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.6)',
          opacity: ramp(t, 0.8, 0.4) * (revealed < 3 || playing ? 1 : 0.35),
        }}
      >
        {[1, 2, 3].map((n) => {
          const done = revealed >= n && !(playing && revealed === n);
          const live = playing && revealed === n;
          return (
            <span
              key={n}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: done ? 'rgba(255,255,255,0.85)' : live ? C.accent : 'transparent',
                boxShadow: done || live ? undefined : 'inset 0 0 0 2px rgba(255,255,255,0.6)',
                transform: `scale(${live ? 1 + 0.25 * Math.sin(t * 9) ** 2 : 1})`,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1640,
          top: RULER.y + 34,
          fontSize: 22,
          color: C.sub,
          opacity: ramp(t, 0.8, 0.4),
        }}
      >
        簡報模式右下角
      </div>
      {t > 9.6
        ? ['縮圖', '預覽 ?step=3', '匯出'].map((label, i) => {
            const k = ramp(t, 9.8 + i * 0.15, 0.4, easeOut);
            return (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  left: RULER.x1 - 560 + i * 200,
                  top: RULER.y + 100,
                  padding: '8px 18px',
                  borderRadius: 12,
                  background: C.card,
                  border: `2px solid ${C.accent}`,
                  fontSize: 24,
                  opacity: k,
                  transform: `translateY(${(1 - k) * -30}px)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            );
          })
        : null}
      <Title t={t} at={PRESS_AT} titles={PRESS_TITLES} subs={PRESS_SUBS} />
    </Stage>
  );
};
PressPage.transition = CUT;

/* ---------------------------------------------------------------- 08 the presenter window */

const AUD = { x: 120, y: 300, w: 900, h: 520 };
const PRE = { x: 1100, y: 300, w: 700, h: 520 };
const PIPE: Point[] = [
  [PRE.x + PRE.w / 2, PRE.y + PRE.h],
  [PRE.x + PRE.w / 2, 930],
  [AUD.x + AUD.w / 2, 930],
  [AUD.x + AUD.w / 2, AUD.y + AUD.h],
];

const Win = ({
  x,
  y,
  w,
  h,
  url,
  k,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
  k: number;
  children: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: 'border-box',
      background: C.card,
      border: `2px solid ${C.line}`,
      borderRadius: 18,
      overflow: 'hidden',
      opacity: k,
      transform: `translateY(${(1 - k) * 20}px)`,
      boxShadow: '0 16px 40px rgba(24,24,27,0.08)',
    }}
  >
    <div
      style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px',
        background: '#f0efeb',
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      {['#ef6b5e', '#f4bf4f', '#61c454'].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
      ))}
      <span style={{ marginLeft: 16, fontFamily: mono, fontSize: 20, color: C.sub }}>{url}</span>
    </div>
    {children}
  </div>
);

const SYNC_STOPS = [2.4, 5.0, 7.7, 10.2];
const SYNC_AT = [0, 0.4, 2.5, 5.1, 7.8];
const SYNC_TITLES = [
  PRESS_TITLES[4],
  '講者視窗跟著走',
  '講者按 →，觀眾那邊翻頁',
  '新的狀態再傳回來',
  '兩個分頁直接講話',
];
const SYNC_SUBS = [
  PRESS_SUBS[4],
  '一個分頁給觀眾看，另一個分頁開 /presenter 給自己看。',
  "講者視窗送出 { type: 'next' }，觀眾的 Player 照做。",
  '觀眾那邊回報頁碼和停點，講者視窗的進度跟著變。',
  'BroadcastChannel 在同一個瀏覽器裡傳，不經過 dev server。',
];

const SyncPage: Page = () => {
  const { t } = useTimeline(SYNC_STOPS);
  const winK = ramp(t, 0.5, 0.5);
  const pipeK = easeInOut(progress(t, 1.0, 0.8));
  const flipAt = 4.0;
  const backAt = 5.3;
  const counterAt = 6.4;
  const serverK = ramp(t, 8.1, 0.5);
  const keyDown = pulse(t, 2.7, 0.08, 0.12, 0.2);
  return (
    <Stage chapter="06 · 上台">
      <Win x={AUD.x} y={AUD.y} w={AUD.w} h={AUD.h} url="/s/hmr" k={winK}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 52,
            right: 0,
            bottom: 0,
            background: '#18181b',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 720,
              height: 405,
              background: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <RollText
              t={t}
              at={[0, flipAt]}
              lines={['03 · 部署狀態', '04 · 熱更新']}
              height={90}
              style={{
                position: 'absolute',
                left: 56,
                top: 120,
                width: 600,
                fontSize: 64,
                fontWeight: 800,
                color: C.ink,
              }}
            />
          </div>
        </div>
      </Win>
      <Win x={PRE.x} y={PRE.y} w={PRE.w} h={PRE.h} url="/s/hmr/presenter" k={ramp(t, 0.65, 0.5)}>
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: 84,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <RollText
            t={t}
            at={[0, counterAt]}
            lines={['3 / 12', '4 / 12']}
            height={56}
            style={{ width: 170, fontFamily: mono, fontSize: 44, fontWeight: 700 }}
          />
          <span style={{ fontFamily: mono, fontSize: 30, color: C.sub }}>12:04</span>
        </div>
        <div style={{ position: 'absolute', left: 32, top: 172, fontSize: 24, color: C.sub }}>
          講稿
        </div>
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: 212,
            width: 620,
            fontSize: 28,
            lineHeight: 1.6,
          }}
        >
          這頁先講存檔，再講外掛怎麼認出入口檔……
        </div>
        <div
          style={{
            position: 'absolute',
            right: 32,
            bottom: 32,
            width: 120,
            height: 100,
            boxSizing: 'border-box',
            borderRadius: 18,
            border: `3px solid ${C.ink}`,
            boxShadow: `0 ${8 - 6 * keyDown}px 0 ${C.ink}`,
            transform: `translateY(${6 * keyDown}px)`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 54,
            fontWeight: 800,
            background: C.card,
          }}
        >
          →
        </div>
      </Win>
      <Mock x={PRE.x + PRE.w - 96} y={PRE.y + 64} />
      <PolyWire points={PIPE} k={pipeK} color={LAYER.browser.line} />
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 908,
          padding: '0 14px',
          fontFamily: mono,
          fontSize: 24,
          color: LAYER.browser.deep,
          background: 'var(--osd-bg)',
          opacity: pipeK,
          boxShadow: `0 0 0 ${10 * pulse(t, 8.4, 0.2, 0.6, 0.5)}px ${LAYER.browser.soft}`,
          borderRadius: 8,
        }}
      >
        BroadcastChannel · open-slide:presenter:hmr
      </div>
      <PolyPacket t={t} at={2.9} duration={1.0} points={PIPE} label="{ type: 'next' }" />
      <PolyPacket
        t={t}
        at={backAt}
        duration={1.0}
        points={[...PIPE].reverse()}
        color={LAYER.browser.line}
        label="{ type: 'state' }"
      />
      {serverK > 0 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 1500,
              top: 900,
              padding: '14px 24px',
              borderRadius: 14,
              border: `2px dashed ${C.faint}`,
              fontSize: 26,
              color: C.sub,
              opacity: serverK * defocus(0.3).opacity,
              filter: defocus(0.3).filter,
            }}
          >
            dev server
          </div>
          <div
            style={{
              position: 'absolute',
              left: 1500,
              top: 980,
              fontSize: 24,
              fontWeight: 700,
              color: C.accent,
              opacity: ramp(t, 8.5, 0.4),
            }}
          >
            不經過
          </div>
        </>
      ) : null}
      <Title t={t} at={SYNC_AT} titles={SYNC_TITLES} subs={SYNC_SUBS} />
    </Stage>
  );
};
SyncPage.transition = CUT;

/* ---------------------------------------------------------------- 09 the comment loop */

const RING = { cx: 960, cy: 650, rx: 560, ry: 250 };
const ringAt = (deg: number): Point => [
  RING.cx + RING.rx * Math.cos((deg * Math.PI) / 180),
  RING.cy + RING.ry * Math.sin((deg * Math.PI) / 180),
];
const NODES = [
  { deg: -90, title: '在畫面上留言', detail: '點元素，寫一句話', layer: 'browser' as LayerKey },
  { deg: 0, title: '原始碼多一行標記', detail: '@slide-comment', layer: 'author' as LayerKey },
  { deg: 90, title: 'agent 照著改', detail: 'apply-comments skill', layer: 'author' as LayerKey },
  {
    deg: 180,
    title: '存檔，熱更新',
    detail: 'open-slide:slide-changed',
    layer: 'server' as LayerKey,
  },
];
const LEGS = [
  { from: -90, to: 0, at: 2.6, label: '' },
  { from: 0, to: 90, at: 5.0, label: 'agent' },
  { from: 90, to: 180, at: 7.8, label: '存檔' },
  { from: 180, to: 270, at: 8.8, label: 'slide-changed' },
];
const LEG_DUR = 0.8;

const RingPacket = ({ t, leg }: { t: number; leg: (typeof LEGS)[number] }) => {
  if (t < leg.at || t >= leg.at + LEG_DUR) return null;
  const deg = lerp(leg.from, leg.to, easeInOut(progress(t, leg.at, LEG_DUR)));
  const [x, y] = ringAt(deg);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - 12,
          top: y - 12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: C.accent,
          boxShadow: '0 0 0 7px rgba(229,72,77,0.2)',
        }}
      />
      {leg.label ? (
        <div
          style={{
            position: 'absolute',
            left: x + 22,
            top: y - 44,
            padding: '0 8px',
            fontFamily: mono,
            fontSize: 22,
            color: C.accent,
            background: 'var(--osd-bg)',
          }}
        >
          {leg.label}
        </div>
      ) : null}
    </>
  );
};

const arcD = (a: number, b: number) => {
  const [x1, y1] = ringAt(a);
  const [x2, y2] = ringAt(b);
  return `M ${x1} ${y1} A ${RING.rx} ${RING.ry} 0 0 1 ${x2} ${y2}`;
};

const LOOP_STOPS = [2.4, 4.8, 7.6, 10.0, 12.0];
const LOOP_AT = [0, 0.4, 2.5, 4.9, 7.7, 10.1];
const LOOP_TITLES = [
  SYNC_TITLES[4],
  '留言，讓 agent 去改',
  '留言變成原始碼裡的一行',
  'agent 照 skill 把它改掉',
  '存檔，畫面自己更新',
  '改一次，繞一圈',
];
const LOOP_SUBS = [
  SYNC_SUBS[4],
  '不用自己動手改程式碼：在畫面上說要改什麼。',
  '標記寫進 index.tsx，跟被留言的元素放在一起。',
  '內建的 agent 面板用 Claude 或 Codex，照 apply-comments 處理每一則。',
  '標記拿掉、檔案存好，熱更新那條路把新版送回畫面。',
  '留言、標記、agent、熱更新：每一則留言都走這一圈。',
];
const PROMPT_LINES = [
  'Use the apply-comments skill to apply every',
  'pending @slide-comment marker, then remove them.',
];

const LoopPage: Page = () => {
  const { t } = useTimeline(LOOP_STOPS);
  const ringK = easeInOut(progress(t, 0.6, 1.0));
  const nodeLit = (i: number) => {
    const arrive = i === 0 ? LEGS[3].at + LEG_DUR : LEGS[i - 1].at + LEG_DUR;
    const finale = pulse(t, 10.3 + i * 0.12, 0.15, 0.5, 0.5);
    return Math.max(pulse(t, arrive, 0.15, 0.7, 0.5), finale);
  };
  const center = phaseAt(t, [0, 3.3, 5.8, 8.6, 10.1]);
  const centerK = (at: number) => ramp(t, at, 0.4);
  const legDone = (i: number) => easeInOut(progress(t, LEGS[i].at, LEG_DUR));
  return (
    <Stage chapter="07 · 留言">
      <svg
        aria-hidden="true"
        width={1920}
        height={1080}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <ellipse
          cx={RING.cx}
          cy={RING.cy}
          rx={RING.rx}
          ry={RING.ry}
          fill="none"
          stroke={C.faint}
          strokeWidth={3}
          strokeDasharray="4 12"
          opacity={ringK}
        />
        {LEGS.map((leg, i) => (
          <path
            key={leg.at}
            d={arcD(leg.from, leg.to)}
            fill="none"
            stroke={C.accent}
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - legDone(i)}
          />
        ))}
      </svg>
      {NODES.map((n, i) => {
        const [x, y] = ringAt(n.deg);
        const k = ramp(t, 0.8 + i * 0.15, 0.5);
        const layer = LAYER[n.layer];
        return (
          <div
            key={n.title}
            style={{
              position: 'absolute',
              left: x - 190,
              top: y - 60,
              width: 380,
              height: 120,
              boxSizing: 'border-box',
              padding: '18px 26px',
              background: C.card,
              border: `2px solid ${C.line}`,
              borderRadius: 18,
              opacity: k,
              transform: `scale(${lerp(0.85, 1, overshoot(progress(t, 0.8 + i * 0.15, 0.5)))})`,
              ...glow(layer, nodeLit(i)),
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, whiteSpace: 'nowrap' }}>{n.title}</div>
            <div
              style={{ fontFamily: mono, fontSize: 21, color: layer.deep, whiteSpace: 'nowrap' }}
            >
              {n.detail}
            </div>
          </div>
        );
      })}
      <Flight
        t={t}
        at={LEGS[0].at}
        duration={LEG_DUR + 0.2}
        from={[ringAt(-90)[0] - 100, ringAt(-90)[1] + 70]}
        to={[ringAt(0)[0] - 170, ringAt(0)[1] + 70]}
        text="「標題再大一點」"
        toText="@slide-comment"
        style={{ fontSize: 26, lineHeight: '40px', color: C.ink }}
      />
      {RingPacketList(t)}
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 570,
          width: 800,
          height: 160,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        {center === 0 || center === 4 ? (
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              opacity: center === 0 ? ramp(t, 1.4, 0.5) : centerK(10.2),
            }}
          >
            改一次，繞一圈
          </div>
        ) : null}
        {center === 1 ? (
          <div
            style={{
              fontFamily: mono,
              fontSize: 21,
              lineHeight: 1.5,
              padding: '14px 22px',
              borderRadius: 12,
              background: C.code,
              color: C.codeText,
              opacity: centerK(3.4),
            }}
          >
            {'{/* @slide-comment id="c-4f1a" ts="…" text="5qiZ…" */}'}
          </div>
        ) : null}
        {center === 2 ? (
          <div
            style={{
              fontFamily: mono,
              fontSize: 22,
              lineHeight: 1.6,
              textAlign: 'left',
              padding: '14px 22px',
              borderRadius: 12,
              background: C.code,
              color: C.codeText,
              opacity: centerK(5.9),
            }}
          >
            {PROMPT_LINES.map((line, i) => (
              <div key={line} style={{ whiteSpace: 'pre', height: 35 }}>
                <TypedText t={t} at={5.9 + i * 0.75} text={line} cps={60} />
              </div>
            ))}
          </div>
        ) : null}
        {center === 3 ? (
          <div style={{ fontSize: 34, fontWeight: 700, opacity: centerK(8.7) }}>
            標記拿掉 → 存檔 →{' '}
            <span style={{ fontFamily: mono, color: LAYER.server.deep }}>slide-changed</span>
          </div>
        ) : null}
      </div>
      <Title t={t} at={LOOP_AT} titles={LOOP_TITLES} subs={LOOP_SUBS} />
    </Stage>
  );
};
LoopPage.transition = CUT;

function RingPacketList(t: number) {
  return LEGS.slice(1).map((leg) => <RingPacket key={leg.at} t={t} leg={leg} />);
}

/* ---------------------------------------------------------------- 10 three exports */

const PAGES10 = { x0: 330, y: 330, step: 220, w: 192, h: 108, n: 6 };
const BINS = [
  { name: 'PDF', file: 'hmr.pdf', lines: ['交給瀏覽器列印', 'window.print()'], x: 150, at: 2.6 },
  {
    name: 'HTML',
    file: 'hmr.html',
    lines: ['一個 .html 帶走', '有圖片就連 assets 打包成 .zip'],
    x: 730,
    at: 5.2,
  },
  { name: 'PPTX', file: 'hmr.pptx', lines: ['逐頁量出版面', '講稿放進備忘稿'], x: 1310, at: 7.8 },
];
const BIN = { y: 600, w: 460, h: 360 };
const PAGE_TINTS = ['#fbefd9', '#e2ebfb', '#dcf1e6', '#ece4fb', '#fde2e2', '#ecebe6'];

const PageCard = ({
  i,
  x,
  y,
  scale = 1,
  opacity = 1,
}: {
  i: number;
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: PAGES10.w,
      height: PAGES10.h,
      boxSizing: 'border-box',
      padding: '14px 16px',
      borderRadius: 10,
      background: C.card,
      border: `2px solid ${C.line}`,
      transform: `scale(${scale})`,
      transformOrigin: '0 0',
      opacity,
      boxShadow: '0 6px 16px rgba(24,24,27,0.08)',
    }}
  >
    <div style={{ width: 90, height: 14, borderRadius: 7, background: C.ink }} />
    <div
      style={{ marginTop: 14, width: 140, height: 34, borderRadius: 8, background: PAGE_TINTS[i] }}
    />
    <div
      style={{
        position: 'absolute',
        right: 12,
        bottom: 8,
        fontFamily: mono,
        fontSize: 16,
        color: C.sub,
      }}
    >
      {i + 1}
    </div>
  </div>
);

const EXPORT_STOPS = [2.4, 5.0, 7.6, 10.4];
const EXPORT_AT = [0, 0.4, 2.5, 5.1, 7.7];
const EXPORT_TITLES = [
  LOOP_TITLES[5],
  '同一份 slide，三種交法',
  'PDF：每頁一張',
  'HTML：一個檔案就能播',
  'PPTX：還能在 PowerPoint 裡開',
];
const EXPORT_SUBS = [
  LOOP_SUBS[5],
  '三種都拿每一頁最後一個停點的畫面，不必等動畫。',
  '頁面排好交給瀏覽器的列印，存成 PDF。',
  '樣式一起打包，用到圖片時連同 assets 壓成 .zip。',
  '把每頁的版面量出來轉成投影片，講稿放進備忘稿。',
];

const ExportPage: Page = () => {
  const { t } = useTimeline(EXPORT_STOPS);
  return (
    <Stage chapter="08 · 匯出">
      {Array.from({ length: PAGES10.n }, (_, i) => (
        <PageCard
          key={`src-${i}`}
          i={i}
          x={PAGES10.x0 + i * PAGES10.step}
          y={PAGES10.y}
          opacity={ramp(t, 0.6 + i * 0.08, 0.4)}
        />
      ))}
      {BINS.map((bin) => {
        const k = ramp(t, 1.0, 0.5);
        const filled = ramp(t, bin.at + 1.5, 0.4);
        return (
          <div
            key={bin.name}
            style={{
              position: 'absolute',
              left: bin.x,
              top: BIN.y,
              width: BIN.w,
              height: BIN.h,
              boxSizing: 'border-box',
              padding: '28px 32px',
              borderRadius: 24,
              border: `3px ${filled > 0.5 ? 'solid' : 'dashed'} ${filled > 0.5 ? LAYER.output.line : C.faint}`,
              background: `color-mix(in srgb, ${LAYER.output.soft} ${Math.round(filled * 100)}%, transparent)`,
              opacity: k,
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: filled > 0.5 ? LAYER.output.deep : C.faint,
              }}
            >
              {bin.name}
            </div>
            <div style={{ fontFamily: mono, fontSize: 24, color: C.sub, marginTop: 4 }}>
              {bin.file}
            </div>
            {bin.lines.map((line, j) => (
              <div
                key={line}
                style={{
                  marginTop: j === 0 ? 96 : 6,
                  fontSize: j === 0 ? 30 : 22,
                  fontWeight: j === 0 ? 700 : 400,
                  fontFamily: j === 0 ? undefined : mono,
                  color: j === 0 ? C.ink : C.sub,
                  opacity: filled,
                  whiteSpace: 'nowrap',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        );
      })}
      {BINS.flatMap((bin) =>
        Array.from({ length: PAGES10.n }, (_, i) => {
          const at = bin.at + i * 0.12;
          const p = easeInOut(progress(t, at, 0.9));
          if (p <= 0) return null;
          const fx = PAGES10.x0 + i * PAGES10.step;
          const tx = bin.x + 250 + i * 8;
          const ty = BIN.y + 70 + i * 6;
          return (
            <PageCard
              key={`${bin.name}-${i}`}
              i={i}
              x={lerp(fx, tx, p)}
              y={lerp(PAGES10.y, ty, p) - Math.sin(Math.PI * p) * 90}
              scale={lerp(1, 0.75, p)}
            />
          );
        }),
      )}
      <Title t={t} at={EXPORT_AT} titles={EXPORT_TITLES} subs={EXPORT_SUBS} />
    </Stage>
  );
};
ExportPage.transition = CUT;

/* ---------------------------------------------------------------- 11 all of it */

const FINALE_STOPS = [4.6, 7.4];
const FINALE_AT = [0, 0.4, 4.7];
const FINALE_TITLES = [EXPORT_TITLES[4], '全部串起來', '一個檔案，四塊，一條路'];
const FINALE_SUBS = [
  EXPORT_SUBS[4],
  '存檔、熱更新、播放、改回原始碼、匯出：同時在跑。',
  '寫的是 React，播的是時間軸，停點就是成品。',
];
const SUMMARY = [
  { k: '寫', v: '一頁就是一個 React 元件，放在 slides/<id>/index.tsx' },
  { k: '跑', v: 'Vite 外掛盯著入口檔，只重載改到的那份' },
  { k: '播', v: '一按一拍，最後一個停點就是縮圖和匯出' },
];

const FinalePage: Page = () => {
  const { t } = useTimeline(FINALE_STOPS);
  const cam = keyframes(t, [
    [0, { x: 1184, y: 630, scale: 1.9 }],
    [0.6, { x: 1184, y: 630, scale: 1.9 }],
    [0.6 + zoomDuration(1.9, 1) * 1.5, { x: 960, y: 650, scale: 1 }],
  ]);
  const tour = 1.8;
  const hops = saveHops(tour);
  const s: WorldState = {
    zone: () => 1,
    card: (id) => {
      const hop = hops.find((h) => h.card === id);
      const c = CARDS[id];
      let lit = hop ? pulse(t, hop.at + HOP * 0.9, 0.15, 0.4, 0.5) : 0;
      if (id === 'file')
        lit = Math.max(lit, pulse(t, tour, 0.15, 0.4, 0.5), pulse(t, 3.4, 0.15, 0.4, 0.5));
      if (id === 'presenter') lit = pulse(t, tour + 3 * HOP + 0.6, 0.15, 0.4, 0.5);
      if (c.layer === 'output') lit = pulse(t, tour + 2.0 + c.row * 0.12, 0.15, 0.4, 0.5);
      return { k: 1, lit };
    },
    wire: () => 1,
    back: 1,
  };
  const dim = ramp(t, 5.0, 0.6);
  const veil = 0.5 * dim;
  return (
    <Stage chapter="09 · 全部">
      <div style={{ position: 'absolute', inset: 0, ...defocus(dim * 0.9) }}>
        <Camera {...cam} anchor={[960, 650]}>
          <ArchWorld s={s}>
            {hops.map((h) => (
              <Packet
                key={h.wire}
                t={t}
                at={h.at}
                duration={HOP}
                from={WIRES[h.wire][0]}
                to={WIRES[h.wire][1]}
              />
            ))}
            <Packet
              t={t}
              at={tour + 3 * HOP}
              duration={0.6}
              from={WIRES.playerPresenter[0]}
              to={WIRES.playerPresenter[1]}
              color={LAYER.browser.line}
            />
            {(['editorPdf', 'editorHtml', 'editorPptx'] as const).map((id, i) => (
              <Packet
                key={id}
                t={t}
                at={tour + 1.4 + i * 0.12}
                duration={0.6}
                from={WIRES[id][0]}
                to={WIRES[id][1]}
                color={LAYER.output.line}
              />
            ))}
            <PolyPacket t={t} at={2.6} duration={0.8} points={BACK} color={LAYER.author.line} />
          </ArchWorld>
        </Camera>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(245, 244, 240, ${veil})`,
          pointerEvents: 'none',
        }}
      />
      {dim > 0
        ? SUMMARY.map((row, i) => {
            const k = ramp(t, 5.2 + i * 0.25, 0.5, easeOut);
            return (
              <div
                key={row.k}
                style={{
                  position: 'absolute',
                  left: 220,
                  top: 400 + i * 160,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 48,
                  opacity: k,
                  transform: `translateX(${(1 - k) * 40}px)`,
                }}
              >
                <span
                  style={{
                    fontSize: 96,
                    fontWeight: 800,
                    color: LAYER[LAYER_ORDER[i]].deep,
                  }}
                >
                  {row.k}
                </span>
                <span style={{ fontSize: 44, fontWeight: 700, color: C.ink }}>{row.v}</span>
              </div>
            );
          })
        : null}
      <TitleBand />
      <Title t={t} at={FINALE_AT} titles={FINALE_TITLES} subs={FINALE_SUBS} />
    </Stage>
  );
};
FinalePage.transition = CUT;

export const meta: SlideMeta = { title: 'open-slide 架構導覽' };

export const notes: (string | undefined)[] = [
  '這份簡報整份用 useTimeline 做：每一頁按 → 往下播一段。內容是 open-slide 自己的架構。',
  `先看全景：作者端、dev server、瀏覽器、輸出四塊。
按 →：存檔之後怎麼一路傳到瀏覽器。
按 →：在畫面上改，透過 POST /__edit 寫回 index.tsx。
按 →：匯出 PDF、HTML、PPTX。`,
  `左邊的 Claude Code 面板是示意，右邊是 agent 寫出來的檔案。
按 →：agent 寫 index.tsx。
按 →：存檔，交給 dev server。`,
  `一次存檔的完整路線，鏡頭跟著走。
按 →：外掛用 slideIdForEntry 認出入口檔。
按 →：100 ms 內的存檔合併成一則 open-slide:slide-changed。
按 →：只有 slideId 對得上的畫面重新 import。
按 →：拉遠看整條路。`,
  `按 →：外掛在 dev 編譯時加上 data-slide-loc。
按 →：點畫面上的元素，對回第 12 行。
按 →：改文字，POST /__edit 寫回檔案，熱更新再畫回來。編輯畫面是示意。`,
  `畫布永遠是 1920×1080，只是 scale 不同。
按 →：編輯畫面、筆電全螢幕、手機，s 取寬高比例的較小值。`,
  `→ 從 Player 到 StepHost 到 useTimeline。
按 →：播一段停一下。
按 →：還在播的時候按，直接跳到這段的終點。
按 →：最後一個停點就是縮圖、預覽、匯出看到的畫面。`,
  `講者視窗和觀眾畫面透過 BroadcastChannel 溝通。
按 →：講者送 next，觀眾翻頁。
按 →：觀眾回報 state。
按 →：不經過 dev server。講者視窗的內容是示意。`,
  `留言的一圈：留言 → 原始碼標記 → agent → 熱更新。
每按一次 → 走一段。`,
  `三種匯出，每按一次 → 交一種。`,
  `全部一起跑一次，最後收在三句話。`,
];

export default [
  Cover,
  MapPage,
  WritePage,
  HotPage,
  EditPage,
  CanvasPage,
  PressPage,
  SyncPage,
  LoopPage,
  ExportPage,
  FinalePage,
] satisfies Page[];
