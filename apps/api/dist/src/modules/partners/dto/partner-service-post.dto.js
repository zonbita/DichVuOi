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
exports.UpdatePartnerServicePostDto = exports.CreatePartnerServicePostDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePartnerServicePostDto {
    serviceId;
    title;
    body;
    price;
    images;
}
exports.CreatePartnerServicePostDto = CreatePartnerServicePostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cuid_service_1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartnerServicePostDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sửa điều hòa nhanh tại Q1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4, { message: 'Tiêu đề cần ít nhất 4 ký tự' }),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreatePartnerServicePostDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mô tả chi tiết dịch vụ, phạm vi và cam kết…' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Nội dung không được để trống' }),
    (0, class_validator_1.MaxLength)(8000),
    __metadata("design:type", String)
], CreatePartnerServicePostDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 200000,
        description: 'Giá chào cho nghề này (VNĐ)',
    }),
    (0, class_validator_1.IsInt)({ message: 'Giá chào phải là số nguyên' }),
    (0, class_validator_1.Min)(1000, { message: 'Giá chào tối thiểu 1.000 VNĐ' }),
    (0, class_validator_1.Max)(500_000_000, { message: 'Giá chào quá lớn' }),
    __metadata("design:type", Number)
], CreatePartnerServicePostDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        example: ['/uploads/service-posts/a.jpg'],
        description: 'Ít nhất 1 ảnh',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Cần ít nhất một ảnh' }),
    (0, class_validator_1.ArrayMaxSize)(8, { message: 'Tối đa 8 ảnh' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePartnerServicePostDto.prototype, "images", void 0);
class UpdatePartnerServicePostDto {
    serviceId;
    title;
    body;
    price;
    images;
}
exports.UpdatePartnerServicePostDto = UpdatePartnerServicePostDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePartnerServicePostDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4, { message: 'Tiêu đề cần ít nhất 4 ký tự' }),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdatePartnerServicePostDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Nội dung không được để trống' }),
    (0, class_validator_1.MaxLength)(8000),
    __metadata("design:type", String)
], UpdatePartnerServicePostDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 200000,
        description: 'Giá chào cho nghề này (VNĐ)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Giá chào phải là số nguyên' }),
    (0, class_validator_1.Min)(1000, { message: 'Giá chào tối thiểu 1.000 VNĐ' }),
    (0, class_validator_1.Max)(500_000_000, { message: 'Giá chào quá lớn' }),
    __metadata("design:type", Number)
], UpdatePartnerServicePostDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Cần ít nhất một ảnh' }),
    (0, class_validator_1.ArrayMaxSize)(8, { message: 'Tối đa 8 ảnh' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePartnerServicePostDto.prototype, "images", void 0);
//# sourceMappingURL=partner-service-post.dto.js.map