import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { portraitAvatarUrl } from '../../common/portrait-avatar';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sanitize(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: Role;
    partnerProfile?: unknown;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      partnerProfile: user.partnerProfile ?? null,
    };
  }

  private sign(user: { id: string; email: string; role: Role }) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const enableOffering = Boolean(dto.enableOffering);
    const role = enableOffering ? Role.PARTNER : Role.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim(),
        role,
        ...(enableOffering
          ? {
              partnerProfile: {
                create: {
                  headline: 'Freelancer mới trên Dịch Vụ Ơi',
                  bio: '',
                  city: 'Hồ Chí Minh',
                  level: 1,
                  avatarUrl: portraitAvatarUrl(email),
                },
              },
            }
          : {}),
      },
      include: { partnerProfile: true },
    });

    return {
      accessToken: this.sign(user),
      user: this.sanitize(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { partnerProfile: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return {
      accessToken: this.sign(user),
      user: this.sanitize(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partnerProfile: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  /** Cấp lại JWT sau khi đổi role (vd. bật nhận việc). */
  async sessionFor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partnerProfile: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      accessToken: this.sign(user),
      user: this.sanitize(user),
    };
  }
}
