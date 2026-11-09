import { SHARED_ENUMS } from '@dichvuoi/shared';
import * as Prisma from '../database/prisma/client';

/**
 * `@dichvuoi/shared` khai báo lại enum Prisma để web dùng được.
 * Test này fail ngay khi schema.prisma đổi mà package shared chưa cập nhật.
 */
describe('@dichvuoi/shared enums', () => {
  const prismaEnums = Prisma as unknown as Record<
    string,
    Record<string, string> | undefined
  >;

  it.each(Object.entries(SHARED_ENUMS))(
    '%s matches the Prisma enum',
    (name, values) => {
      const prismaEnum = prismaEnums[name];
      expect(prismaEnum).toBeDefined();
      expect([...values].sort()).toEqual(
        Object.values(prismaEnum ?? {}).sort(),
      );
    },
  );
});
