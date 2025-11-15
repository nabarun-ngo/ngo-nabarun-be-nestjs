import { User } from "src/modules/user/domain/model/user.model";
import { DocumentMapping, DocumentMappingRefType } from "./mapping.model";
import { randomUUID } from "crypto";
import { AggregateRoot } from "src/shared/models/aggregate-root";

export interface DocumentProps {
    refId: string;
    refType: DocumentMappingRefType;
}

export class Document extends AggregateRoot<string>{
    
    constructor(
        _id: string,
        private _fileName: string,
        private _remotePath: string,
        private _publicToken: string,
        private _contentType: string,
        private _fileSize: number,
        private _mappings: DocumentMapping[],
        private _isPublic: boolean,
        private _uploadedBy?: User,
        _createdAt?: Date,
        private _fileUrl?: string,
    ) { 
        super(_id, _createdAt);
    }


    static create(params: {
        fileName: string;
        contentType: string;
        fileSize: number;
        isPublic: boolean;
        mappedTo: DocumentMapping[];
        uploadedBy?: User;
    }) {
        return new Document(
            randomUUID(),
            params.fileName,
            randomUUID() + '-' + params.fileName,
            randomUUID(),
            params.contentType,
            params.fileSize,
            params.mappedTo,
            params.isPublic,
            params.uploadedBy,
        );
    }

    addMapping(mapping: DocumentMapping) {
        this._mappings.push(mapping);
        return mapping;
    }

    get id() {
        return this._id;
    }
    get fileName() {
        return this._fileName;
    }
    get remotePath() {
        return this._remotePath;
    }
    get publicToken() {
        return this._publicToken;
    }
    get contentType() {
        return this._contentType;
    }
    get fileSize() {
        return this._fileSize;
    }
    get mappings() {
        return this._mappings;
    }
    get isPublic() {
        return this._isPublic;
    }
    get uploadedBy() {
        return this._uploadedBy;
    }
   
    get fileUrl(): string | undefined {
        return this._fileUrl;
    }

    set fileUrl(url: string) {
        this._fileUrl = url;
    }
}