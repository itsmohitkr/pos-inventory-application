/**
 * Shared batch-form data shape and validation for the New Batch and Edit
 * Batch Details inline forms. Single source of truth used by BatchFormFields
 * (field-level error display), the Save-button disabled gate, and the save
 * handlers themselves — previously each of those three re-derived the same
 * checks independently and disagreed with each other (a batch could be
 * created with MRP/Cost/Selling all blank since none of the three copies
 * actually required them, only range-checked when non-zero).
 */

/** Bound to text/number inputs; starts as '' and is written back as a
 * number by discount-calculation handlers. */
export type BatchFormValue = string | number;

export interface BatchFormData {
  batchCode: string;
  quantity: BatchFormValue;
  mrp: BatchFormValue;
  costPrice: BatchFormValue;
  sellingPrice: BatchFormValue;
  wholesaleEnabled: boolean;
  wholesalePrice: BatchFormValue;
  wholesaleMinQty: BatchFormValue;
  expiryDate: string;
}

export const EMPTY_BATCH_FORM: BatchFormData = {
  batchCode: '',
  quantity: '',
  mrp: '',
  costPrice: '',
  sellingPrice: '',
  wholesaleEnabled: false,
  wholesalePrice: '',
  wholesaleMinQty: '',
  expiryDate: '',
};

export interface BatchFormValidity {
  mrpInvalid: boolean;
  costPriceInvalid: boolean;
  sellingPriceInvalid: boolean;
  sellingBelowCost: boolean;
  sellingAboveMrp: boolean;
  sellingInvalid: boolean;
  qtyInvalid: boolean;
  wholesaleInvalid: boolean;
  formInvalid: boolean;
}

/**
 * `quantityMustBePositive`: true for New Batch (a batch must start with
 * stock), false for Edit Batch (0 is legitimate — that's how a batch gets
 * retired). Empty/negative/NaN quantity is invalid either way.
 */
export const getBatchFormValidity = (
  formData: BatchFormData,
  { quantityMustBePositive }: { quantityMustBePositive: boolean }
): BatchFormValidity => {
  const mrp = Number(formData.mrp);
  const costPrice = Number(formData.costPrice);
  const sellingPrice = Number(formData.sellingPrice);
  const quantity = Number(formData.quantity);

  const mrpInvalid = formData.mrp === '' || isNaN(mrp) || mrp < 0;
  const costPriceInvalid = formData.costPrice === '' || isNaN(costPrice) || costPrice < 0;
  const sellingPriceInvalid = formData.sellingPrice === '' || isNaN(sellingPrice) || sellingPrice < 0;

  const sellingBelowCost = !costPriceInvalid && !sellingPriceInvalid && sellingPrice < costPrice;
  const sellingAboveMrp = !mrpInvalid && !sellingPriceInvalid && sellingPrice > mrp;
  const sellingInvalid = sellingBelowCost || sellingAboveMrp;

  const qtyInvalid =
    formData.quantity === '' ||
    isNaN(quantity) ||
    quantity < 0 ||
    (quantityMustBePositive && quantity <= 0);

  const wholesaleInvalid =
    Boolean(formData.wholesaleEnabled) &&
    (!formData.wholesalePrice ||
      Number(formData.wholesalePrice) <= 0 ||
      !formData.wholesaleMinQty ||
      Number(formData.wholesaleMinQty) <= 0);

  const formInvalid =
    mrpInvalid || costPriceInvalid || sellingPriceInvalid || sellingInvalid || qtyInvalid || wholesaleInvalid;

  return {
    mrpInvalid,
    costPriceInvalid,
    sellingPriceInvalid,
    sellingBelowCost,
    sellingAboveMrp,
    sellingInvalid,
    qtyInvalid,
    wholesaleInvalid,
    formInvalid,
  };
};

export const getBatchFormErrorMessage = (
  validity: BatchFormValidity,
  formData: BatchFormData,
  { quantityMustBePositive }: { quantityMustBePositive: boolean }
): string | null => {
  if (validity.qtyInvalid) {
    if (formData.quantity === '') return 'Quantity is required';
    if (quantityMustBePositive) return 'Quantity is required and must be greater than zero';
    return 'Quantity must be zero or greater';
  }
  if (validity.mrpInvalid) return 'MRP is required and must be zero or greater';
  if (validity.costPriceInvalid) return 'Cost Price is required and must be zero or greater';
  if (validity.sellingPriceInvalid) return 'Selling Price is required and must be zero or greater';
  if (validity.sellingBelowCost) return 'Invalid pricing: Selling Price must be ≥ Cost Price';
  if (validity.sellingAboveMrp) return 'Invalid pricing: Selling Price must be ≤ MRP';
  if (validity.wholesaleInvalid) {
    return 'Wholesale Price and Minimum Quantity are required and must be greater than zero when wholesale is enabled';
  }
  return null;
};
