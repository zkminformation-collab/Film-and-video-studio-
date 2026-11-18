import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import { Sparkles } from 'lucide-react';

export type LottieInteractionMode = 'loop' | 'hover' | 'click';

export interface LottieIconProps {
  src: string;
  size?: number;
  interaction?: LottieInteractionMode;
  color?: string;
  playTrigger?: number;
  className?: string;
  ariaLabel?: string;
}

export const LottieIcon: React.FC<LottieIconProps> = ({
  src,
  size = 40,
  interaction = 'hover',
  color,
  playTrigger = 0,
  className = '',
  ariaLabel = 'Animated Lottie icon',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const toggledRef = useRef<boolean>(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    if (color) {
      el.style.color = color;
    } else {
      el.style.removeProperty('color');
    }
  }, [size, color]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !src) return;

    setHasError(false);
    toggledRef.current = false;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const shouldLoop = interaction === 'loop' && !prefersReducedMotion;
    const shouldAutoplay = interaction === 'loop' && !prefersReducedMotion;

    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: shouldLoop,
      autoplay: shouldAutoplay,
      path: src,
    });

    const handleDataFailed = () => {
      setHasError(true);
    };

    anim.addEventListener('data_failed', handleDataFailed);
    animRef.current = anim;

    return () => {
      anim.removeEventListener('data_failed', handleDataFailed);
      anim.destroy();
      animRef.current = null;
    };
  }, [src, interaction]);

  useEffect(() => {
    if (playTrigger > 0 && animRef.current) {
      animRef.current.setDirection(1);
      animRef.current.goToAndPlay(0, true);
    }
  }, [playTrigger]);

  const handleMouseEnter = () => {
    if (interaction !== 'hover' || !animRef.current) return;
    animRef.current.setDirection(1);
    animRef.current.goToAndPlay(0, true);
  };

  const handleClick = () => {
    const anim = animRef.current;
    if (!anim) return;
    if (interaction === 'click') {
      const next = !toggledRef.current;
      toggledRef.current = next;
      anim.setDirection(next ? 1 : -1);
      anim.play();
    } else if (interaction === 'hover') {
      anim.setDirection(1);
      anim.goToAndPlay(0, true);
    }
  };

  if (hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg opacity-60 ${className}`}
        aria-label={ariaLabel}
      >
        <Sparkles className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={`inline-flex items-center justify-center shrink-0 select-none [&_svg]:w-full [&_svg]:h-full [&_path[stroke^='rgb']:not([stroke='rgb(255,255,255)'])]:stroke-current [&_path[fill='rgb(0,0,0)']]:fill-current ${className}`}
    />
  );
};
