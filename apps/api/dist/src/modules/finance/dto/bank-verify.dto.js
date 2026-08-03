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
exports.ConfirmBankVerifyDto = exports.RequestBankVerifyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RequestBankVerifyDto {
    bankBin;
    bankCode;
    bankName;
    accountNo;
    accountName;
}
exports.RequestBankVerifyDto = RequestBankVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '970436', description: 'BIN VietQR' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], RequestBankVerifyDto.prototype, "bankBin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'VCB' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], RequestBankVerifyDto.prototype, "bankCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Vietcombank' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], RequestBankVerifyDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(30),
    (0, class_validator_1.Matches)(/^[0-9]+$/, { message: 'Số tài khoản chỉ gồm chữ số' }),
    __metadata("design:type", String)
], RequestBankVerifyDto.prototype, "accountNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NGUYEN VAN A' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], RequestBankVerifyDto.prototype, "accountName", void 0);
class ConfirmBankVerifyDto {
    code;
}
exports.ConfirmBankVerifyDto = ConfirmBankVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '482910', description: 'Mã OTP gửi qua email' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], ConfirmBankVerifyDto.prototype, "code", void 0);
//# sourceMappingURL=bank-verify.dto.js.map