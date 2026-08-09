import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

export type LobbyViewerPublic = {
  key: string;
  fullName: string;
  avatarUrl: string | null;
  userId: string | null;
  isGuest: boolean;
};

type LobbySeat = {
  key: string;
  socketIds: Set<string>;
  fullName: string;
  avatarUrl: string | null;
  userId: string | null;
  isGuest: boolean;
};

const VIEWERS_CAP = 32;

/**
 * Ai đang trong sảnh trang chủ (WS room home:lobby).
 * Guest + user login đều đếm; ưu tiên hiện tên user đã login.
 */
@Injectable()
export class LobbyPresenceService {
  private readonly seats = new Map<string, LobbySeat>();

  constructor(private readonly prisma: PrismaService) {}

  async joinUser(userId: string, socketId: string) {
    const key = `user:${userId}`;
    const existing = this.seats.get(key);
    if (existing) {
      existing.socketIds.add(socketId);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        partnerProfile: { select: { avatarUrl: true } },
      },
    });

    this.seats.set(key, {
      key,
      socketIds: new Set([socketId]),
      fullName: user?.fullName?.trim() || 'Thành viên',
      avatarUrl: user?.partnerProfile?.avatarUrl ?? null,
      userId,
      isGuest: false,
    });
  }

  joinGuest(guestId: string | undefined, socketId: string) {
    const safe =
      (guestId ?? '').trim().slice(0, 64) ||
      `anon-${socketId.slice(-8)}`;
    const key = `guest:${safe}`;
    const existing = this.seats.get(key);
    if (existing) {
      existing.socketIds.add(socketId);
      return;
    }

    const short = safe.replace(/^g_/, '').slice(-4).toUpperCase();
    this.seats.set(key, {
      key,
      socketIds: new Set([socketId]),
      fullName: `Khách · ${short || 'xem'}`,
      avatarUrl: null,
      userId: null,
      isGuest: true,
    });
  }

  leave(key: string | undefined, socketId: string) {
    if (!key) return;
    const seat = this.seats.get(key);
    if (!seat) return;
    seat.socketIds.delete(socketId);
    if (seat.socketIds.size === 0) {
      this.seats.delete(key);
    }
  }

  seatKeyForClient(data: {
    userId?: string;
    guest?: boolean;
    guestId?: string;
  }): string | undefined {
    if (data.userId) return `user:${data.userId}`;
    if (data.guest) {
      const safe = (data.guestId ?? '').trim().slice(0, 64);
      if (safe) return `guest:${safe}`;
    }
    return undefined;
  }

  snapshot(): { onlineCount: number; viewers: LobbyViewerPublic[] } {
    const all = [...this.seats.values()];
    const onlineCount = all.length;
    const sorted = all.sort((a, b) => {
      if (a.isGuest !== b.isGuest) return a.isGuest ? 1 : -1;
      return a.fullName.localeCompare(b.fullName, 'vi');
    });
    const viewers: LobbyViewerPublic[] = sorted.slice(0, VIEWERS_CAP).map((s) => ({
      key: s.key,
      fullName: s.fullName,
      avatarUrl: s.avatarUrl,
      userId: s.userId,
      isGuest: s.isGuest,
    }));
    return { onlineCount, viewers };
  }
}
