import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmaController } from './firma.controller';
import { FirmProfileEntity } from './firma.entity';
import { FirmaService } from './firma.service';

@Module({
  imports: [TypeOrmModule.forFeature([FirmProfileEntity])],
  controllers: [FirmaController],
  providers: [FirmaService],
  exports: [FirmaService],
})
export class FirmaModule {}
