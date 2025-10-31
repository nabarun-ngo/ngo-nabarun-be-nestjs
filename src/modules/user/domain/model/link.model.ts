import { BaseDomain } from '../../../../shared/domain/base-domain';
import { randomUUID } from 'crypto';

export enum LinkType {
  FACEBOOK = 'facebook',
  WHATSAPP = 'whatsapp',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
}

export class Link extends BaseDomain<string> {
  constructor(
    protected _id: string,
    private _linkName: string,
    private _linkType: LinkType,
    private _linkValue: string,
  ) {
    super(_id);
  }

  static create(linkName: string, linkType: LinkType, linkValue: string) {
    return new Link(randomUUID(), linkName, linkType, linkValue);
  }


  get linkName(): string {
    return this._linkName;
  }

  get linkType(): LinkType {
    return this._linkType;
  }

  get linkValue(): string {
    return this._linkValue;
  }
}
