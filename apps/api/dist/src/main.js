"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const cors_origin_1 = require("./common/cors-origin");
const security_env_1 = require("./common/security-env");
const uploads_root_1 = require("./common/uploads-root");
async function bootstrap() {
    (0, security_env_1.assertBootSecrets)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    const staticHeaders = (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
    };
    const uploadsRoot = (0, uploads_root_1.ensureUploadsRoot)();
    app.useStaticAssets(uploadsRoot, {
        prefix: '/uploads/',
        setHeaders: staticHeaders,
    });
    const bundledUploads = (0, uploads_root_1.resolveBundledUploadsRoot)();
    if (bundledUploads && bundledUploads !== uploadsRoot) {
        app.useStaticAssets(bundledUploads, {
            prefix: '/uploads/',
            setHeaders: staticHeaders,
        });
    }
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
    if (!(0, security_env_1.isProductionLike)() || process.env.ENABLE_SWAGGER === '1') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Dịch Vụ Ơi API')
            .setDescription('API đặt lịch dịch vụ đa ngành nghề')
            .setVersion('0.1.0')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('docs', app, document);
    }
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    console.log(`API running on http://localhost:${port}`);
    if (!(0, security_env_1.isProductionLike)() || process.env.ENABLE_SWAGGER === '1') {
        console.log(`Swagger on http://localhost:${port}/docs`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map