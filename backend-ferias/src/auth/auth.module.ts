import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get('JWT_SECRET') || 'default-secret-change-in-production';
        if (!config.get('JWT_SECRET')) {
          console.warn('⚠️  JWT_SECRET não configurado! Usando secret padrão. Configure JWT_SECRET no .env para produção.');
        }
        return {
          secret: secret,
          signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '1d' },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}