import { describe, it, expect } from 'vitest';
import {
  EMPTY_BATCH_FORM,
  getBatchFormValidity,
  getBatchFormErrorMessage,
  type BatchFormData,
} from '@/domains/inventory/components/batchFormValidation';

const filledForm: BatchFormData = {
  ...EMPTY_BATCH_FORM,
  batchCode: 'B-1',
  quantity: 10,
  mrp: 100,
  costPrice: 50,
  sellingPrice: 80,
};

describe('getBatchFormValidity', () => {
  it('accepts a fully filled-in form', () => {
    const validity = getBatchFormValidity(filledForm, { quantityMustBePositive: true });
    expect(validity.formInvalid).toBe(false);
  });

  it('rejects a batch with MRP, Cost Price, and Selling Price all blank instead of defaulting to ₹0', () => {
    const validity = getBatchFormValidity(EMPTY_BATCH_FORM, { quantityMustBePositive: true });
    expect(validity.mrpInvalid).toBe(true);
    expect(validity.costPriceInvalid).toBe(true);
    expect(validity.sellingPriceInvalid).toBe(true);
    expect(validity.formInvalid).toBe(true);
  });

  it('requires quantity greater than zero for a new batch', () => {
    const validity = getBatchFormValidity({ ...filledForm, quantity: 0 }, { quantityMustBePositive: true });
    expect(validity.qtyInvalid).toBe(true);
    expect(validity.formInvalid).toBe(true);
  });

  it('allows a zero quantity when editing an existing batch (retiring stock)', () => {
    const validity = getBatchFormValidity({ ...filledForm, quantity: 0 }, { quantityMustBePositive: false });
    expect(validity.qtyInvalid).toBe(false);
    expect(validity.formInvalid).toBe(false);
  });

  it('rejects selling price above MRP', () => {
    const validity = getBatchFormValidity({ ...filledForm, sellingPrice: 150 }, { quantityMustBePositive: true });
    expect(validity.sellingAboveMrp).toBe(true);
    expect(validity.formInvalid).toBe(true);
  });

  it('rejects selling price below cost price', () => {
    const validity = getBatchFormValidity({ ...filledForm, sellingPrice: 10 }, { quantityMustBePositive: true });
    expect(validity.sellingBelowCost).toBe(true);
    expect(validity.formInvalid).toBe(true);
  });

  it('requires wholesale price and min qty only when wholesale is enabled', () => {
    const disabled = getBatchFormValidity(
      { ...filledForm, wholesaleEnabled: false, wholesalePrice: '', wholesaleMinQty: '' },
      { quantityMustBePositive: true }
    );
    expect(disabled.wholesaleInvalid).toBe(false);

    const enabledButBlank = getBatchFormValidity(
      { ...filledForm, wholesaleEnabled: true, wholesalePrice: '', wholesaleMinQty: '' },
      { quantityMustBePositive: true }
    );
    expect(enabledButBlank.wholesaleInvalid).toBe(true);
    expect(enabledButBlank.formInvalid).toBe(true);

    const enabledAndFilled = getBatchFormValidity(
      { ...filledForm, wholesaleEnabled: true, wholesalePrice: 40, wholesaleMinQty: 5 },
      { quantityMustBePositive: true }
    );
    expect(enabledAndFilled.wholesaleInvalid).toBe(false);
    expect(enabledAndFilled.formInvalid).toBe(false);
  });
});

describe('getBatchFormErrorMessage', () => {
  it('returns null when the form is valid', () => {
    const validity = getBatchFormValidity(filledForm, { quantityMustBePositive: true });
    expect(getBatchFormErrorMessage(validity, filledForm, { quantityMustBePositive: true })).toBeNull();
  });

  it('surfaces a message for a blank MRP so the save handler and Save button agree with each other', () => {
    const validity = getBatchFormValidity(EMPTY_BATCH_FORM, { quantityMustBePositive: true });
    const message = getBatchFormErrorMessage(validity, EMPTY_BATCH_FORM, { quantityMustBePositive: true });
    expect(message).not.toBeNull();
    // The same `validity.formInvalid` a caller uses to disable the Save
    // button is what gated this message — they cannot disagree by
    // construction, since both come from a single getBatchFormValidity call.
    expect(validity.formInvalid).toBe(true);
  });
});
