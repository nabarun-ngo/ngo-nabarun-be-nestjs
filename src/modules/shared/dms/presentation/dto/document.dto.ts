export class DocumentDto{
    id: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    fileUrl?: string;
    isPublic: boolean;
    uploadedAt: Date;
}