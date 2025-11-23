import { Controller, Get } from "@nestjs/common";
import { Public } from "./modules/shared/auth/application/decorators/public.decorator";
import { IgnoreCaptchaValidation } from "./modules/shared/auth/application/decorators/ignore-captcha.decorator";

@Controller('health')
@Public()
export class HealthController {

    @IgnoreCaptchaValidation()
    @Get()
    health() {
        return {
            status: 'UP'
        };
    }

}