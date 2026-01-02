import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Configkey } from "src/shared/config-keys";

export const FIREBASE_ADMIN = Symbol("FIREBASE_ADMIN");
import * as admin from 'firebase-admin';

@Module({
    providers: [
        {
            provide: FIREBASE_ADMIN,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const serviceAccount = config.get<string>(Configkey.FIREBASE_CREDENTIAL)!;
                return admin.initializeApp({
                    credential: admin.credential.cert(JSON.parse(serviceAccount)),
                    storageBucket : config.get<string>(Configkey.FIREBASE_FILESTORAGE_BUCKET),
                });
            },
        }
    ],
    exports: [FIREBASE_ADMIN],
})
export class FirebaseCoreModule { }