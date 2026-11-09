import {
  APPLY_DEPOSIT_BUDGET_THRESHOLD,
  clampApplyDepositPercent,
} from '../../../features/booking/create-booking-schema';
import { PriceRangeSlider } from '../../ui/price-range-slider';
import type { HireServiceFormState } from './use-hire-service-form';

export function HireBudgetDeposit({ state }: { state: HireServiceFormState }) {
  const {
    register,
    setValue,
    errors,
    budgetMin,
    budgetMax,
    depositBounds,
    walletBudgetCap,
    depositPercent,
    depositFillPct,
    depositEstimate,
  } = state;
  return (
    <div className="sm:col-span-2 overflow-hidden rounded-xl border border-white/70 bg-white/50">
      <div className="grid lg:grid-cols-2">
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <PriceRangeSlider
            layout="vertical"
            title="Ngân sách dự kiến"
            min={budgetMin}
            max={budgetMax}
            maxSelectable={walletBudgetCap ?? undefined}
            showBubbles
            onChange={({ min, max }) => {
              setValue('budgetMin', min, { shouldValidate: true });
              setValue('budgetMax', max, { shouldValidate: true });
            }}
          />
          {errors.budgetMin ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.budgetMin.message}
            </p>
          ) : null}
          {errors.budgetMax ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.budgetMax.message}
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#DCE6EC] px-3 py-2.5 sm:px-4 sm:py-3 lg:border-t-0 lg:border-l">
          <div className="grid grid-cols-[minmax(0,1fr)_5.75rem] items-end gap-2">
            <div className="min-w-0">
              <div className="price-range-wrap relative h-9 px-1 pt-5">
                <span
                  className="pointer-events-none absolute top-0 z-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#079A9A] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm"
                  style={{ left: `${depositFillPct}%` }}
                >
                  {depositPercent}%
                </span>
                <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#DCE6EC]" />
                <div
                  className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#079A9A]"
                  style={{ width: `${depositFillPct}%` }}
                />
                <input
                  type="range"
                  min={depositBounds.min}
                  max={depositBounds.max}
                  step={1}
                  value={depositPercent}
                  onChange={(e) =>
                    setValue(
                      'applyDepositPercent',
                      clampApplyDepositPercent(
                        Number(e.target.value),
                        budgetMax || 0,
                      ),
                      { shouldValidate: true },
                    )
                  }
                  className="price-range-thumb absolute left-0 right-0 top-1/2 z-2 w-full -translate-y-1/2 appearance-none bg-transparent"
                  aria-label="Mức cọc ứng tuyển %"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-lg bg-[#E8F7F6] px-2 py-1.5 text-center">
              <p className="text-[10px] font-semibold text-[#079A9A]">
                Ước tính
              </p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums leading-none text-[#079A9A]">
                {depositEstimate.toLocaleString('vi-VN')}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#079A9A]">
                VNĐ
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold leading-tight text-[#0F2F4A]">
                Mức cọc ứng tuyển người làm
              </h3>
              <p className="mt-0.5 text-[10px] leading-snug text-[#64748B] line-clamp-2">
                {(budgetMax || 0) > APPLY_DEPOSIT_BUDGET_THRESHOLD
                  ? 'Ngân sách trên 5 triệu: chọn từ 50% đến 100%.'
                  : 'Ngân sách từ 5 triệu trở xuống: chọn từ 0% đến 50%.'}{' '}
                Cọc giữ chỗ của bạn vẫn theo ngân sách đơn.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <input
                id="hire-apply-deposit"
                type="number"
                min={depositBounds.min}
                max={depositBounds.max}
                step={1}
                {...register('applyDepositPercent', { valueAsNumber: true })}
                className="w-11 rounded-md border border-[#DCE6EC] bg-white px-1 py-1 text-center text-sm font-bold tabular-nums text-[#0F2F4A] outline-none transition focus:border-[#079A9A] focus:shadow-[0_0_0_3px_rgba(7,154,154,0.15)]"
              />
              <span className="text-sm font-bold text-[#0F2F4A]">%</span>
            </div>
          </div>

          {errors.applyDepositPercent ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.applyDepositPercent.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
