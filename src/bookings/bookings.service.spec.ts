import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { ServicesService } from '../services/services.service';
import { BookingStatus } from '../common/enums/booking-status.enum';

describe('BookingsService', () => {
  let bookingsService: BookingsService;
  let bookingsRepository: any;
  let servicesService: jest.Mocked<ServicesService>;

  const mockService = {
    id: 'service-uuid-123',
    title: 'Haircut',
    description: 'Professional haircut',
    duration: 30,
    price: 25.99,
    isActive: true,
    createdById: 'user-uuid-123',
    createdBy: null,
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Use a future date for bookings
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const mockBooking: Booking = {
    id: 'booking-uuid-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    serviceId: 'service-uuid-123',
    service: mockService as any,
    bookingDate: futureDateStr,
    bookingTime: '14:30',
    status: BookingStatus.PENDING,
    notes: 'No special requests',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createDto = {
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    serviceId: 'service-uuid-123',
    bookingDate: futureDateStr,
    bookingTime: '14:30',
    notes: 'No special requests',
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Query builder mock factory
  // ─────────────────────────────────────────────────────────────────────────────
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: ServicesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
    bookingsRepository = module.get(getRepositoryToken(Booking));
    servicesService = module.get(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('should create and return a booking', async () => {
      servicesService.findOne.mockResolvedValue(mockService as any);
      bookingsRepository.create.mockReturnValue(mockBooking);
      bookingsRepository.save.mockResolvedValue(mockBooking);

      const result = await bookingsService.create(createDto);

      expect(servicesService.findOne).toHaveBeenCalledWith(createDto.serviceId);
      expect(result).toEqual(mockBooking);
    });

    it('should throw BadRequestException for a past booking date', async () => {
      servicesService.findOne.mockResolvedValue(mockService as any);

      await expect(
        bookingsService.create({ ...createDto, bookingDate: '2020-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if service is inactive', async () => {
      servicesService.findOne.mockResolvedValue({
        ...mockService,
        isActive: false,
      } as any);

      await expect(bookingsService.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException on duplicate booking (DB unique constraint)', async () => {
      servicesService.findOne.mockResolvedValue(mockService as any);
      bookingsRepository.create.mockReturnValue(mockBooking);
      bookingsRepository.save.mockRejectedValue({ code: '23505' }); // PostgreSQL unique violation

      await expect(bookingsService.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FIND ALL (with search, filter, pagination)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('should return paginated bookings', async () => {
      const result = await bookingsService.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should apply status filter when provided', async () => {
      await bookingsService.findAll({
        page: 1,
        limit: 10,
        status: BookingStatus.CONFIRMED,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'booking.status = :status',
        { status: BookingStatus.CONFIRMED },
      );
    });

    it('should apply search filter when provided', async () => {
      await bookingsService.findAll({ page: 1, limit: 10, search: 'john' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search)',
        { search: '%john%' },
      );
    });

    it('should apply serviceId filter when provided', async () => {
      await bookingsService.findAll({
        page: 1,
        limit: 10,
        serviceId: 'service-uuid-123',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'booking.serviceId = :serviceId',
        { serviceId: 'service-uuid-123' },
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('should return a booking if found', async () => {
      bookingsRepository.findOne.mockResolvedValue(mockBooking);

      const result = await bookingsService.findOne('booking-uuid-123');

      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      bookingsRepository.findOne.mockResolvedValue(null);

      await expect(
        bookingsService.findOne('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE STATUS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('updateStatus()', () => {
    it('should update booking status successfully', async () => {
      const updatedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      bookingsRepository.findOne.mockResolvedValue(mockBooking);
      bookingsRepository.save.mockResolvedValue(updatedBooking);

      const result = await bookingsService.updateStatus('booking-uuid-123', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw BadRequestException when marking a cancelled booking as completed', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      bookingsRepository.findOne.mockResolvedValue(cancelledBooking);

      await expect(
        bookingsService.updateStatus('booking-uuid-123', {
          status: BookingStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────────────────────────────────────
  describe('cancel()', () => {
    it('should cancel a pending booking', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      bookingsRepository.findOne.mockResolvedValue(mockBooking);
      bookingsRepository.save.mockResolvedValue(cancelledBooking);

      const result = await bookingsService.cancel('booking-uuid-123');

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException if booking is already cancelled', async () => {
      bookingsRepository.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        bookingsService.cancel('booking-uuid-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is already completed', async () => {
      bookingsRepository.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        bookingsService.cancel('booking-uuid-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
