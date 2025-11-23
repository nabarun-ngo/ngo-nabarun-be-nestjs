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
    @ApiOperation({ summary: 'Get team members' })
    async getTeam() {
        return await this.publicService.getTeamMembers();
    }

    @Get('content')
    @ApiOperation({ summary: 'Get public content' })
    @IgnoreCaptchaValidation()
    async getCpntent() {
        return await this.publicService.getPublicContent();
    }


    @Post('contact')
    @ApiOperation({ summary: 'Submit contact form' })
    async contactUs(@Body() dto: ContactFormDto): Promise<{ id: string; success: boolean }> {
        return {
            id: await this.publicService.contactUs(dto),
            success: true
        }
    }


    @Post('signup')
    @ApiOperation({ summary: 'Sign up' })
    async signUp(@Body() dto: SignUpDto): Promise<{ id: string; success: boolean }> {
        return {
            id: await this.publicService.signUp(dto),
            success: true
        }
    }

    @Post('donate')
    @ApiOperation({ summary: 'Submit donation form' })
    async donate(@Body() dto: DonationFormDto): Promise<{ id: string; success: boolean }> {
        return {
            id: await this.publicService.donate(dto),
            success: true
        }
    }

}