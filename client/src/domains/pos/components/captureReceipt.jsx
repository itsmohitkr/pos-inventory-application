import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';
import Receipt from '@/domains/pos/components/Receipt';
import whatsappService from '@/shared/api/whatsappService';

/**
 * Dynamically renders the Receipt component off-screen, captures it as a PNG,
 * and sends it via WhatsApp using the backend captured-card route.
 */
export const captureAndSendReceipt = async (sale, customer, shopName, receiptSettings, shopMetadata) => {
  if (!customer?.phone) {
    throw new Error('Customer does not have a valid phone number.');
  }

  // 1. Create a hidden container in the DOM
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  // Ensure it has a white background so html-to-image captures it properly
  container.style.backgroundColor = 'white';
  document.body.appendChild(container);

  try {
    // 2. Render the Receipt component synchronously
    const root = createRoot(container);
    flushSync(() => {
      root.render(
        <Receipt 
          sale={sale} 
          settings={receiptSettings} 
          shopMetadata={shopMetadata || {}} 
        />
      );
    });

    // 3. Wait a brief moment to ensure fonts and layout are fully applied
    await new Promise((resolve) => setTimeout(resolve, 300));

    // The Receipt component renders a root Box with id="receipt-container".
    const receiptElement = container.firstChild;
    if (!receiptElement) {
      throw new Error('Failed to render receipt element for capture.');
    }

    // 4. Capture the element as a high-quality PNG
    const dataUrl = await toPng(receiptElement, { 
      cacheBust: true, 
      pixelRatio: 2,
      backgroundColor: 'white' 
    });

    // 5. Send to WhatsApp
    const caption = `🧾 Your receipt from ${shopName || 'Bachat Bazar'} (Sale #${sale.id})\nThank you for shopping!`;
    
    await whatsappService.sendCapturedCard({
      phone: customer.phone,
      base64Image: dataUrl,
      caption,
    });

    // 6. Cleanup
    root.unmount();
    return true;
  } catch (err) {
    console.error('Failed to capture and send receipt:', err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
