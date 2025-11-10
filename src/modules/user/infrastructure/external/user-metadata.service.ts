import { Injectable } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { Role } from "../../domain/model/role.model";
import { parseKeyValueConfigs } from "src/shared/utilities/kv-config.util";

@Injectable()
export class UserMetadataService {
    constructor(private readonly configService: RemoteConfigService) { }

    async getAllRoles(): Promise<Role[]> {
        const remoteConfig = await this.configService.getAllKeyValues();
        const roles = parseKeyValueConfigs(remoteConfig['USER_ROLES'].value);
        return roles.map(r => new Role('', r.KEY, r.VALUE, r.getAttribute<string>('AUTH0_ROLE'),r.getAttribute<boolean>('DEFAULT')));
    }
}