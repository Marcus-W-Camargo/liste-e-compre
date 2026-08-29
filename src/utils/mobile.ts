const CONSULTA_MOBILE = '(max-width: 760px)';

export function viewportMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(CONSULTA_MOBILE).matches;
}
