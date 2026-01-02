import { Injectable } from "@nestjs/common";

import { parsefromString } from "src/shared/utilities/kv-config.util";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";


@Injectable()
export class ContentService {

    constructor(private readonly remoteConfig: RemoteConfigService,

    ) { }


    async getPublicContent(): Promise<any> {
        const config = (await this.remoteConfig.getAllKeyValues())['PUBLIC_CONTENT'];
        return parsefromString<any>(config.value);
    }

}