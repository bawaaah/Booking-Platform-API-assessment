import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { Service } from '../../services/entities/service.entity';

@Entity('bookings')
@Unique('UQ_BOOKING_SERVICE_DATE_TIME', ['serviceId', 'bookingDate', 'bookingTime'])
export class Booking {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @Column()
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'john@example.com',
  })
  @Column()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone', example: '+1234567890' })
  @Column()
  customerPhone: string;

  @ApiProperty({ description: 'Service ID (UUID)' })
  @Column()
  serviceId: string;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ApiProperty({
    description: 'Booking date (YYYY-MM-DD)',
    example: '2026-07-15',
  })
  @Column({ type: 'date' })
  bookingDate: string;

  @ApiProperty({ description: 'Booking time (HH:mm)', example: '14:30' })
  @Column({ type: 'time' })
  bookingTime: string;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Please confirm by email',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
