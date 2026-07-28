import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';

type LiveSession = {
  socketIds: Set<string>;
  /** Mốc đã credit tới (ms). */
  creditedFromMs: number;
  disconnectTimer?: ReturnType<typeof setTimeout>;
};

const DISCONNECT_GRACE_MS = 30_000;
/** Flush định kỳ khi còn online (tránh mất giờ nếu process crash). */
const HEARTBEAT_FLUSH_MIN_MS = 60_000;

/**
 * Theo dõi presence người làm qua Socket.IO → cộng PartnerProfile.onlineSeconds.
 */
@Injectable()
export class PartnerPresenceService {
  private readonly logger = new Logger(PartnerPresenceService.name);
  private readonly sessions = new Map<string, LiveSession>();

  constructor(private readonly prisma: PrismaService) {}

  async onConnect(userId: string, socketId: string) {
    const hasProfile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { userId: true },
    });
    if (!hasProfile) return;

    let session = this.sessions.get(userId);
    if (session?.disconnectTimer) {
      clearTimeout(session.disconnectTimer);
      session.disconnectTimer = undefined;
    }

    if (!session) {
      session = {
        socketIds: new Set([socketId]),
        creditedFromMs: Date.now(),
      };
      this.sessions.set(userId, session);
    } else {
      session.socketIds.add(socketId);
    }

    await this.prisma.partnerProfile.update({
      where: { userId },
      data: { lastOnlineAt: new Date() },
    });
  }

  onDisconnect(userId: string, socketId: string) {
    const session = this.sessions.get(userId);
    if (!session) return;

    session.socketIds.delete(socketId);
    if (session.socketIds.size > 0) return;

    if (session.disconnectTimer) clearTimeout(session.disconnectTimer);
    session.disconnectTimer = setTimeout(() => {
      void this.flushAndEnd(userId).catch((err) =>
        this.logger.warn(`Presence flush failed: ${(err as Error).message}`),
      );
    }, DISCONNECT_GRACE_MS);
  }

  async onHeartbeat(userId: string) {
    const session = this.sessions.get(userId);
    if (!session || session.socketIds.size === 0) {
      // Heartbeat từ socket chưa được track (vd. reconnect race) — bỏ qua.
      return;
    }
    if (session.disconnectTimer) {
      clearTimeout(session.disconnectTimer);
      session.disconnectTimer = undefined;
    }

    const elapsed = Date.now() - session.creditedFromMs;
    if (elapsed >= HEARTBEAT_FLUSH_MIN_MS) {
      await this.creditElapsed(userId, session, false);
    } else {
      await this.prisma.partnerProfile.update({
        where: { userId },
        data: { lastOnlineAt: new Date() },
      });
    }
  }

  private async flushAndEnd(userId: string) {
    const session = this.sessions.get(userId);
    if (!session) return;
    if (session.socketIds.size > 0) return;

    await this.creditElapsed(userId, session, true);
    this.sessions.delete(userId);
  }

  private async creditElapsed(
    userId: string,
    session: LiveSession,
    endSession: boolean,
  ) {
    const now = Date.now();
    const addSeconds = Math.max(0, Math.floor((now - session.creditedFromMs) / 1000));
    session.creditedFromMs = now;

    if (addSeconds <= 0 && !endSession) {
      await this.prisma.partnerProfile.update({
        where: { userId },
        data: { lastOnlineAt: new Date(now) },
      });
      return;
    }

    if (addSeconds > 0) {
      await this.prisma.partnerProfile.update({
        where: { userId },
        data: {
          onlineSeconds: { increment: addSeconds },
          lastOnlineAt: new Date(now),
        },
      });
      await recalculatePartnerLevel(this.prisma, userId);
    } else {
      await this.prisma.partnerProfile.update({
        where: { userId },
        data: { lastOnlineAt: new Date(now) },
      });
    }
  }
}
