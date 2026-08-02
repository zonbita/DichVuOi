import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { buildCorsOrigin } from './common/cors-origin';
import {
  assertBootSecrets,
  isProductionLike,
} from './common/security-env';
import { ensureUploadsRoot } from './common/uploads-root';

async function bootstrap() {
  assertBootSecrets();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const uploadsRoot = ensureUploadsRoot();
  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: buildCorsOrigin(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (!isProductionLike() || process.env.ENABLE_SWAGGER === '1') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Dịch Vụ Ơi API')
      .setDescription('API đặt lịch dịch vụ đa ngành nghề')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  if (!isProductionLike() || process.env.ENABLE_SWAGGER === '1') {
    console.log(`Swagger on http://localhost:${port}/docs`);
  }
}

bootstrap();
