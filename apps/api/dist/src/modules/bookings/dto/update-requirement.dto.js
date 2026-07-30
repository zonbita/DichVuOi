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
exports.ConfirmBookingDto = exports.UpdateRequirementDto = exports.CreateRequirementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateRequirementDto {
    content;
}
exports.CreateRequirementDto = CreateRequirementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nội dung công việc cần làm', example: 'Lau kính cửa sổ' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "content", void 0);
class UpdateRequirementDto {
    partnerDone;
    customerConfirmed;
    evidenceUrl;
}
exports.UpdateRequirementDto = UpdateRequirementDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Người làm đánh dấu đã làm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRequirementDto.prototype, "partnerDone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Khách xác nhận đã nhận / đã xong' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRequirementDto.prototype, "customerConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateRequirementDto.prototype, "evidenceUrl", void 0);
class ConfirmBookingDto {
    acceptIncomplete;
}
exports.ConfirmBookingDto = ConfirmBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Đồng ý hoàn thành dù còn mục chưa tích',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfirmBookingDto.prototype, "acceptIncomplete", void 0);
//# sourceMappingURL=update-requirement.dto.js.map