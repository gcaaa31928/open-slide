import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Connector, Packet } from './connector';
import { Cursor, cursorPosition } from './cursor';
import { Flight } from './flight';
import { Headline } from './headline';
import { RollText } from './roll-text';
import { TypedText } from './typed-text';

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('TypedText', () => {
  it('shows only the characters typed so far, across colored segments', () => {
    const out = html(<TypedText t={1.25} at={1} text={[['const', '#9cc0ff'], [' x = 1']]} />);
    expect(out).toContain('>const</span>');
    expect(out).toContain('> x</span>');
    expect(out).not.toContain('= 1');
  });

  it('drops the caret once the line is finished', () => {
    const typing = html(<TypedText t={1.05} at={1} text="abc" />);
    const done = html(<TypedText t={5} at={1} text="abc" />);
    expect(typing).toContain('currentColor');
    expect(done).not.toContain('currentColor');
    expect(done).toContain('>abc</span>');
  });
});

describe('RollText', () => {
  const lines = ['first line', 'second line'];

  it('keeps the earlier line when parked exactly on the next start', () => {
    const out = html(<RollText t={2.6} at={[0, 2.6]} lines={lines} height={90} />);
    expect(out).toContain('first line');
    expect(out).not.toContain('second line');
  });

  it('rolls to the next line after its start', () => {
    const out = html(<RollText t={9} at={[0, 2.6]} lines={lines} height={90} />);
    expect(out).toContain('second line');
    expect(out).not.toContain('first line');
  });
});

describe('Packet', () => {
  const props = { at: 1, duration: 0.5, from: [0, 0], to: [100, 0] } as const;

  it('renders only while travelling', () => {
    expect(html(<Packet t={0.9} {...props} />)).toBe('');
    expect(html(<Packet t={1.25} {...props} />)).not.toBe('');
    expect(html(<Packet t={1.5} {...props} />)).toBe('');
  });
});

describe('Connector', () => {
  it('renders nothing before it starts drawing or once faded out', () => {
    expect(html(<Connector from={[0, 0]} to={[10, 10]} k={0} />)).toBe('');
    expect(html(<Connector from={[0, 0]} to={[10, 10]} k={1} fade={0} />)).toBe('');
    expect(html(<Connector from={[0, 0]} to={[10, 10]} k={0.5} />)).toContain('C 5 0, 5 10, 10 10');
  });
});

describe('Cursor', () => {
  const path = [
    [1, 0, 100],
    [2, 200, 100],
  ] as const;

  it('waits at the first waypoint, arcs between them, and rests on the last', () => {
    expect(cursorPosition(0, path)).toEqual([0, 100]);
    expect(cursorPosition(1.5, path)).toEqual([100, 60]);
    expect(cursorPosition(3, path)).toEqual([200, 100]);
  });

  it('shows a ripple only during a click', () => {
    expect(html(<Cursor t={1.2} path={path} clicks={[1.1]} />)).toContain('border-radius:50%');
    expect(html(<Cursor t={2} path={path} clicks={[1.1]} />)).not.toContain('border-radius:50%');
  });
});

describe('Flight', () => {
  const props = {
    at: 1,
    duration: 1,
    from: [0, 0] as const,
    to: [100, 0] as const,
    text: 'path: /x',
    toText: 'GET /x',
  };

  it('is only in the air between take-off and landing', () => {
    expect(html(<Flight t={0.9} {...props} />)).toBe('');
    expect(html(<Flight t={2} {...props} />)).toBe('');
  });

  it('carries the source text out and the landed text in', () => {
    expect(html(<Flight t={1.1} {...props} />)).toMatch(
      /opacity:1;transform:translateY\(0%\)">path: \/x/,
    );
    expect(html(<Flight t={1.9} {...props} />)).toMatch(
      /opacity:1;transform:translateY\(0%\)">GET \/x/,
    );
  });
});

describe('Headline', () => {
  const props = {
    at: [0, 2],
    titles: ['First title', 'Second title'],
    subs: ['first sub', 'second sub'],
    titleHeight: 120,
  };

  it('shows the first title still, with no entrance roll, so a morph can land on it', () => {
    const out = html(<Headline t={0} {...props} />);
    expect(out).toMatch(/translateY\(0%\);opacity:1[^>]*>First title/);
    expect(out).toContain('first sub');
  });

  it('keeps the earlier title when parked exactly on the next start', () => {
    const out = html(<Headline t={2} {...props} />);
    expect(out).toContain('First title');
    expect(out).not.toContain('Second title');
  });

  it('rolls both titles mid-change and lets the sub trail behind', () => {
    const out = html(<Headline t={2.05} {...props} />);
    expect(out).toContain('First title');
    expect(out).toContain('Second title');
    expect(out).toMatch(/opacity:0;transform:translateY\(12px\)[^>]*>second sub/);
  });

  it('tags the title box for a morph across pages', () => {
    expect(html(<Headline t={0} {...props} morphId="chapter-title" />)).toContain(
      'data-osd-morph="chapter-title"',
    );
  });
});
