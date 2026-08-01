"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const cors_origin_1 = require("./common/cors-origin");
const uploads_root_1 = require("./common/uploads-root");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const uploadsRoot = (0, uploads_root_1.ensureUploadsRoot)();
    app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: (0, cors_origin_1.buildCorsOrigin)(),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Dịch Vụ Ơi API')
        .setDescription('API đặt lịch dịch vụ đa ngành nghề')
        .setVersion('0.1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    console.log(`API running on http://localhost:${port}`);
    console.log(`Swagger on http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map