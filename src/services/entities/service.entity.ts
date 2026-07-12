import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('services')
export class Service {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Service title', example: 'Haircut' })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Professional haircut service',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Duration in minutes', example: 30 })
  @Column({ type: 'int' })
  duration: number;

  @ApiProperty({ description: 'Price in currency', example: 25.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Whether the service is active', example: true })
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
