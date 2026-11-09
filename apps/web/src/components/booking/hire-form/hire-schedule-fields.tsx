import { Controller } from 'react-hook-form';
import { DatetimeLocalField } from '../../ui/datetime-local-field';
import { FieldLabel } from './hire-stepper';
import type { HireServiceFormState } from './use-hire-service-form';

export function HireScheduleFields({ state }: { state: HireServiceFormState }) {
  const { register, control, errors, schedulePublish } = state;
  return (
    <>
    <div>
      <FieldLabel htmlFor="hire-phone">Số điện thoại</FieldLabel>
      <input
        id="hire-phone"
        {...register('customerPhone')}
        placeholder="09xx xxx xxx"
        className="field-input hire-field-input"
      />
      {errors.customerPhone ? (
        <p className="mt-1 text-sm text-red-600">
          {errors.customerPhone.message}
        </p>
      ) : null}
    </div>
    <div>
      <FieldLabel htmlFor="hire-scheduled">Thời hạn hoàn thành</FieldLabel>
      <Controller
        name="scheduledAt"
        control={control}
        render={({ field }) => (
          <DatetimeLocalField
            id="hire-scheduled"
            name={field.name}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            invalid={Boolean(errors.scheduledAt)}
            className="is-compact"
          />
        )}
      />
      {errors.scheduledAt ? (
        <p className="mt-1 text-sm text-red-600">
          {errors.scheduledAt.message}
        </p>
      ) : null}
    </div>

    <div className="sm:col-span-2">
      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)]/60 px-3 py-2.5">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-brand)]"
          {...register('schedulePublish')}
        />
        <span>
          <span className="block text-[13px] font-semibold text-[var(--color-ink)]">
            Hẹn giờ đăng lên bảng tin
          </span>
          <span className="mt-0.5 block text-[11px] text-[var(--color-muted)]">
            Giữ đơn riêng đến giờ chọn — chưa hiện cho người làm. Xem lịch tại
            «Lịch đăng đơn».
          </span>
        </span>
      </label>
      {schedulePublish ? (
        <div className="mt-2">
          <FieldLabel htmlFor="hire-publish">Giờ đăng bảng tin</FieldLabel>
          <Controller
            name="publishAt"
            control={control}
            render={({ field }) => (
              <DatetimeLocalField
                id="hire-publish"
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                invalid={Boolean(errors.publishAt)}
                className="is-compact"
              />
            )}
          />
          {errors.publishAt ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.publishAt.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
    </>
  );
}
