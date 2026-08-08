import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  AuthDivider,
  GoogleSignInButton,
} from '../components/auth/google-sign-in-button';
import { TermsAcceptCheckbox } from '../components/auth/terms-accept-checkbox';
import { useAuth } from '../features/auth/auth-context';
import { allowPasswordAuth } from '../lib/auth-mode';
import type { AuthResponse } from '../types/auth';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const passwordOk = allowPasswordAuth();
  const { register: registerUser, loginWithGoogle, setMode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
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

  function afterAuth(session: AuthResponse) {
    const role = session.user.role;
    if (role === 'ADMIN') {
      navigate('/admin');
      return;
    }
    if (role === 'MODERATOR') {
      navigate('/admin/support');
      return;
    }
    setMode('hire');
    navigate('/don-cua-toi');
  }

  function requireTerms() {
    if (acceptedTerms) {
      setTermsError('');
      return true;
    }
    setTermsError('Vui lòng đồng ý Nội quy và các quy tắc trước khi tiếp tục');
    return false;
  }

  async function onSubmit(values: FormValues) {
    setError('');
    if (!requireTerms()) return;
    try {
      const session = await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        acceptedTerms: true,
      });
      afterAuth(session);
    } catch (err) {
      setError((err as Error).message || 'Đăng ký thất bại');
    }
  }

  async function onGoogle(idToken: string) {
    setError('');
    if (!requireTerms()) return;
    setBusy(true);
    try {
      const session = await loginWithGoogle(idToken, true);
      afterAuth(session);
    } catch (err) {
      setError((err as Error).message || 'Đăng ký Google thất bại');
    } finally {
      setBusy(false);
    }
  }

  const submitting = busy || isSubmitting;

  return (
    <div className="surface-card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Đăng ký</h1>
      <p className="mt-2 text-[15px] text-[var(--color-muted)]">
        {passwordOk
          ? 'Local: Google hoặc email/mật khẩu. Production chỉ Google.'
          : 'Tạo tài khoản bằng Google — vừa thuê vừa nhận việc trên cùng nền tảng.'}
      </p>

      <div className="mt-5">
        <TermsAcceptCheckbox
          checked={acceptedTerms}
          onChange={(next) => {
            setAcceptedTerms(next);
            if (next) setTermsError('');
          }}
          error={termsError}
        />
      </div>

      <div className="mt-6">
        <GoogleSignInButton
          mode="signup"
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
                {...register('fullName')}
                placeholder="Họ và tên"
                className="field-input"
              />
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
              {errors.email ? (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <input
                {...register('phone')}
                placeholder="Số điện thoại"
                className="field-input"
              />
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
              {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>
        </>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="font-semibold text-[var(--color-brand-deep)]">
          {passwordOk ? 'Đăng nhập' : 'Đăng nhập bằng Google'}
        </Link>
      </p>
    </div>
  );
}
