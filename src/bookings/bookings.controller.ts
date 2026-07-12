import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { Public } from '../common/decorators/public.decorator';
import { Booking } from './entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new booking (no auth required)' })
  @ApiResponse({
    status: 201,
    description: 'Booking created',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Duplicate booking' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all bookings (paginated, filterable, searchable)',
  })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(@Query() queryDto: QueryBookingDto) {
    return this.bookingsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking found', type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(id, updateStatusDto);
  }

  @Public()
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled',
    type: Booking,
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel this booking' })
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.cancel(id);
  }
}
