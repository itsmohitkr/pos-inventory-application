import {
  z,
  str,
  idParamSchema,
  dateRangeShape,
  moneyValue,
  paymentBodySchema as paymentBodySchemaFactory,
  atLeastOneField,
  AT_LEAST_ONE_FIELD_MESSAGE,
} from '../../shared/middleware/zodHelpers';

const expenseIdParamSchema = idParamSchema();

const expenseQuerySchema = z.looseObject({
  ...dateRangeShape(),
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
  .refine(atLeastOneField, {
    message: AT_LEAST_ONE_FIELD_MESSAGE,
  });

const paymentBodySchema = paymentBodySchemaFactory();

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

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreateExpenseSchema = { body: expenseBodySchema };
export const GetExpensesSchema = { query: expenseQuerySchema };
export const UpdateExpenseSchema = { params: expenseIdParamSchema, body: expenseUpdateBodySchema };
export const DeleteExpenseSchema = { params: expenseIdParamSchema };
export const AddPaymentSchema = { params: expenseIdParamSchema, body: paymentBodySchema };
export const UpdatePaymentSchema = { params: expenseIdParamSchema, body: paymentBodySchema };
export const DeletePaymentSchema = { params: expenseIdParamSchema };
