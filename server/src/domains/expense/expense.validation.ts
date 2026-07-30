import { z, id, num, str } from '../../shared/middleware/zodHelpers';

const moneyValue = () => num().min(0);

const expenseIdParamSchema = z.object({ id: id() });

const expenseQuerySchema = z.looseObject({
  startDate: z.union([z.coerce.date(), str()]).optional(),
  endDate: z.union([z.coerce.date(), str()]).optional(),
  category: str().nullable().optional(),
});

const expenseBodySchema = z.object({
  amount: moneyValue(),
  category: str().min(1).max(120),
  description: z.string().nullable().optional(),
  date: z.union([z.coerce.date(), str().min(1)]).optional(),
  paidAmount: moneyValue().optional(),
  paymentMethod: str().nullable().optional(),
  // NOT nullable: Expense.paymentStatus is a non-nullable String column with a
  // default. A `null` here previously passed validation and would have reached
  // Prisma as a null write to a required field.
  paymentStatus: str().optional(),
});

// Joi's .min(1) on an all-optional object — at least one field must be present.
const expenseUpdateBodySchema = z
  .object({
    amount: moneyValue().optional(),
    category: str().min(1).max(120).optional(),
    description: z.string().nullable().optional(),
    date: z.union([z.coerce.date(), str().min(1)]).optional(),
    paidAmount: moneyValue().optional(),
    paymentMethod: str().nullable().optional(),
    // NOT nullable: Expense.paymentStatus is a non-nullable String column with a
  // default. A `null` here previously passed validation and would have reached
  // Prisma as a null write to a required field.
  paymentStatus: str().optional(),
  })
  .refine((v) => Object.keys(v).length >= 1, {
    message: 'at least one field is required',
  });

const paymentBodySchema = z.object({
  amount: moneyValue(),
  date: z.union([z.coerce.date(), str().min(1)]).optional(),
  note: z.string().nullable().optional(),
  paymentMethod: str().nullable().optional(),
});

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateExpenseInput = z.infer<typeof expenseBodySchema>;
export type UpdateExpenseInput = z.infer<typeof expenseUpdateBodySchema>;
export type ExpensePaymentInput = z.infer<typeof paymentBodySchema>;

export {
  expenseIdParamSchema,
  expenseQuerySchema,
  expenseBodySchema,
  expenseUpdateBodySchema,
  paymentBodySchema,
};
