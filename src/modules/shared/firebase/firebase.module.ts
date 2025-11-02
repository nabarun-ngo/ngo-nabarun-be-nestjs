import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Configkey } from 'src/shared/config-keys';
import { RemoteConfigService } from './remote-config/remote-config.service';
import { FirebaseCoreModule } from './firebase-core.module';


@Module({
    imports: [FirebaseCoreModule],
    providers: [
        RemoteConfigService
    ],
    exports: [RemoteConfigService],
})
export class FirebaseModule { }