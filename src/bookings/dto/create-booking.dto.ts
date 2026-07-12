import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone', example: '+1234567890' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({
    description: 'Service ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'Booking date (YYYY-MM-DD)',
    example: '2026-07-15',
  })
  @IsNotEmpty()
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ description: 'Booking time (HH:mm)', example: '14:30' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must be in HH:mm format (e.g., 14:30)',
  })
  bookingTime: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Please confirm by email',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
