import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpException,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { FirmaService } from './firma.service';
import type { PublicFirmProfile } from './firma.types';

const secureMatch = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

@Controller('firma')
export class FirmaController {
  constructor(private readonly firma: FirmaService) {}

  @Get('perfil')
  @Header('Cache-Control', 'no-store')
  async publicProfile(): Promise<PublicFirmProfile> {
    return this.firma.getPublicProfile();
  }

  @Put('perfil')
  async updateProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body() profile: unknown,
  ): Promise<PublicFirmProfile> {
    const expected = process.env.ER_ADMIN_TOKEN?.trim();
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!expected || !token || !secureMatch(expected, token)) {
      throw new HttpException('No autorizado para actualizar el registro corporativo.', HttpStatus.UNAUTHORIZED);
    }

    return this.firma.updateProfile(profile);
  }
}
