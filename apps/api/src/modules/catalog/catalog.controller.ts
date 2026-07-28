import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CatalogHttpCacheInterceptor } from './catalog-http-cache.interceptor';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('groups')
  @UseInterceptors(CatalogHttpCacheInterceptor)
  findGroups(
    @Query('featured') featured?: string,
    @Query('tree') tree?: string,
  ) {
    return this.catalogService.findGroups(
      featured === 'true',
      tree === 'true',
    );
  }

  @Get('groups/:slug')
  @UseInterceptors(CatalogHttpCacheInterceptor)
  findGroup(@Param('slug') slug: string) {
    return this.catalogService.findGroupBySlug(slug);
  }

  @Get('services')
  @UseInterceptors(CatalogHttpCacheInterceptor)
  findServices(@Query('group') group?: string) {
    return this.catalogService.findServices(group);
  }

  @Get('services/:slug')
  @UseInterceptors(CatalogHttpCacheInterceptor)
  findService(@Param('slug') slug: string) {
    return this.catalogService.findServiceBySlug(slug);
  }

  /** Không cache HTTP — danh sách thợ thay đổi thường xuyên. */
  @Get('services/:slug/partners')
  findServiceProviders(@Param('slug') slug: string) {
    return this.catalogService.findServiceProviders(slug);
  }
}
