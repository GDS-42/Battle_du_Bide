import { describe, expect, it } from 'vitest';
import { isAllowedPushEndpoint } from './push-endpoint';

describe('isAllowedPushEndpoint (anti-SSRF)', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc:APA91b',
    'https://fcm.googleapis.com/wp/abc',
    'https://android.googleapis.com/gcm/send/abc',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
    'https://web.push.apple.com/QGuQyavXutnMH',
    'https://wns2-par02p.notify.windows.com/w/?token=BQYAAA',
    'https://FCM.GoogleAPIs.com/fcm/send/abc',
    'https://fcm.googleapis.com:443/fcm/send/abc'
  ])('accepte un service push de navigateur : %s', (url) => {
    expect(isAllowedPushEndpoint(url)).toBe(true);
  });

  it.each([
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://localhost/x',
    'https://127.0.0.1/x',
    'https://[::1]/x',
    'http://169.254.169.254/latest/meta-data/',
    'https://db:5432/',
    'https://fcm.googleapis.com.evil.example/x',
    'https://evilfcm.googleapis.com/x',
    'https://notify.windows.com.evil.example/x',
    'https://evil.example/fcm.googleapis.com',
    'https://user:pass@fcm.googleapis.com/x',
    'https://fcm.googleapis.com:8443/x',
    'ftp://fcm.googleapis.com/x',
    'pas une url',
    '',
    `https://fcm.googleapis.com/${'a'.repeat(2100)}`
  ])('refuse : %s', (url) => {
    expect(isAllowedPushEndpoint(url)).toBe(false);
  });

  it('refuse ce qui n’est pas une chaîne', () => {
    expect(isAllowedPushEndpoint(null)).toBe(false);
    expect(isAllowedPushEndpoint({ href: 'https://fcm.googleapis.com/x' })).toBe(false);
  });
});
