import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "./modules/shared/auth/application/decorators/public.decorator";
import { IgnoreCaptchaValidation } from "./modules/shared/auth/application/decorators/ignore-captcha.decorator";

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {

    @IgnoreCaptchaValidation()
    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    health() {
        return {
            status: 'UP'
        };
    }

}