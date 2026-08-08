import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  AuthDivider,
  GoogleSignInButton,
} from '../components/auth/google-sign-in-button';
import { useAuth } from '../features/auth/auth-context';
import { allowPasswordAuth } from '../lib/auth-mode';
import type { AuthResponse } from '../types/auth';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

function isSafeInternalPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//');
}

export function LoginPage() {
  const passwordOk = allowPasswordAuth();
  const { login, loginWithGoogle, setMode } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  function afterAuth(session: AuthResponse) {
    const role = session.user.role;
    const isStaff = role === 'ADMIN' || role === 'MODERATOR';
    const redirect = params.get('redirect');

    if (isStaff) {
      if (redirect && isSafeInternalPath(redirect) && redirect.startsWith('/admin')) {
        navigate(redirect);
        return;
      }
      navigate(role === 'MODERATOR' ? '/admin/support' : '/admin');
      return;
    }

    setMode('hire');
    if (
      redirect &&
      isSafeInternalPath(redirect) &&
      !redirect.startsWith('/admin')
    ) {
      navigate(redirect);
      return;
    }
    navigate('/don-cua-toi');
  }

  async function onSubmit(values: FormValues) {
    setError('');
    try {
      const session = await login(values.email, values.password);
      afterAuth(session);
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập thất bại');
    }
  }

  async function onGoogle(idToken: string) {
    setError('');
    setBusy(true);
    try {
      // Không gửi acceptedTerms — tài khoản mới sẽ hiện modal đồng ý 1 lần sau đăng nhập.
      const session = await loginWithGoogle(idToken);
      afterAuth(session);
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập Google thất bại');
    } finally {
      setBusy(false);
    }
  }

  const submitting = busy || isSubmitting;

  return (
    <div className="surface-card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Đăng nhập</h1>
      <p className="mt-2 text-[15px] text-[var(--color-muted)]">
        {passwordOk
          ? 'Local: Google hoặc email/mật khẩu (seed). Production chỉ Google.'
          : 'Đăng nhập bằng Google — một tài khoản cho khách thuê và người làm.'}
      </p>

      <div className="mt-6">
        <GoogleSignInButton
          mode="signin"
          disabled={submitting}
          onCredential={onGoogle}
          onError={setError}
        />
      </div>

      {passwordOk ? (
        <>
          <AuthDivider />
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Email"
                className="field-input"
              />
              {errors.email ? (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              ) : null}
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
              disabled={submitting}
              className="btn-primary w-full py-3 text-[15px] disabled:opacity-60"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky" className="font-semibold text-[var(--color-brand-deep)]">
          {passwordOk ? 'Đăng ký' : 'Đăng ký bằng Google'}
        </Link>
      </p>
    </div>
  );
}
