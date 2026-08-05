import { z, id, str, idParamSchema } from '../../shared/middleware/zodHelpers';

/** Shared by UpdateCategory and DeleteCategory. */
const categoryIdParamSchema = idParamSchema();

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreateCategorySchema = {
  body: z.object({
    name: str().min(1, 'Category name is required').max(120, 'Category name is too long'),
    parentId: z.union([id(), z.null(), z.string()]).optional(),
  }),
};

export const UpdateCategorySchema = {
  params: categoryIdParamSchema,
  body: z.object({
    name: str().min(1, 'Category name is required').max(120, 'Category name is too long'),
  }),
};

export const DeleteCategorySchema = { params: categoryIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema.body>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema.body>;
