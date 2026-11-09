import { z } from 'zod';
import { DEFAULT_PROVINCE_SLUG, findProvince } from '../../data/provinces';

export const phoneRegex = /^(0|\+84)\d{8,10}$/;
export const defaultCity = findProvince(DEFAULT_PROVINCE_SLUG).name;

export const profileSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  bio: z.string().max(2000).optional(),
  city: z.string().min(1, 'Chọn tỉnh / thành phố'),
});

/** `z.coerce` khiến giá trị vào form (input) khác giá trị đã parse (output). */
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;
