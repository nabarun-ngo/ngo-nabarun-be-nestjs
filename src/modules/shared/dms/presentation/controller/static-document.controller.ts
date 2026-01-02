import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaticDocsService } from "../../application/services/static-docs.service";
import { StaticDocumentDto } from "../dto/static-docs.dto";
import { ApiAutoResponse } from "src/shared/decorators/api-auto-response.decorator";
import { SuccessResponse } from "src/shared/models/response-model";

@ApiTags(StaticDocsController.name)
@ApiBearerAuth('jwt')
@Controller('static-docs')
export class StaticDocsController {
    constructor(private readonly statDocsService: StaticDocsService) { }

    @Get('user-guides')
    @ApiOperation({ summary: 'Get user guides' })
    @ApiAutoResponse(StaticDocumentDto, { status: 200, description: 'User guides fetched successfully', isArray: true, wrapInSuccessResponse: true })
    async getUserGuides(): Promise<SuccessResponse<StaticDocumentDto[]>> {
        return new SuccessResponse(
            await this.statDocsService.getUserGuides()
        );
    }

    @Get('policies')
    @ApiOperation({ summary: 'Get policies' })
    @ApiAutoResponse(StaticDocumentDto, { status: 200, description: 'Policies fetched successfully', isArray: true, wrapInSuccessResponse: true })
    async getPolicies(): Promise<SuccessResponse<StaticDocumentDto[]>> {
        return new SuccessResponse(
            await this.statDocsService.getPolicyDocs()
        );
    }
}