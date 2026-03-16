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
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlanFilterDto } from './dto/plan-filter.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanService } from './plan.service';

@Controller('plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @RequirePermissions('plans.read')
  findAll(@Query() filterDto: PlanFilterDto) {
    return this.planService.findAll(filterDto);
  }

  @Get(':id')
  @RequirePermissions('plans.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planService.findOne(id);
  }

  @Post()
  @RequirePermissions('plans.create')
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.planService.create(createPlanDto);
  }

  @Patch(':id')
  @RequirePermissions('plans.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.planService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @RequirePermissions('plans.delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.planService.remove(id);
  }
}
