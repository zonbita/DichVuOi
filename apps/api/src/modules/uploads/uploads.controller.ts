import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { resolveUploadsRoot } from '../../common/uploads-root';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function safeExt(originalName: string, mime: string) {
  const fromName = extname(originalName).toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '.jpg';
}

function imageInterceptor(subdir: string) {
  const dest = join(resolveUploadsRoot(), subdir);
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        ensureDir(dest);
        cb(null, dest);
      },
      filename: (_req, file, cb) => {
        const name = `${Date.now()}-${randomUUID().slice(0, 8)}${safeExt(
          file.originalname,
          file.mimetype,
        )}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED.has(file.mimetype)) {
        cb(
          new BadRequestException('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF'),
          false,
        );
        return;
      }
      cb(null, true);
    },
  });
}

function uploadedPayload(subdir: string, file?: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('Chưa chọn file ảnh');
  }
  return {
    url: `/uploads/${subdir}/${file.filename}`,
    fileName: file.originalname,
    size: file.size,
  };
}

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post('evidence')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(imageInterceptor('evidence'))
  uploadEvidence(@UploadedFile() file?: Express.Multer.File) {
    return uploadedPayload('evidence', file);
  }

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(imageInterceptor('avatars'))
  uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    return uploadedPayload('avatars', file);
  }
}
