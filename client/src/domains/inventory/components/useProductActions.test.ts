import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductActions } from '@/domains/inventory/components/useProductActions';
import type { Product } from '@/shared/types/models';

vi.mock('@/shared/api/inventoryService', () => ({
  default: {
    updateProduct: vi.fn(),
    deleteBatch: vi.fn(),
  },
}));

import inventoryService from '@/shared/api/inventoryService';

const mockedUpdateProduct = vi.mocked(inventoryService.updateProduct);
const mockedDeleteBatch = vi.mocked(inventoryService.deleteBatch);

const baseProduct: Product = {
  id: 1,
  name: 'Test Product',
  batchTrackingEnabled: false,
  lowStockThreshold: 0,
  lowStockWarningEnabled: false,
};

const setup = () => {
  const fetchProducts = vi.fn();
  const fetchSummary = vi.fn();
  const fetchCategories = vi.fn();
  const setSelectedProduct = vi.fn();
  const setSelectedProductDetails = vi.fn();
  const setSelectedProductRefresh = vi.fn();
  const showConfirm = vi.fn();
  const showError = vi.fn();
  const showNotification = vi.fn();

  const { result } = renderHook(() =>
    useProductActions(
      fetchProducts,
      fetchSummary,
      fetchCategories,
      setSelectedProduct,
      setSelectedProductDetails,
      setSelectedProductRefresh,
      showConfirm,
      showError,
      showNotification
    )
  );

  return {
    result,
    fetchProducts,
    fetchSummary,
    setSelectedProductRefresh,
    showConfirm,
    showError,
    showNotification,
  };
};

describe('useProductActions handleToggleBatchTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flips the current state when no explicit value is passed, and refreshes on success', async () => {
    mockedUpdateProduct.mockResolvedValueOnce({});
    const { result, fetchProducts, fetchSummary, setSelectedProductRefresh } = setup();

    await act(async () => {
      await result.current.handleToggleBatchTracking(baseProduct);
    });

    expect(mockedUpdateProduct).toHaveBeenCalledWith(1, { batchTrackingEnabled: true });
    expect(fetchProducts).toHaveBeenCalled();
    expect(fetchSummary).toHaveBeenCalled();
    expect(setSelectedProductRefresh).toHaveBeenCalled();
  });

  it('sends the explicit target state when one is passed', async () => {
    mockedUpdateProduct.mockResolvedValueOnce({});
    const { result } = setup();

    await act(async () => {
      await result.current.handleToggleBatchTracking(baseProduct, false);
    });

    expect(mockedUpdateProduct).toHaveBeenCalledWith(1, { batchTrackingEnabled: false });
  });

  it('sets isTogglingBatchTracking while the request is in flight and clears it after', async () => {
    let resolveUpdate: (value: unknown) => void = () => {};
    mockedUpdateProduct.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const { result } = setup();

    expect(result.current.isTogglingBatchTracking).toBe(false);

    let togglePromise!: Promise<void>;
    act(() => {
      togglePromise = result.current.handleToggleBatchTracking(baseProduct);
    });

    await waitFor(() => expect(result.current.isTogglingBatchTracking).toBe(true));

    await act(async () => {
      resolveUpdate({});
      await togglePromise;
    });

    expect(result.current.isTogglingBatchTracking).toBe(false);
  });

  it('ignores a second toggle while one is already in flight', async () => {
    let resolveUpdate: (value: unknown) => void = () => {};
    mockedUpdateProduct.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const { result } = setup();

    let firstPromise!: Promise<void>;
    act(() => {
      firstPromise = result.current.handleToggleBatchTracking(baseProduct);
    });
    await waitFor(() => expect(result.current.isTogglingBatchTracking).toBe(true));

    await act(async () => {
      await result.current.handleToggleBatchTracking(baseProduct, false);
    });

    expect(mockedUpdateProduct).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate({});
      await firstPromise;
    });
  });

  it('shows an error and still clears the in-flight flag when the request fails', async () => {
    mockedUpdateProduct.mockRejectedValueOnce(new Error('network error'));
    const { result, showError } = setup();

    await act(async () => {
      await result.current.handleToggleBatchTracking(baseProduct, true);
    });

    expect(showError).toHaveBeenCalledWith(expect.stringContaining('Failed to update batch tracking'));
    expect(result.current.isTogglingBatchTracking).toBe(false);
  });
});

describe('useProductActions handleBatchDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when the user cancels the confirm dialog', async () => {
    const { result, showConfirm } = setup();
    showConfirm.mockResolvedValueOnce(false);

    await act(async () => {
      await result.current.handleBatchDelete(1);
    });

    expect(mockedDeleteBatch).not.toHaveBeenCalled();
  });

  it('refreshes and shows no extra message for a plain (hard) delete', async () => {
    const { result, showConfirm, fetchProducts, fetchSummary, showNotification } = setup();
    showConfirm.mockResolvedValueOnce(true);
    mockedDeleteBatch.mockResolvedValueOnce({ data: { softDeleted: false } });

    await act(async () => {
      await result.current.handleBatchDelete(1);
    });

    expect(mockedDeleteBatch).toHaveBeenCalledWith(1);
    expect(fetchProducts).toHaveBeenCalled();
    expect(fetchSummary).toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('shows a retire-specific success message when the batch was soft-deleted', async () => {
    const { result, showConfirm, showNotification } = setup();
    showConfirm.mockResolvedValueOnce(true);
    mockedDeleteBatch.mockResolvedValueOnce({ data: { softDeleted: true } });

    await act(async () => {
      await result.current.handleBatchDelete(1);
    });

    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('retired'));
  });

  it('shows an error when deletion fails, e.g. the batch still has stock', async () => {
    const { result, showConfirm, showError } = setup();
    showConfirm.mockResolvedValueOnce(true);
    mockedDeleteBatch.mockRejectedValueOnce(new Error('This batch still has 5 unit(s) in stock.'));

    await act(async () => {
      await result.current.handleBatchDelete(1);
    });

    expect(showError).toHaveBeenCalledWith(expect.stringContaining('Failed to delete batch'));
  });
});
