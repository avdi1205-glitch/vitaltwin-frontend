import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon — VitalTwin brand mark (see docs/BRAND_GUIDE.md).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2A2E2E',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 78" fill="none">
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
