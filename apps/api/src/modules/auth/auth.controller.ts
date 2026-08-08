import {
  Body,
  Controller,
  Get,
  GoneException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { allowPasswordAuth } from '../../common/security-env';
import { AuthService } from './auth.service';
import {
  ConfirmEmailOtpDto,
  ConfirmPhoneOtpDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  RequestEmailOtpDto,
  RequestPhoneOtpDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Local: email/mật khẩu; production: chỉ Google. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    if (!allowPasswordAuth()) {
      throw new GoneException(
        'Đăng ký bằng email/mật khẩu đã tắt — dùng Google.',
      );
    }
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    if (!allowPasswordAuth()) {
      throw new GoneException(
        'Đăng nhập bằng email/mật khẩu đã tắt — dùng Google.',
      );
    }
    return this.authService.login(dto);
  }

  /** Google Identity Services — body `{ idToken }` → cùng shape login/register. */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  /** Đồng ý Nội quy (user cũ chưa có termsAcceptedAt). */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('accept-terms')
  acceptTerms(@CurrentUser() user: AuthUser) {
    return this.authService.acceptTerms(user.id);
  }

  /** OTP SĐT: eSMS Brandname khi cấu hình, không thì mock key trên web. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify-phone/request')
  requestPhoneOtp(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestPhoneOtpDto,
  ) {
    return this.authService.requestPhoneOtp(user.id, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify-phone/confirm')
  confirmPhoneOtp(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmPhoneOtpDto,
  ) {
    return this.authService.confirmPhoneOtp(user.id, dto);
  }

  /** OTP email (Gmail) — user tự nhập email, OTP, rồi mới nhập NH. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify-email/request')
  requestEmailOtp(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestEmailOtpDto,
  ) {
    return this.authService.requestEmailOtp(user.id, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify-email/confirm')
  confirmEmailOtp(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmEmailOtpDto,
  ) {
    return this.authService.confirmEmailOtp(user.id, dto);
  }
}
