'use client';
import {forwardRef, useState, type CSSProperties, type HTMLAttributes} from 'react';
import {cx} from '../../utils/cx';

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds for one full loop. */
  duration?: number | undefined;
  /** Scroll to the right instead of the left. Default false. */
  reverse?: boolean | undefined;
  /** Stop when the pointer is over it or focus is inside. Default true. */
  pauseOnHover?: boolean | undefined;
  /** Show a Pause / Play button so keyboard and touch users can stop the motion (WCAG 2.2.2). Default true; set false only where the motion is purely decorative and you offer another way to stop it. */
  pausable?: boolean | undefined;
}

/** Children scroll left (or right with `reverse`). Keep the items short. */
export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  {duration = 30, reverse, pauseOnHover = true, pausable = true, className, style, children, ...rest},
  ref,
) {
  const [paused, setPaused] = useState(false);
  return (
    <div
      ref={ref}
      data-paused={paused || undefined}
      className={cx(
        'marquee',
        reverse && 'marquee-reverse',
        pauseOnHover && 'marquee-pause',
        pausable && 'marquee-controlled',
        className,
      )}
      style={{'--marquee-duration': `${duration}s`, ...style} as CSSProperties}
      {...rest}
    >
      {pausable && (
        <button type="button" className="marquee-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? 'Play' : 'Pause'}
          <span className="sr-only"> scrolling</span>
        </button>
      )}
      <div className="marquee-track">{children}</div>
      <div className="marquee-track" aria-hidden="true">
        {children}
      </div>
    </div>
  );
});
