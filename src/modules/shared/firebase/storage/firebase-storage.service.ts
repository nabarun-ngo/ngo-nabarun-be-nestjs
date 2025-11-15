import { Inject, Injectable } from "@nestjs/common";
import { FIREBASE_ADMIN } from "../firebase-core.module";
import * as admin from 'firebase-admin';
import * as querystring from 'querystring';

@Injectable()
export class FirebaseStorageService {

    constructor(@Inject(FIREBASE_ADMIN) private readonly app: admin.app.App) { }

    async uploadFile(
        filePath: string,
        contentType: string,
        token: string,
        content: Buffer
    ): Promise<string> {
        const bucket = this.app.storage().bucket();
        const file = bucket.file(filePath);

        try {
            await file.save(content, {
                metadata: {
                    contentType,
                    metadata: {
                        firebaseStorageDownloadTokens: token,
                    },
                },
                resumable: false,
            });
            const encodedBucket = querystring.escape(bucket.name);
            const encodedFileName = querystring.escape(filePath);
            const encodedToken = querystring.escape(token);

            return `https://firebasestorage.googleapis.com/v0/b/${encodedBucket}/o/${encodedFileName}?alt=media&token=${encodedToken}`;
        } catch (error) {
            throw new Error(`Firebase upload failed: ${(error as Error).message}`);
        }
    }

    async deleteFile(fileName: string): Promise<void> {
        const bucket = this.app.storage().bucket();
        const file = bucket.file(fileName);

        try {
            await file.delete();
        } catch (error) {
            throw new Error(`Firebase delete failed: ${(error as Error).message}`);
        }
    }

    async getSignedUrl(fileName: string): Promise<string> {
        const bucket = this.app.storage().bucket();
        const file = bucket.file(fileName);

        try {
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            });
            return url;
        } catch (error) {
            throw new Error(`Firebase getSignedUrl failed: ${(error as Error).message}`);
        }
    }

}