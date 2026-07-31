import { z, id, str, idParamSchema } from '../../shared/middleware/zodHelpers';

const categoryIdParamSchema = idParamSchema();

const createCategoryBodySchema = z.object({
  name: str().min(1, 'Category name is required').max(120, 'Category name is too long'),
  parentId: z.union([id(), z.null(), z.string()]).optional(),
});

const updateCategoryBodySchema = z.object({
  name: str().min(1, 'Category name is required').max(120, 'Category name is too long'),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreateCategorySchema = { body: createCategoryBodySchema };
export const UpdateCategorySchema = { params: categoryIdParamSchema, body: updateCategoryBodySchema };
export const DeleteCategorySchema = { params: categoryIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema.body>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema.body>;
