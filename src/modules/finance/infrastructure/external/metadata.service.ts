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
        return {
            donationStatus: parsefromString<KeyValueConfig[]>(keyValueConfigs['DONATION_STATUSES'].value),
            donationType: parsefromString<KeyValueConfig[]>(keyValueConfigs['DONATION_TYPES'].value),
            paymentMethod: parsefromString<KeyValueConfig[]>(keyValueConfigs['PAYMENT_METHODS'].value),
            upiOption: parsefromString<KeyValueConfig[]>(keyValueConfigs['UPI_OPTIONS'].value),
            acc_status: parsefromString<KeyValueConfig[]>(keyValueConfigs['ACCOUNT_STATUSES'].value),
            acc_type: parsefromString<KeyValueConfig[]>(keyValueConfigs['ACCOUNT_TYPES'].value),
            txn_types: parsefromString<KeyValueConfig[]>(keyValueConfigs['TRANSACTION_TYPES'].value)
        }
    }

}