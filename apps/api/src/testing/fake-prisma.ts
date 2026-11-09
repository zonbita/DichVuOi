/**
 * In-memory fake of the subset of PrismaClient used by money-flow services.
 *
 * - Each model is a list of plain records with an `id`.
 * - `where` supports equality, `{ gte, lte, gt, lt, not, in }` and compound
 *   unique keys (e.g. `bookingId_partnerId: { bookingId, partnerId }`).
 * - `data` supports `{ increment, decrement }`; `undefined` fields are ignored
 *   (same as Prisma). Nested writes / `include` / `select` are not modelled:
 *   records are returned whole (copies).
 * - `$transaction(cb)` calls `cb` with the same fake as `tx` (no rollback).
 */

type Row = Record<string, any>;

function matchValue(actual: any, cond: any): boolean {
  if (
    cond !== null &&
    typeof cond === 'object' &&
    !(cond instanceof Date) &&
    !Array.isArray(cond)
  ) {
    if ('gte' in cond && !(actual >= cond.gte)) return false;
    if ('lte' in cond && !(actual <= cond.lte)) return false;
    if ('gt' in cond && !(actual > cond.gt)) return false;
    if ('lt' in cond && !(actual < cond.lt)) return false;
    if ('in' in cond && !cond.in.includes(actual)) return false;
    if ('not' in cond && actual === cond.not) return false;
    if ('equals' in cond && actual !== cond.equals) return false;
    return true;
  }
  if (cond instanceof Date) {
    return actual instanceof Date && actual.getTime() === cond.getTime();
  }
  return actual === cond;
}

export function matchWhere(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (cond === undefined) return true;
    // compound unique key: `a_b: { a, b }`
    if (
      !(key in row) &&
      key.includes('_') &&
      cond &&
      typeof cond === 'object' &&
      !(cond instanceof Date)
    ) {
      return Object.entries(cond).every(([k, v]) => row[k] === v);
    }
    return matchValue(row[key], cond);
  });
}

function applyData(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      ('increment' in value || 'decrement' in value)
    ) {
      row[key] =
        (row[key] ?? 0) + (value.increment ?? 0) - (value.decrement ?? 0);
    } else {
      row[key] = value;
    }
  }
}

let idSeq = 0;

export class FakeModel {
  rows: Row[] = [];

  constructor(private readonly name: string) {}

  seed(...rows: Row[]) {
    for (const r of rows)
      this.rows.push({ id: `${this.name}_${++idSeq}`, ...r });
    return this;
  }

  private copy(row: Row | undefined) {
    return row ? { ...row } : null;
  }

  findUnique = jest.fn(async ({ where }: { where: Row }) =>
    this.copy(this.rows.find((r) => matchWhere(r, where))),
  );

  findUniqueOrThrow = jest.fn(async ({ where }: { where: Row }) => {
    const row = this.rows.find((r) => matchWhere(r, where));
    if (!row) throw new Error(`${this.name} not found`);
    return { ...row };
  });

  findFirst = jest.fn(async ({ where }: { where?: Row } = {}) =>
    this.copy(this.rows.find((r) => matchWhere(r, where))),
  );

  findMany = jest.fn(async ({ where }: { where?: Row } = {}) =>
    this.rows.filter((r) => matchWhere(r, where)).map((r) => ({ ...r })),
  );

  create = jest.fn(async ({ data }: { data: Row }) => {
    if (
      data.reference &&
      this.rows.some((r) => r.reference === data.reference)
    ) {
      throw new Error(
        `Unique constraint failed on ${this.name}.reference (${data.reference})`,
      );
    }
    const row: Row = { id: `${this.name}_${++idSeq}` };
    applyData(row, data);
    this.rows.push(row);
    return { ...row };
  });

  update = jest.fn(async ({ where, data }: { where: Row; data: Row }) => {
    const row = this.rows.find((r) => matchWhere(r, where));
    if (!row) throw new Error(`${this.name} to update not found`);
    applyData(row, data);
    return { ...row };
  });

  updateMany = jest.fn(async ({ where, data }: { where?: Row; data: Row }) => {
    const rows = this.rows.filter((r) => matchWhere(r, where));
    rows.forEach((r) => applyData(r, data));
    return { count: rows.length };
  });

  count = jest.fn(
    async ({ where }: { where?: Row } = {}) =>
      this.rows.filter((r) => matchWhere(r, where)).length,
  );
}

export function createFakePrisma() {
  const fake: {
    user: FakeModel;
    booking: FakeModel;
    bookingApplication: FakeModel;
    walletTransaction: FakeModel;
    invoice: FakeModel;
    partnerProfile: FakeModel;
    $transaction: jest.Mock;
  } = {
    user: new FakeModel('user'),
    booking: new FakeModel('booking'),
    bookingApplication: new FakeModel('bookingApplication'),
    walletTransaction: new FakeModel('walletTransaction'),
    invoice: new FakeModel('invoice'),
    partnerProfile: new FakeModel('partnerProfile'),
    $transaction: jest.fn(async (arg: any): Promise<any> =>
      typeof arg === 'function' ? arg(fake) : Promise.all(arg),
    ),
  };
  return fake;
}

export type FakePrisma = ReturnType<typeof createFakePrisma>;
