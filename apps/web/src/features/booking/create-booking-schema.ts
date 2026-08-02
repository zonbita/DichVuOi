import { z } from 'zod';

const phoneRegex = /^(0|\+84)\d{8,10}$/;

/** Ngưỡng ngân sách: trên mức này cọc ứng tuyển tối thiểu 50%. */
export const APPLY_DEPOSIT_BUDGET_THRESHOLD = 5_000_000;

/** Khoảng % cọc ứng tuyển theo ngân sách tối đa. */
export function applyDepositPercentBounds(budgetMax: number) {
  if (budgetMax > APPLY_DEPOSIT_BUDGET_THRESHOLD) {
    return { min: 50, max: 100, defaultPercent: 50 };
  }
  return { min: 0, max: 50, defaultPercent: 10 };
}

export function clampApplyDepositPercent(percent: number, budgetMax: number) {
  const { min, max } = applyDepositPercentBounds(budgetMax);
  return Math.min(max, Math.max(min, Math.round(percent)));
}

/** Giá trị cho `<input type="datetime-local">` theo giờ máy local. */
export function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Mặc định = thời điểm hiện tại (làm tròn phút; +1 phút nếu vừa trôi qua giây). */
export function defaultScheduledAtLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  if (d.getTime() < Date.now()) d.setMinutes(d.getMinutes() + 1);
  return toDatetimeLocalValue(d);
}

export const createBookingSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Họ tên cần ít nhất 2 ký tự'),
  customerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  customerEmail: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .min(5, 'Địa chỉ cần ít nhất 5 ký tự'),
  scheduledAt: z
    .string()
    .min(1, 'Chọn thời gian hẹn')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Thời gian không hợp lệ',
    })
    .refine((value) => new Date(value).getTime() >= Date.now() - 60_000, {
      message: 'Thời gian hẹn không được ở quá khứ',
    }),
  note: z.string().trim().optional(),
});

export type CreateBookingFormValues = z.infer<typeof createBookingSchema>;

export const hireServiceSchema = createBookingSchema
  .extend({
    serviceSlug: z.string().min(1, 'Chọn nghề cần thuê'),
    budgetMin: z.number().int().min(0, 'Giá tối thiểu không hợp lệ'),
    budgetMax: z.number().int().min(0, 'Giá tối đa không hợp lệ'),
    applyDepositPercent: z
      .number()
      .int('Chọn số nguyên')
      .min(0, 'Tối thiểu 0%')
      .max(100, 'Tối đa 100%'),
  })
  .refine((data) => data.budgetMin <= data.budgetMax, {
    message: 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu',
    path: ['budgetMax'],
  })
  .superRefine((data, ctx) => {
    const { min, max } = applyDepositPercentBounds(data.budgetMax);
    if (data.applyDepositPercent < min || data.applyDepositPercent > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyDepositPercent'],
        message:
          data.budgetMax > APPLY_DEPOSIT_BUDGET_THRESHOLD
            ? `Ngân sách trên 5 triệu: cọc ứng tuyển từ ${min}% đến ${max}%`
            : `Ngân sách từ 5 triệu trở xuống: cọc ứng tuyển từ ${min}% đến ${max}%`,
      });
    }
  });

export type HireServiceFormValues = z.infer<typeof hireServiceSchema>;
