/** Badge đỏ kiểu Messenger — đặt absolute trên avatar/thumbnail. */
export function ChatUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-1 -top-1 z-[2] flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E41E3F] px-1 text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
      aria-label={`${count} tin nhắn mới`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
