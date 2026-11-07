import { useState, useEffect } from 'react';

export type OperatingSystem = 'ios' | 'android' | 'macos' | 'windows' | 'other';

export interface DeviceInfo {
  os: OperatingSystem;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  storeName: string;
  storeUrl: string;
  storeBadgeLabel: string;
}

export function useSmartDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    os: 'ios',
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    storeName: 'App Store',
    storeUrl: 'https://apps.apple.com/app/pulse-fitness-os/id1649281034',
    storeBadgeLabel: 'Download on the App Store',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

    let os: OperatingSystem = 'other';
    let isMobile = false;

    if (/iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      os = 'ios';
      isMobile = true;
    } else if (/android/i.test(userAgent)) {
      os = 'android';
      isMobile = true;
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) || /Mac OS X/i.test(userAgent)) {
      os = 'macos';
      isMobile = false;
    } else if (/Win32|Win64|Windows|WinCE/i.test(platform) || /Windows/i.test(userAgent)) {
      os = 'windows';
      isMobile = false;
    }

    const isIOS = os === 'ios';
    const isAndroid = os === 'android';

    const storeName = isAndroid ? 'Google Play' : 'App Store';
    const storeUrl = isAndroid
      ? 'https://play.google.com/store/apps/details?id=com.pulsefit.app'
      : 'https://apps.apple.com/app/pulse-fitness-os/id1649281034';
    const storeBadgeLabel = isAndroid ? 'Get it on Google Play' : 'Download on the App Store';

    setDeviceInfo({
      os,
      isMobile,
      isIOS,
      isAndroid,
      storeName,
      storeUrl,
      storeBadgeLabel,
    });
  }, []);

  return deviceInfo;
}
