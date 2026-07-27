import { z, id, num, str } from '../../shared/middleware/zodHelpers';

const looseSaleIdParamSchema = z.object({
  id: z.union([id(), str().regex(/^\d+$/)]),
});

const createLooseSaleBodySchema = z.object({
  itemName: str().nullable().optional(),
  price: num().positive(),
});

const looseSalesReportQuerySchema = z.object({
  startDate: z.union([z.coerce.date(), str()]).optional(),
  endDate: z.union([z.coerce.date(), str()]).optional(),
});

export { looseSaleIdParamSchema, createLooseSaleBodySchema, looseSalesReportQuerySchema };
