import { z, id, str } from '../../shared/middleware/zodHelpers';

const categoryIdParamSchema = z.object({
  id: id(),
});

const createCategoryBodySchema = z.object({
  name: str().min(1).max(120),
  parentId: z.union([id(), z.null(), z.string()]).optional(),
});

const updateCategoryBodySchema = z.object({
  name: str().min(1).max(120),
});

export { categoryIdParamSchema, createCategoryBodySchema, updateCategoryBodySchema };
