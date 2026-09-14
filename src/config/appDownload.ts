export const APP_ANDROID_DOWNLOAD_URL =
  'https://pub-2b70722df74e452daa43c450bd639a7b.r2.dev/android/v1.0/liste-e-compre-v1.0.apk';

export type PlataformaAcesso = 'android' | 'ios' | 'desktop';

export function detectarPlataforma(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  platform = typeof navigator === 'undefined' ? '' : navigator.platform,
  maxTouchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
): PlataformaAcesso {
  if (/android/i.test(userAgent)) return 'android';

  const iosClassico = /iPad|iPhone|iPod/i.test(userAgent);
  const ipadOS = platform === 'MacIntel' && maxTouchPoints > 1;
  if (iosClassico || ipadOS) return 'ios';

  return 'desktop';
}
