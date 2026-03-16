import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { User } from '../users/entities/user.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationFilterDto } from './dto/application-filter.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @RequirePermissions('applications.create')
  create(
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.create(createApplicationDto, user);
  }

  @Get()
  @RequirePermissions('applications.read')
  findAll(@Query() filterDto: ApplicationFilterDto) {
    return this.applicationsService.findAll(filterDto);
  }

  @Get(':id')
  @RequirePermissions('applications.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id/review')
  @RequirePermissions('applications.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  @RequirePermissions('applications.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.remove(id);
  }
}
