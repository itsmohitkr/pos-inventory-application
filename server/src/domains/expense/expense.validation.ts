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

/** Shared by UpdateExpense, DeleteExpense, AddPayment, UpdatePayment, DeletePayment. */
const expenseIdParamSchema = idParamSchema();

/** Shared by AddPayment and UpdatePayment. */
const paymentBodySchema = paymentBodySchemaFactory();

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreateExpenseSchema = {
  body: z.object({
    amount: moneyValue(),
    category: str().min(1, 'Category is required').max(120, 'Category is too long'),
    description: z.string().nullable().optional(),
    date: z.union([z.coerce.date(), str().min(1, 'Date is required')]).optional(),
    paidAmount: moneyValue().optional(),
    paymentMethod: str().nullable().optional(),
    // NOT nullable: Expense.paymentStatus is a non-nullable String column with a
    // default. A `null` here previously passed validation and would have reached
    // Prisma as a null write to a required field.
    paymentStatus: str().optional(),
  }),
};

export const GetExpensesSchema = {
  query: z.looseObject({
    ...dateRangeShape(),
    category: str().nullable().optional(),
  }),
};

export const UpdateExpenseSchema = {
  params: expenseIdParamSchema,
  // Joi's .min(1) on an all-optional object — at least one field must be present.
  body: z
    .object({
      amount: moneyValue().optional(),
      category: str().min(1, 'Category is required').max(120, 'Category is too long').optional(),
      description: z.string().nullable().optional(),
      date: z.union([z.coerce.date(), str().min(1, 'Date is required')]).optional(),
      paidAmount: moneyValue().optional(),
      paymentMethod: str().nullable().optional(),
      // NOT nullable: Expense.paymentStatus is a non-nullable String column with a
      // default. A `null` here previously passed validation and would have reached
      // Prisma as a null write to a required field.
      paymentStatus: str().optional(),
    })
    .refine(atLeastOneField, {
      message: AT_LEAST_ONE_FIELD_MESSAGE,
    }),
};

export const DeleteExpenseSchema = { params: expenseIdParamSchema };
export const AddPaymentSchema = { params: expenseIdParamSchema, body: paymentBodySchema };
export const UpdatePaymentSchema = { params: expenseIdParamSchema, body: paymentBodySchema };
export const DeletePaymentSchema = { params: expenseIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema.body>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema.body>;
export type ExpensePaymentInput = z.infer<typeof AddPaymentSchema.body>;
