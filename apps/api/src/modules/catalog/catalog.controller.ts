import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('groups')
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
  findGroup(@Param('slug') slug: string) {
    return this.catalogService.findGroupBySlug(slug);
  }

  @Get('services')
  findServices(@Query('group') group?: string) {
    return this.catalogService.findServices(group);
  }

  @Get('services/:slug')
  findService(@Param('slug') slug: string) {
    return this.catalogService.findServiceBySlug(slug);
  }

  @Get('services/:slug/partners')
  findServiceProviders(@Param('slug') slug: string) {
    return this.catalogService.findServiceProviders(slug);
  }
}
