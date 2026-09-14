import { describe, expect, it } from 'vitest';
import {
  APP_ANDROID_DOWNLOAD_URL,
  detectarPlataforma,
} from '../src/config/appDownload';

describe('download do aplicativo', () => {
  it('mantém a URL oficial atual do APK Android', () => {
    expect(APP_ANDROID_DOWNLOAD_URL).toBe(
      'https://pub-2b70722df74e452daa43c450bd639a7b.r2.dev/android/v1.0/liste-e-compre-v1.0.apk',
    );
  });

  it('detecta Android', () => {
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36',
      ),
    ).toBe('android');
  });

  it('detecta iPhone e iPadOS', () => {
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      ),
    ).toBe('ios');
    expect(detectarPlataforma('Mozilla/5.0', 'MacIntel', 5)).toBe('ios');
  });

  it('trata navegadores de desktop como desktop', () => {
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ),
    ).toBe('desktop');
  });
});
