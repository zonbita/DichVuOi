import { z } from 'zod';

const phoneRegex = /^(0|\+84)\d{8,10}$/;

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
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: 'Thời gian hẹn phải ở tương lai',
    }),
  note: z.string().trim().optional(),
});

export type CreateBookingFormValues = z.infer<typeof createBookingSchema>;
