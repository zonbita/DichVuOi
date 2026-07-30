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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const catalog_http_cache_interceptor_1 = require("./catalog-http-cache.interceptor");
const catalog_service_1 = require("./catalog.service");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    findGroups(featured, tree) {
        return this.catalogService.findGroups(featured === 'true', tree === 'true');
    }
    findGroup(slug) {
        return this.catalogService.findGroupBySlug(slug);
    }
    findServices(group) {
        return this.catalogService.findServices(group);
    }
    findService(slug) {
        return this.catalogService.findServiceBySlug(slug);
    }
    findServiceProviders(slug) {
        return this.catalogService.findServiceProviders(slug);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('groups'),
    (0, common_1.UseInterceptors)(catalog_http_cache_interceptor_1.CatalogHttpCacheInterceptor),
    __param(0, (0, common_1.Query)('featured')),
    __param(1, (0, common_1.Query)('tree')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findGroups", null);
__decorate([
    (0, common_1.Get)('groups/:slug'),
    (0, common_1.UseInterceptors)(catalog_http_cache_interceptor_1.CatalogHttpCacheInterceptor),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findGroup", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, common_1.UseInterceptors)(catalog_http_cache_interceptor_1.CatalogHttpCacheInterceptor),
    __param(0, (0, common_1.Query)('group')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findServices", null);
__decorate([
    (0, common_1.Get)('services/:slug'),
    (0, common_1.UseInterceptors)(catalog_http_cache_interceptor_1.CatalogHttpCacheInterceptor),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findService", null);
__decorate([
    (0, common_1.Get)('services/:slug/partners'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findServiceProviders", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map