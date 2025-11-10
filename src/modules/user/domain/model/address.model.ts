import { randomUUID } from 'crypto';
import { BaseDomain } from '../../../../shared/models/base-domain';

export class Address extends BaseDomain<string> {
  
  constructor(
    protected _id: string,
    private _addressLine1: string,
    private _addressLine2: string | undefined = undefined,
    private _addressLine3: string | undefined = undefined,
    private _hometown: string,
    private _zipCode: string,
    private _state: string,
    private _district: string,
    private _country: string,
  ) {
    super(_id);
  }

  static create(addressLine1: string, addressLine2: string | undefined, addressLine3: string | undefined, hometown: string, zipCode: string, state: string, district: string, country: string): Address {
    return new Address(randomUUID(),addressLine1, addressLine2, addressLine3, hometown, zipCode, state, district, country);
  }

  public update(detail:Address){
    this._addressLine1 = detail.addressLine1;
    this._addressLine2 = detail.addressLine2;
    this._addressLine3 = detail.addressLine3;
    this._hometown = detail.hometown;
    this._zipCode = detail.zipCode;
    this._state = detail.state;
    this._district = detail.district;
    this._country = detail.country;
    this.touch();
    return this;
  }

  /**
   * Getters
   */

  get id(): string {
    return this._id;
  }

  get addressLine1(): string {
    return this._addressLine1;
  }

  get addressLine2(): string | undefined {
    return this._addressLine2;
  }

  get addressLine3(): string | undefined {
    return this._addressLine3;
  }

  get hometown(): string {
    return this._hometown;
  }

  get zipCode(): string {
    return this._zipCode;
  }

  get state(): string {
    return this._state;
  }

  get district(): string {
    return this._district;
  }

  get country(): string {
    return this._country;
  }
}
