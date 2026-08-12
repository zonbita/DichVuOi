import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../ui/icon';
import { formatPrice } from '../../services/api';
import {
  WALLET_TX_LABELS,
  type WalletTransaction,
  type WalletTransactionType,
} from '../../types/finance';

export type HistoryFilter = 'day' | 'week' | 'month' | 'all';

const FILTER_OPTIONS: { key: HistoryFilter; label: string }[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'all', label: 'Tất cả' },
];

function historyPageNumbers(current: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, pageCount, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= pageCount - 2) {
    pages.add(pageCount - 1);
    pages.add(pageCount - 2);
    pages.add(pageCount - 3);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  for (const p of sorted) {
    if (out.length > 0) {
      const prev = out[out.length - 1];
      if (typeof prev === 'number' && p - prev > 1) out.push('…');
    }
    out.push(p);
  }
  return out;
}

function transactionIcon(type: WalletTransactionType, positive: boolean): IconName {
  if (type === 'TOP_UP') return 'arrowUpCircle';
  if (type === 'ESCROW_REFUND' || type === 'APPLY_REFUND') return 'wallet';
  if (
    type === 'ESCROW_HOLD' ||
    type === 'APPLY_DEPOSIT' ||
    type === 'WITHDRAW' ||
    type === 'APPLY_FORFEIT'
  ) {
    return 'arrowDownCircle';
  }
  return positive ? 'arrowUpCircle' : 'arrowDownCircle';
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-full border px-3.5 text-sm font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488] ${
        active
          ? 'border-[#0D9488] bg-[#ECFDF9] text-[#0F766E] shadow-[inset_0_0_0_1px_rgba(13,148,136,0.08)]'
          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] active:scale-[0.98]'
      }`}
    >
      {label}
    </button>
  );
}

function WalletTransactionItem({
  tx,
  basePath,
}: {
  tx: WalletTransaction;
  basePath: '/don-cua-toi' | '/doi-tac';
}) {
  const positive = tx.amount > 0;
  const iconName = transactionIcon(tx.type as WalletTransactionType, positive);
  const title = WALLET_TX_LABELS[tx.type as WalletTransactionType] ?? tx.type;
  const amountLabel = `${positive ? '+' : ''}${formatPrice(tx.amount)}`;

  return (
    <li>
      <article
        className="group flex gap-3 rounded-2xl border border-[#E5EAF0] bg-white p-3.5 transition duration-150 hover:-translate-y-px hover:border-[#CBD5E1] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] sm:gap-4 sm:p-4"
        aria-label={`${title}, ${amountLabel}`}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] sm:h-12 sm:w-12 ${
            positive ? 'bg-[#ECFDF9] text-[#0F9F8C]' : 'bg-[#FFF1F2] text-[#DC2626]'
          }`}
          aria-hidden="true"
        >
          <Icon name={iconName} className="h-5 w-5" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-snug text-[#0F172A] sm:text-base">
              {title}
            </p>
            <p className="mt-0.5 truncate text-[13px] leading-snug text-[#64748B] sm:text-sm">
              {tx.description}
            </p>
            <p className="mt-1 truncate text-xs text-[#94A3B8]">
              {new Date(tx.createdAt).toLocaleString('vi-VN')}
              {tx.bookingId ? (
                <>
                  {' · '}
                  <Link
                    to={
                      basePath === '/doi-tac'
                        ? `/doi-tac/viec/${tx.bookingId}`
                        : `/don-cua-toi/don/${tx.bookingId}`
                    }
                    className="font-semibold text-[#0F766E] underline-offset-2 hover:underline"
                  >
                    Đơn
                  </Link>
                </>
              ) : null}
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p
              className={`text-base font-bold leading-snug sm:text-[17px] ${
                positive ? 'text-[#0F9F8C]' : 'text-[#DC2626]'
              }`}
            >
              <span className="sr-only">{positive ? 'Cộng ' : 'Trừ '}</span>
              {amountLabel}
            </p>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Sau: {formatPrice(tx.balanceAfter)}
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}

function HistoryEndState() {
  return (
    <div className="mt-2 flex flex-col items-center gap-2 py-6 text-center">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECFDF9] text-[#0F9F8C]"
        aria-hidden="true"
      >
        <Icon name="wallet" className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-[#0F172A]">Đó là tất cả</p>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Bạn chưa có giao dịch nào khác.
        </p>
      </div>
    </div>
  );
}

export function WalletHistoryPanel({
  basePath,
  historyFilter,
  onHistoryFilterChange,
  isLoading,
  transactions,
  totalCount,
  historyPage,
  historyPageCount,
  onHistoryPageChange,
}: {
  basePath: '/don-cua-toi' | '/doi-tac';
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
  isLoading: boolean;
  transactions: WalletTransaction[];
  totalCount: number;
  historyPage: number;
  historyPageCount: number;
  onHistoryPageChange: (page: number) => void;
}) {
  const safeHistoryPage = Math.min(historyPage, historyPageCount);
  const showEndState =
    !isLoading && totalCount > 0 && safeHistoryPage >= historyPageCount;

  return (
    <section
      className="rounded-[20px] border border-[rgba(15,23,42,0.08)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_8px_24px_rgba(15,23,42,0.04)] sm:p-5 lg:p-6"
      aria-labelledby="wallet-history-title"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="wallet-history-title"
          className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-[22px]"
        >
          Lịch sử ví
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Lọc lịch sử ví theo thời gian"
        >
          {FILTER_OPTIONS.map(({ key, label }) => (
            <FilterButton
              key={key}
              label={label}
              active={historyFilter === key}
              onClick={() => onHistoryFilterChange(key)}
            />
          ))}
        </div>
      </header>

      {isLoading ? (
        <p className="mt-4 text-sm text-[#64748B]">Đang tải…</p>
      ) : null}

      {!isLoading && totalCount === 0 ? (
        <p className="mt-4 text-sm text-[#64748B]">Chưa có giao dịch.</p>
      ) : null}

      {transactions.length > 0 ? (
        <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
          {transactions.map((tx) => (
            <WalletTransactionItem key={tx.id} tx={tx} basePath={basePath} />
          ))}
        </ul>
      ) : null}

      {showEndState ? <HistoryEndState /> : null}

      {historyPageCount > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-4 text-sm">
          <p className="text-xs text-[#64748B]">
            {totalCount} GD · trang {safeHistoryPage}/{historyPageCount}
          </p>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Phân trang lịch sử ví">
            <button
              type="button"
              disabled={safeHistoryPage <= 1}
              onClick={() => onHistoryPageChange(Math.max(1, safeHistoryPage - 1))}
              className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
            >
              Trước
            </button>
            {historyPageNumbers(safeHistoryPage, historyPageCount).map((item, idx) =>
              item === '…' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#64748B]">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onHistoryPageChange(item)}
                  aria-current={item === safeHistoryPage ? 'page' : undefined}
                  className={`min-w-7 rounded-lg border px-2 py-1 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488] ${
                    item === safeHistoryPage
                      ? 'border-[#0D9488] bg-[#ECFDF9] text-[#0F766E]'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={safeHistoryPage >= historyPageCount}
              onClick={() =>
                onHistoryPageChange(Math.min(historyPageCount, safeHistoryPage + 1))
              }
              className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
            >
              Sau
            </button>
          </nav>
        </div>
      ) : null}
    </section>
  );
}
