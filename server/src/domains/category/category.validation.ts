import { z, id, str, idParamSchema } from '../../shared/middleware/zodHelpers';

const categoryIdParamSchema = idParamSchema();

const createCategoryBodySchema = z.object({
  name: str().min(1).max(120),
  parentId: z.union([id(), z.null(), z.string()]).optional(),
});

const updateCategoryBodySchema = z.object({
  name: str().min(1).max(120),
});

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateCategoryInput = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryBodySchema>;

export { categoryIdParamSchema, createCategoryBodySchema, updateCategoryBodySchema };
