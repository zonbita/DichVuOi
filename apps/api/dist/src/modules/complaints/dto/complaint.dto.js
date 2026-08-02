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
exports.AdminComplaintQueryDto = exports.AdminResolveComplaintDto = exports.CreateComplaintDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const partner_reputation_1 = require("../../../common/partner-reputation");
class CreateComplaintDto {
    category;
    description;
    requirementIds;
    evidenceNote;
}
exports.CreateComplaintDto = CreateComplaintDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'quality' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Id mục checklist tranh chấp' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateComplaintDto.prototype, "requirementIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bằng chứng: link ảnh/video/chat hoặc mô tả tham chiếu' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "evidenceNote", void 0);
class AdminResolveComplaintDto {
    status;
    resolutionAction;
    deductionPoints;
    adminNote;
}
exports.AdminResolveComplaintDto = AdminResolveComplaintDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ComplaintStatus }),
    (0, class_validator_1.IsEnum)(client_1.ComplaintStatus),
    (0, class_validator_1.IsIn)([
        client_1.ComplaintStatus.VERIFIED,
        client_1.ComplaintStatus.REJECTED,
        client_1.ComplaintStatus.UNDER_REVIEW,
    ]),
    __metadata("design:type", String)
], AdminResolveComplaintDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.ComplaintResolutionAction,
        description: 'REFUND=chấp nhận khách; RELEASE=giải ngân; RETRY_*=làm lại; NONE=không đổi cọc giữ chỗ',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ComplaintResolutionAction),
    __metadata("design:type", String)
], AdminResolveComplaintDto.prototype, "resolutionAction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bắt buộc khi VERIFIED trừ điểm partner' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(partner_reputation_1.REPUTATION_STARTING_POINTS),
    __metadata("design:type", Number)
], AdminResolveComplaintDto.prototype, "deductionPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], AdminResolveComplaintDto.prototype, "adminNote", void 0);
class AdminComplaintQueryDto {
    status;
}
exports.AdminComplaintQueryDto = AdminComplaintQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ComplaintStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ComplaintStatus),
    __metadata("design:type", String)
], AdminComplaintQueryDto.prototype, "status", void 0);
//# sourceMappingURL=complaint.dto.js.map