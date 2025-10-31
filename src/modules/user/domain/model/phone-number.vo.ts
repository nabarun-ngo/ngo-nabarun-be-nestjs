import { Expose } from "class-transformer";
import { randomUUID } from "crypto";
import { BaseDomain } from "src/shared/domain/base-domain";

@Expose()
export class PhoneNumber extends BaseDomain<string> {
    private phoneCode: string;
    private phoneNumber: string;
    private hidden: boolean;
    private primary: boolean;

    private constructor(phoneCode: string, phoneNumber: string, hidden = false, primary = false) {
        super(randomUUID());
        this.phoneCode = phoneCode;
        this.phoneNumber = phoneNumber;
        this.hidden = hidden;
        this.primary = primary;
    }

    get fullNumber(): string {
        return `+${this.phoneCode} ${this.phoneNumber}`;
    }
    
    public static create(phoneCode: string, phoneNumber: string, hidden = false, primary = false): PhoneNumber {
        if (!phoneCode || !phoneNumber) {
            throw new Error('phoneCode and phoneNumber are required');
        }
        return new PhoneNumber(phoneCode, phoneNumber, hidden, primary);
    }

    public hide(): void {
        this.hidden = true;
    }


}
