import { Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { BaseDomain } from 'src/shared/domain/base-domain';

@Expose()
export class PhoneNumber extends BaseDomain<string> {
  constructor(
    protected _id: string,
    private _phoneCode: string,
    private _phoneNumber: string,
    private _hidden = false,
  ) {
    super(_id);
  }

  get fullNumber(): string {
    return `+${this._phoneCode} ${this._phoneNumber}`;
  }

  public static create(
    phoneCode: string,
    phoneNumber: string,
    hidden = false,
    primary = false,
  ): PhoneNumber {
    if (!phoneCode || !phoneNumber) {
      throw new Error('phoneCode and phoneNumber are required');
    }
    return new PhoneNumber(randomUUID(), phoneCode, phoneNumber, hidden);
  }

  public hide(): void {
    this._hidden = true;
  }

  /**
   * Getters
   */

  get id(): string {
    return this._id;
  }

  get phoneCode(): string {
    return this._phoneCode;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get hidden(): boolean {
    return this._hidden;
  }
}
