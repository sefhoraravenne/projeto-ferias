import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AvatarsService } from './avatars.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@ApiTags('avatars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly service: AvatarsService) {
    // Garantir que a pasta de uploads existe
    const uploadPath = this.service.getUploadPath();
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`✅ Pasta de uploads criada: ${uploadPath}`);
    }
  }

  private getUploadPath(): string {
    return this.service.getUploadPath();
  }

  @Get('user/:userId')
  @Roles('RH', 'Gestor')
  async getAvatarByUserId(@Param('userId') userId: string, @Res() res: Response) {
    const avatar = await this.service.findOneByUserId(userId);
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar não encontrado' });
    }

    const filePath = path.join(this.service.getUploadPath(), avatar.nome);
    return res.sendFile(filePath);
  }

  @Get('me')
  @Roles('RH', 'Gestor')
  async getMyAvatar(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const avatar = await this.service.findOneByUserId(userId);
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar não encontrado' });
    }

    const filePath = path.join(this.service.getUploadPath(), avatar.nome);
    return res.sendFile(filePath);
  }

  @Post('upload')
  @Roles('RH', 'Gestor')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'avatars');
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const userId = (req as any).user?.userId;
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Apenas imagens são permitidas!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(@UploadedFile() file: MulterFile | undefined, @Req() req: any) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const userId = req.user.userId;
    const avatar = await this.service.create(userId, file.filename);
    
    return {
      message: 'Avatar enviado com sucesso',
      avatar: {
        id: avatar.id,
        nome: avatar.nome,
        userId: avatar.userId,
        url: `/avatars/user/${userId}`,
      },
    };
  }

  @Patch('update')
  @Roles('RH', 'Gestor')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'avatars');
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const userId = (req as any).user?.userId;
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Apenas imagens são permitidas!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateAvatar(@UploadedFile() file: MulterFile | undefined, @Req() req: any) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const userId = req.user.userId;
    const avatar = await this.service.update(userId, file.filename);
    
    return {
      message: 'Avatar atualizado com sucesso',
      avatar: {
        id: avatar.id,
        nome: avatar.nome,
        userId: avatar.userId,
        url: `/avatars/user/${userId}`,
      },
    };
  }

  @Delete('delete')
  @Roles('RH', 'Gestor')
  async deleteAvatar(@Req() req: any) {
    const userId = req.user.userId;
    await this.service.delete(userId);
    return { message: 'Avatar deletado com sucesso' };
  }
}

