export type { ImagePlaceholderProps } from './app/components/image-placeholder.tsx';
export { ImagePlaceholder } from './app/components/image-placeholder.tsx';
export type { MorphElementProps } from './app/components/morph-element.tsx';
export { MorphElement } from './app/components/morph-element.tsx';
export type { CameraProps } from './app/components/motion/camera.tsx';
export { Camera } from './app/components/motion/camera.tsx';
export type { CodeMoveProps } from './app/components/motion/code-move.tsx';
export { CodeMove } from './app/components/motion/code-move.tsx';
export type { ConnectorProps, PacketProps } from './app/components/motion/connector.tsx';
export { Connector, Packet } from './app/components/motion/connector.tsx';
export type { CountUpProps } from './app/components/motion/count-up.tsx';
export { CountUp } from './app/components/motion/count-up.tsx';
export type { CursorProps, CursorWaypoint } from './app/components/motion/cursor.tsx';
export { Cursor } from './app/components/motion/cursor.tsx';
export type { FlightProps } from './app/components/motion/flight.tsx';
export { Flight } from './app/components/motion/flight.tsx';
export type { HeadlineProps } from './app/components/motion/headline.tsx';
export { Headline } from './app/components/motion/headline.tsx';
export type { MarkProps, MarkType } from './app/components/motion/mark.tsx';
export { Mark } from './app/components/motion/mark.tsx';
export type { RollTextProps } from './app/components/motion/roll-text.tsx';
export { RollText } from './app/components/motion/roll-text.tsx';
export type { TypedTextProps } from './app/components/motion/typed-text.tsx';
export { TypedText } from './app/components/motion/typed-text.tsx';
export type {
  DesignFonts,
  DesignPalette,
  DesignSystem,
  DesignTypeScale,
} from './app/lib/design.ts';
export { cssVarsToString, defaultDesign, designToCssVars } from './app/lib/design.ts';
export type { Easing, Keyframe, Point, TextSegment } from './app/lib/motion.ts';
export {
  along,
  charCount,
  clamp01,
  curvePath,
  curvePoint,
  defocus,
  easeInOut,
  easeOut,
  expoOut,
  keyframes,
  lerp,
  overshoot,
  phaseAt,
  progress,
  pulse,
  ramp,
  spring,
  TYPING_CPS,
  typedChars,
  typingDuration,
  zoomDuration,
} from './app/lib/motion.ts';
export { useSlidePageNumber } from './app/lib/page-context.tsx';
export type { Page, SlideMeta, SlideModule } from './app/lib/sdk.ts';
export { CANVAS_HEIGHT, CANVAS_WIDTH } from './app/lib/sdk.ts';
export type { StepProps, StepsProps } from './app/lib/step-context.tsx';
export { Step, Steps, useIsActivePage } from './app/lib/step-context.tsx';
export type {
  MorphTransition,
  SlideTransition,
  TransitionPhase,
} from './app/lib/transition.ts';
export type { Timeline } from './app/lib/use-timeline.ts';
export { useTimeline } from './app/lib/use-timeline.ts';
export type { OpenSlideAgentConfig, OpenSlideConfig } from './config.ts';
export type { Locale, Plural } from './locale/types.ts';
