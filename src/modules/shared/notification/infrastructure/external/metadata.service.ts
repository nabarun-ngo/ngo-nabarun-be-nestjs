import { Injectable } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { NotificationKeys } from "src/shared/notification-keys";
import { parseKeyValueConfigs } from "src/shared/utilities/kv-config.util";
import Handlebars from 'handlebars';

@Injectable()
export class MetadataService {
    constructor(private readonly configService: RemoteConfigService,
    ) { }

    async getNotification(notificationKey: NotificationKeys, data: Record<string, any>): Promise<{
        title: string,
        description: string,
        imageUrl?: string,
        actionUrl?: string,
    }> {
        const remoteConfig = await this.configService.getAllKeyValues();
        const value = remoteConfig['NOTIFICATION_METADATA'].value;
        const template = Handlebars.compile(value);
        const metadata = parseKeyValueConfigs(template(data));
        const notificationMetadata = metadata.find(m => m.KEY === notificationKey);
        if (!notificationMetadata) {
            throw new Error(`Notification metadata not found for key: ${notificationKey}`);
        }

        return {
            title: notificationMetadata?.VALUE!,
            description: notificationMetadata?.DESCRIPTION!,
            imageUrl: notificationMetadata?.getAttribute('IMAGE_URL'),
            actionUrl: notificationMetadata?.getAttribute('ACTION_URL')
        };
    }


}