import { BusinessException } from '../exceptions/business-exception';

export class ValidationUtil {
    /**
     * Validates that a value is defined and not empty (if string).
     * @param value The value to check
     * @param fieldName The name of the field for the error message
     * @param customMessage Optional custom error message
     * @throws BusinessException if validation fails
     */
    static validateRequired(value: any, fieldName: string, customMessage?: string): void {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            throw new BusinessException(customMessage || `${fieldName} is required`);
        }
    }

    /**
     * Validates that a value is defined if a condition is true.
     * @param value The value to check
     * @param condition The condition that triggers the requirement
     * @param fieldName The name of the field for the error message
     * @param customMessage Optional custom error message
     * @throws BusinessException if validation fails
     */
    static validateRequiredIf(value: any, condition: boolean, fieldName: string, customMessage?: string): void {
        if (condition) {
            this.validateRequired(value, fieldName, customMessage);
        }
    }
}
