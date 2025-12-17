import { randomUUID } from "crypto";
import { BaseDomain } from "src/shared/models/base-domain";

export enum DocumentMappingRefType {
    DONATION = 'DONATION',
    PROFILE = 'PROFILE',
    TRANSACTION = 'TRANSACTION',
    EXPENSE = 'EXPENSE',
    EARNING = 'EARNING'
}

export class DocumentMapping extends BaseDomain<string> {
    constructor(
        _id: string,
        private _refId: string,
        private _refType: DocumentMappingRefType,
        _createdAt?: Date,
    ) {
        super(_id, _createdAt);
    }

    static create(params: {
        refId: string;
        refType: DocumentMappingRefType;
    }) {
        return new DocumentMapping(
            randomUUID(),
            params.refId,
            params.refType,
            new Date()
        );
    }

    get refId() {
        return this._refId;
    }
    get refType() {
        return this._refType;
    }
}