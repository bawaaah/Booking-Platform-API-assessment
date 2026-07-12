import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { ServicesService } from '../services/services.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate: service must exist and be active
    const service = await this.servicesService.findOne(
      createBookingDto.serviceId,
    );
    if (!service.isActive) {
      throw new BadRequestException('This service is currently not available');
    }

    // Validate: booking date cannot be in the past
    const bookingDate = new Date(createBookingDto.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Create booking
    const booking = this.bookingsRepository.create(createBookingDto);

    try {
      return await this.bookingsRepository.save(booking);
    } catch (error: any) {
      // Handle duplicate booking constraint violation
      if (error.code === '23505') {
        throw new ConflictException(
          'A booking already exists for this service at the specified date and time',
        );
      }
      throw error;
    }
  }

  async findAll(
    queryDto: QueryBookingDto,
  ): Promise<PaginatedResponseDto<Booking>> {
    const { status, search, serviceId } = queryDto;
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder: SelectQueryBuilder<Booking> = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .orderBy('booking.createdAt', 'DESC');

    // Filter by status
    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    // Filter by service ID
    if (serviceId) {
      queryBuilder.andWhere('booking.serviceId = :serviceId', { serviceId });
    }

    // Search by customer name or email
    if (search) {
      queryBuilder.andWhere(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [bookings, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(bookings, total, page, limit);
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    // Business rule: Cancelled bookings cannot be marked as completed
    if (
      booking.status === BookingStatus.CANCELLED &&
      updateStatusDto.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cancelled bookings cannot be marked as completed',
      );
    }

    booking.status = updateStatusDto.status;
    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }
}
