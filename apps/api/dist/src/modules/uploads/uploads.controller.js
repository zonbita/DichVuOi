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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const uploads_root_1 = require("../../common/uploads-root");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);
function ensureDir(dir) {
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    }
}
function safeExt(_originalName, mime) {
    if (mime === 'image/png')
        return '.png';
    if (mime === 'image/webp')
        return '.webp';
    if (mime === 'image/gif')
        return '.gif';
    return '.jpg';
}
function imageInterceptor(subdir) {
    const dest = (0, path_1.join)((0, uploads_root_1.resolveUploadsRoot)(), subdir);
    return (0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                ensureDir(dest);
                cb(null, dest);
            },
            filename: (_req, file, cb) => {
                const name = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}${safeExt(file.originalname, file.mimetype)}`;
                cb(null, name);
            },
        }),
        limits: { fileSize: MAX_BYTES },
        fileFilter: (_req, file, cb) => {
            if (!ALLOWED.has(file.mimetype)) {
                cb(new common_1.BadRequestException('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF'), false);
                return;
            }
            cb(null, true);
        },
    });
}
function uploadedPayload(subdir, file) {
    if (!file) {
        throw new common_1.BadRequestException('Chưa chọn file ảnh');
    }
    return {
        url: `/uploads/${subdir}/${file.filename}`,
        fileName: file.originalname,
        size: file.size,
    };
}
let UploadsController = class UploadsController {
    uploadEvidence(file) {
        return uploadedPayload('evidence', file);
    }
    uploadAvatar(file) {
        return uploadedPayload('avatars', file);
    }
    uploadServicePost(file) {
        return uploadedPayload('service-posts', file);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('evidence'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)(imageInterceptor('evidence')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadEvidence", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)(imageInterceptor('avatars')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('service-post'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)(imageInterceptor('service-posts')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadServicePost", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('uploads'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('uploads')
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map