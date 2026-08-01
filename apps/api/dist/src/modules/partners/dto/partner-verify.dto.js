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
exports.ConfirmBankVerifyDto = exports.LinkBankAccountDto = exports.ConfirmPhoneOtpDto = exports.RequestPhoneOtpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
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
    code;
}
exports.ConfirmPhoneOtpDto = ConfirmPhoneOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], ConfirmPhoneOtpDto.prototype, "code", void 0);
class LinkBankAccountDto {
    bankName;
    accountNo;
    accountName;
    bankBin;
}
exports.LinkBankAccountDto = LinkBankAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Vietcombank' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], LinkBankAccountDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(30),
    (0, class_validator_1.Matches)(/^[0-9]+$/, { message: 'Số tài khoản chỉ gồm chữ số' }),
    __metadata("design:type", String)
], LinkBankAccountDto.prototype, "accountNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NGUYEN VAN A' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], LinkBankAccountDto.prototype, "accountName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mã ngân hàng img.vietqr.io (VD: 970436)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], LinkBankAccountDto.prototype, "bankBin", void 0);
class ConfirmBankVerifyDto {
    intentId;
}
exports.ConfirmBankVerifyDto = ConfirmBankVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bv_...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], ConfirmBankVerifyDto.prototype, "intentId", void 0);
//# sourceMappingURL=partner-verify.dto.js.map