/**
 * The selectable range for a batch's expiry date input — today through
 * 10 years out. A batch's expiry date must describe a future spoilage
 * point, not document that stock is already expired (that's handled by
 * removing/writing off stock, not by backdating this field).
 */
export const getExpiryDateInputBounds = (): { min: string; max: string } => {
  const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

  const min = new Date();
  const max = new Date();
  max.setFullYear(max.getFullYear() + 10);

  return { min: toIsoDate(min), max: toIsoDate(max) };
};
