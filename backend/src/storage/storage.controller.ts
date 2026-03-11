import { Body, Controller, Delete, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FileInterceptor } from '@nestjs/platform-express'
import { Public } from 'nest-keycloak-connect';
@Public()
@Controller('storage')
export class StorageController {
    constructor(private storageService: StorageService) {}

    @Post("upload/cin/:userId")
    @UseInterceptors(FileInterceptor('file'))
    async uploadCin( @UploadedFile() file: Express.Multer.File,@Param("userId") userId: string)
    {
        const url = await this.storageService.uploadFile(file, "cin",  userId);
        return { url };
    }
    @Post("upload/selfie/:userId")
    @UseInterceptors(FileInterceptor('file'))
    async uploadSelfie( @UploadedFile() file: Express.Multer.File,@Param("userId") userId: string)
    {
        const url = await this.storageService.uploadFile(file, "selfie",  userId);
        return { url };
    }
    @Post("upload/pod/:userId")
    @UseInterceptors(FileInterceptor('file'))
    async uploadPOD( @UploadedFile() file: Express.Multer.File,@Param("userId") userId: string)
    {
        const url = await this.storageService.uploadFile(file, "pod",  userId);
        return { url };
    }
    @Delete()
    async delete(@Body("url") url: string) {
        return this.storageService.deleteFile(url);
    }
}
