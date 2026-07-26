import { z, id, int, num, str, bool, looseObject } from '../../shared/middleware/zodHelpers';

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
