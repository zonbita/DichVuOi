import {
  BadRequestException,
  Controller,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage, memoryStorage } from 'multer';
import { join } from 'path';
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

/** Extension chỉ theo MIME server nhận (không tin tên file client). */
function safeExt(_originalName: string, mime: string) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '.jpg';
}

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function imageInterceptor(subdir: string) {
  /** Vercel: memory (Blob hoặc báo lỗi) — không ghi disk ephemeral. */
  const memory = useBlobStorage() || Boolean(process.env.VERCEL);
  const dest = join(resolveUploadsRoot(), subdir);

  return FileInterceptor('file', {
    storage: memory
      ? memoryStorage()
      : diskStorage({
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

async function uploadedPayload(subdir: string, file?: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('Chưa chọn file ảnh');
  }

  if (useBlobStorage()) {
    if (!file.buffer?.length) {
      throw new BadRequestException('File ảnh trống');
    }
    const pathname = `${subdir}/${Date.now()}-${randomUUID().slice(0, 8)}${safeExt(
      file.originalname,
      file.mimetype,
    )}`;
    try {
      const blob = await put(pathname, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return {
        url: blob.url,
        fileName: file.originalname,
        size: file.size,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không lưu được ảnh lên Blob';
      throw new ServiceUnavailableException(message);
    }
  }

  if (process.env.VERCEL) {
    throw new ServiceUnavailableException(
      'Vercel không lưu ảnh bền trên /tmp. Thêm BLOB_READ_WRITE_TOKEN (Vercel Blob) rồi deploy lại API.',
    );
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

  @Post('service-post')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(imageInterceptor('service-posts'))
  uploadServicePost(@UploadedFile() file?: Express.Multer.File) {
    return uploadedPayload('service-posts', file);
  }
}
