import { BaseDomain } from '../../../../shared/domain/base-domain';

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
