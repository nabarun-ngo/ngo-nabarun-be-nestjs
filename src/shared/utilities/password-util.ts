interface PasswordOptions {
  length: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

export function generatePassword(options: PasswordOptions): string {
  const {
    length,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let characterSet = '';
  if (includeUppercase) characterSet += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) characterSet += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) characterSet += '0123456789';
  if (includeSymbols) characterSet += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!characterSet) {
    throw new Error('At least one character type must be included.');
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characterSet.length);
    password += characterSet[randomIndex];
  }

  return password;
}


/**
 * Generates an n-digit number with all unique digits.
 * @param n Number of digits (1 to 10)
 * @returns A unique n-digit number
 * @throws Error if n is out of range
 */
export function generateUniqueNDigitNumber(n: number): number {
    // Validate input
    if (!Number.isInteger(n) || n < 1 || n > 10) {
        throw new Error("n must be an integer between 1 and 10 (inclusive).");
    }

    // Digits pool
    const digits: number[] = Array.from({ length: 10 }, (_, i) => i);

    // Ensure first digit is not zero if n > 1
    if (n > 1) {
        const nonZeroIndex = Math.floor(Math.random() * 9) + 1; // index 1-9
        const firstDigit = digits.splice(nonZeroIndex, 1)[0];
        const resultDigits = [firstDigit];

        // Pick remaining digits randomly
        for (let i = 1; i < n; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            resultDigits.push(digits.splice(randomIndex, 1)[0]);
        }

        return parseInt(resultDigits.join(""), 10);
    } else {
        // n = 1 → can be 0-9
        return digits[Math.floor(Math.random() * 10)];
    }
}