"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmEmailOtpDto = exports.RequestEmailOtpDto = exports.ConfirmPhoneOtpDto = exports.RequestPhoneOtpDto = exports.GoogleLoginDto = exports.LoginDto = exports.RegisterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterDto {
    email;
    password;
    fullName;
    phone;
    enableOffering;
    acceptedTerms;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a@email.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'demo1234' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nguyễn Văn A' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0901234567' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Bật nhận việc ngay khi đăng ký (Facebook-style dual-role)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "enableOffering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        description: 'Bắt buộc đồng ý Nội quy và các quy tắc trước khi tạo tài khoản',
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "acceptedTerms", void 0);
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'demo@dichvuoi.vn' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'demo1234' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class GoogleLoginDto {
    idToken;
    acceptedTerms;
}
exports.GoogleLoginDto = GoogleLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Google Identity Services ID token (credential JWT)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "idToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: true,
        description: 'Bắt buộc khi tạo tài khoản Google lần đầu — đồng ý Nội quy và các quy tắc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GoogleLoginDto.prototype, "acceptedTerms", void 0);
class RequestPhoneOtpDto {
    phone;
}
exports.RequestPhoneOtpDto = RequestPhoneOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0901234567' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(9),
    (0, class_validator_1.MaxLength)(15),
    (0, class_validator_1.Matches)(/^[0-9+\s-]+$/, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], RequestPhoneOtpDto.prototype, "phone", void 0);
class ConfirmPhoneOtpDto {
    key;
}
exports.ConfirmPhoneOtpDto = ConfirmPhoneOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'NguyenVanA-482910',
        description: 'Key một lần: TenUser-XXXXXX (hoặc chỉ mã 6 số)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], ConfirmPhoneOtpDto.prototype, "key", void 0);
class RequestEmailOtpDto {
    email;
}
exports.RequestEmailOtpDto = RequestEmailOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'user@email.com',
        description: 'Email user tự nhập — phải khớp email tài khoản đang đăng nhập',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RequestEmailOtpDto.prototype, "email", void 0);
class ConfirmEmailOtpDto {
    code;
}
exports.ConfirmEmailOtpDto = ConfirmEmailOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '482910', description: 'Mã 6 số gửi qua email (Gmail)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], ConfirmEmailOtpDto.prototype, "code", void 0);
//# sourceMappingURL=auth.dto.js.map