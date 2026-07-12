import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';

describe('ServicesService', () => {
  let servicesService: ServicesService;
  let servicesRepository: jest.Mocked<Repository<Service>>;

  const mockService: Service = {
    id: 'service-uuid-123',
    title: 'Haircut',
    description: 'Professional haircut',
    duration: 30,
    price: 25.99,
    isActive: true,
    createdById: 'user-uuid-123',
    createdBy: null as any,
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    servicesService = module.get<ServicesService>(ServicesService);
    servicesRepository = module.get(getRepositoryToken(Service));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const createDto = {
      title: 'Haircut',
      description: 'Professional haircut',
      duration: 30,
      price: 25.99,
    };

    it('should create and return a new service', async () => {
      servicesRepository.create.mockReturnValue(mockService);
      servicesRepository.save.mockResolvedValue(mockService);

      const result = await servicesService.create(createDto, 'user-uuid-123');

      expect(servicesRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdById: 'user-uuid-123',
      });
      expect(servicesRepository.save).toHaveBeenCalledWith(mockService);
      expect(result).toEqual(mockService);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FIND ALL
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('should return a paginated list of active services', async () => {
      servicesRepository.findAndCount.mockResolvedValue([[mockService], 1]);

      const result = await servicesService.findAll({ page: 1, limit: 10 });

      expect(servicesRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should calculate skip correctly for page 2', async () => {
      servicesRepository.findAndCount.mockResolvedValue([[], 15]);

      await servicesService.findAll({ page: 2, limit: 10 });

      expect(servicesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('should return a service if found', async () => {
      servicesRepository.findOne.mockResolvedValue(mockService);

      const result = await servicesService.findOne('service-uuid-123');

      expect(servicesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'service-uuid-123' },
      });
      expect(result).toEqual(mockService);
    });

    it('should throw NotFoundException if service does not exist', async () => {
      servicesRepository.findOne.mockResolvedValue(null);

      await expect(
        servicesService.findOne('non-existent-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('should update and return the service', async () => {
      const updateDto = { title: 'Premium Haircut', price: 35.0 };
      const updatedService = { ...mockService, ...updateDto };

      servicesRepository.findOne.mockResolvedValue(mockService);
      servicesRepository.save.mockResolvedValue(updatedService);

      const result = await servicesService.update('service-uuid-123', updateDto);

      expect(servicesRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Premium Haircut');
    });

    it('should throw NotFoundException if service does not exist', async () => {
      servicesRepository.findOne.mockResolvedValue(null);

      await expect(
        servicesService.update('non-existent', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REMOVE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('should delete a service', async () => {
      servicesRepository.findOne.mockResolvedValue(mockService);
      servicesRepository.remove.mockResolvedValue(mockService);

      await servicesService.remove('service-uuid-123');

      expect(servicesRepository.remove).toHaveBeenCalledWith(mockService);
    });

    it('should throw NotFoundException if service does not exist', async () => {
      servicesRepository.findOne.mockResolvedValue(null);

      await expect(
        servicesService.remove('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
