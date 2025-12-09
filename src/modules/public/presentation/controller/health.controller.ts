import { Controller, Get, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../../shared/auth/application/decorators/public.decorator";
import { IgnoreCaptchaValidation } from "../../../shared/auth/application/decorators/ignore-captcha.decorator";

@ApiTags('Health')
@Controller()
@Public()
export class HealthController {

    @IgnoreCaptchaValidation()
    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint' })
    health() {
        return {
            status: 'UP',
            timestamp: new Date().toISOString()
        };
    }

}