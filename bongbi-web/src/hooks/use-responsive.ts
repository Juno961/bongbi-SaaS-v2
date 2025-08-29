import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
  sm: 560,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    isMobile: width < BREAKPOINTS.sm,
    isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isDesktop: width >= BREAKPOINTS.md,
    breakpoints: BREAKPOINTS,
  };
}

export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS) {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
}
