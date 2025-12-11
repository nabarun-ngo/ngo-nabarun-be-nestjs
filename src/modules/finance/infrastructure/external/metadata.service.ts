import { Inject, Injectable, Logger } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { parsefromString } from "src/shared/utilities/kv-config.util";
import { KeyValueConfig } from "src/shared/models/key-value-config.model";

@Injectable()
export class MetadataService {
    private readonly logger = new Logger(MetadataService.name);
    constructor(private readonly configService: RemoteConfigService,
    ) { }

    async getReferenceData() {
        const keyValueConfigs = await this.configService.getAllKeyValues()
        const donation_status = parsefromString<KeyValueConfig[]>(keyValueConfigs['DONATION_STATUSES'].value);
        const donation_type = parsefromString<KeyValueConfig[]>(keyValueConfigs['DONATION_TYPES'].value)
        const payment_method = parsefromString<KeyValueConfig[]>(keyValueConfigs['PAYMENT_METHODS'].value)
        const upi_option = parsefromString<KeyValueConfig[]>(keyValueConfigs['UPI_OPTIONS'].value)

        return {
            donationStatus: donation_status,
            donationType: donation_type,
            paymentMethod: payment_method,
            upiOption: upi_option,
        }
    }

}