import { Module } from '@nestjs/common';
import { RemoteConfigService } from './remote-config/remote-config.service';
import { FirebaseCoreModule } from './firebase-core.module';
import { FirebaseStorageService } from './storage/firebase-storage.service';


@Module({
    imports: [FirebaseCoreModule],
    providers: [
        RemoteConfigService,
        FirebaseStorageService
    ],
    exports: [
        FirebaseStorageService,
        RemoteConfigService
    ],
})
export class FirebaseModule { }