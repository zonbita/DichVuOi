/**
 * Email/mật khẩu chỉ dùng local (Vite DEV).
 * Production: Google only. Override: VITE_ALLOW_PASSWORD_AUTH=1|0.
 */
export function allowPasswordAuth(): boolean {
  const flag = import.meta.env.VITE_ALLOW_PASSWORD_AUTH?.trim().toLowerCase();
  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;
  return Boolean(import.meta.env.DEV);
}
