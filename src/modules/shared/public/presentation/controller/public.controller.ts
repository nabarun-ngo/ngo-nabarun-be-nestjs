import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "src/modules/shared/auth/application/decorators/public.decorator";
import { PublicService } from "../../application/services/public.services";
import { IgnoreCaptchaValidation } from "src/modules/shared/auth/application/decorators/ignore-captcha.decorator";
import { ContactFormDto, DonationFormDto, SignUpDto } from "../../application/dto/public.dto";

@ApiTags('Public')
@Controller('public')
@Public()
export class PublicController {

    constructor(private readonly publicService: PublicService) { }

    @Get('team')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '' })
    async getTeam() {
        return await this.publicService.getTeamMembers();
    }

    @Get('content')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '' })
    @IgnoreCaptchaValidation()
    async getCpntent() {
        return await this.publicService.getPublicContent();
    }


    @Post('contact')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'contactUs' })
    async contactUs(@Body() dto: ContactFormDto) {
        return {
            id: await this.publicService.contactUs(dto),
            success: true
        }
    }


    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Signup' })
    async signUp(@Body() dto: SignUpDto) {
        return {
            id: await this.publicService.signUp(dto),
            success: true
        }
    }

    @Post('donate')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Signup' })
    async donate(@Body() dto: DonationFormDto) {
        return {
            id: await this.publicService.donate(dto),
            success: true
        }
    }

}