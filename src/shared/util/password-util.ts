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