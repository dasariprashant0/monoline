import {useEffect, useLayoutEffect} from 'react';

/** `useLayoutEffect` in the browser, `useEffect` on the server: React 18 warns when a layout effect is rendered on the server. */
export const useIsoLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
