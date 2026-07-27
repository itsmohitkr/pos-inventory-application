/**
 * Shared shapes for the inventory domain.
 *
 * Product, Batch and CategoryNode are defined once in shared/types/models.ts
 * — several domains outside inventory read them — and re-exported here so
 * existing imports keep working.
 */

export type { Batch, CategoryNode, Product } from '@/shared/types/models';


