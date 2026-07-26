import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../features/auth/auth-context';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser, setMode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setError('');
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
      });
      setMode('hire');
      navigate('/don-cua-toi');
    } catch (err) {
      setError((err as Error).message || 'Đăng ký thất bại');
    }
  }

  return (
    <div className="surface-card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Đăng ký</h1>
      <p className="mt-2 text-[15px] text-[var(--color-muted)]">
        Một tài khoản thật — vừa là khách thuê vừa là người làm. Chuyển vai bằng menu trên header.
      </p>
      <form className="mt-6 space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <input {...register('fullName')} placeholder="Họ và tên" className="field-input" />
          {errors.fullName ? (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          ) : null}
        </div>
        <div>
          <input
            {...register('email')}
            type="email"
            placeholder="Email"
            className="field-input"
          />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <input {...register('phone')} placeholder="Số điện thoại" className="field-input" />
        </div>
        <div>
          <input
            {...register('password')}
            type="password"
            placeholder="Mật khẩu"
            className="field-input"
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3 text-[15px] disabled:opacity-60"
        >
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="font-semibold text-[var(--color-brand-deep)]">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
