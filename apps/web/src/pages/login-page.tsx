import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../features/auth/auth-context';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, setMode } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    setError('');
    try {
      await login(values.email, values.password);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect);
        return;
      }
      setMode('hire');
      navigate('/don-cua-toi');
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập thất bại');
    }
  }

  return (
    <div className="surface-card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Đăng nhập</h1>
      <p className="mt-2 text-[15px] text-[var(--color-muted)]">
        Một tài khoản — khách thuê và người làm trên cùng nền tảng.
      </p>
      <form className="mt-6 space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
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
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky" className="font-semibold text-[var(--color-brand-deep)]">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
