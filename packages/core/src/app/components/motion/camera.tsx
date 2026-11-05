import type { ReactNode } from 'react';
import type { Point } from '../../lib/motion';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/sdk';

export type CameraProps = {
  x: number;
  y: number;
  scale: number;
  anchor?: Point;
  children: ReactNode;
};

export function Camera({
  x,
  y,
  scale,
  anchor = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2],
  children,
}: CameraProps) {
  return (
    <div
      data-osd-camera=""
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        transformOrigin: '0 0',
        transform: `translate(${anchor[0] - x * scale}px, ${anchor[1] - y * scale}px) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}
