import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// VitalTwin brand mark, simplified static heart for the browser favicon
// (see docs/BRAND_GUIDE.md). The full animated "Im Takt" mark lives in
// app/components/brand/VitalTwinMark.tsx.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5EFE1',
          borderRadius: 6,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 100 78" fill="none">
          <path
            d="M50 66 C50 66 24 48 24 30 C24 20 32 12 42 12 C46 12 50 15 50 15 C50 15 54 12 58 12 C68 12 76 20 76 30 C76 48 50 66 50 66 Z"
            fill="#C9A24B"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
