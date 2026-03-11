import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class IdentityGuard implements CanActivate{
    constructor(private prisma:PrismaService){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const fingerprint=request.headers['x-device-fingerprint'];
        const userId= request.user.id;

        const user = await this .prisma.user.findUnique({
            where: {id: userId},
            include:{ trustProfile: {include: { devices: true}}}
        });

        if (!user?.trustProfile) throw new ForbiddenException('NO_TRUSTED_PROFILE_DETECTED');
    
        const isKnown = user.trustProfile.devices.some(
            d => d.deviceFingerprint === fingerprint);
            
        if (!isKnown) throw new ForbiddenException('NEW_DEVICE_DETECTED');
            return true;
        }
}