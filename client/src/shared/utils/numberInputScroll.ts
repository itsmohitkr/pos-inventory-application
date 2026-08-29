import type { WheelEvent } from 'react';

/**
 * Blurs a number input on mouse-wheel scroll. Chrome/Electron's default
 * behavior silently increments/decrements a focused number input's value on
 * scroll, which is easy to trigger by accident while scrolling the page
 * past the field — this makes scrolling a no-op there instead, same as any
 * other input type.
 */
export const blurNumberInputOnWheel = (event: WheelEvent<HTMLInputElement>) => {
  event.currentTarget.blur();
};
