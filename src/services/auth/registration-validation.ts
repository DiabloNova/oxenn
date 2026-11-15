export type RegistrationLocale = "fa" | "en";

export type EmailValidationError = "EMAIL_REQUIRED" | "EMAIL_ENGLISH_ONLY" | "EMAIL_DOMAIN_UPPERCASE" | "EMAIL_HYPHEN_NOT_ALLOWED" | "EMAIL_INVALID_FORMAT";

export function getEmailValidationError(email: string): EmailValidationError | null {
  const value = email.trim();
  if (!value) return "EMAIL_REQUIRED";
  if (!/^[\x00-\x7F]+$/.test(value)) return "EMAIL_ENGLISH_ONLY";
  const at = value.indexOf("@");
  if (at >= 0 && /[A-Z]/.test(value.slice(at + 1))) return "EMAIL_DOMAIN_UPPERCASE";
  if (value.includes("-")) return "EMAIL_HYPHEN_NOT_ALLOWED";
  if (!/^[A-Za-z0-9._+]+@[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(value)) return "EMAIL_INVALID_FORMAT";
  const local = value.slice(0, at);
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return "EMAIL_INVALID_FORMAT";
  return null;
}

export function emailLocalPartHasUppercase(email: string): boolean {
  const at = email.indexOf("@");
  return /[A-Z]/.test(at < 0 ? email : email.slice(0, at));
}

export function passwordHasUppercase(password: string): boolean { return /[A-Z]/.test(password); }

export type PasswordValidationError = "PASSWORD_REQUIRED" | "PASSWORD_TOO_SHORT" | "PASSWORD_TOO_LONG" | "PASSWORD_ENGLISH_ONLY" | "PASSWORD_UPPERCASE_REQUIRED" | "PASSWORD_NUMBER_REQUIRED" | "PASSWORD_TWO_SPECIAL_REQUIRED";

export function getPasswordValidationError(password: string): PasswordValidationError | null {
  if (!password) return "PASSWORD_REQUIRED";
  if (password.length < 10) return "PASSWORD_TOO_SHORT";
  if (password.length > 255) return "PASSWORD_TOO_LONG";
  if (!/^[\x21-\x7E]+$/.test(password)) return "PASSWORD_ENGLISH_ONLY";
  if (!/[A-Z]/.test(password)) return "PASSWORD_UPPERCASE_REQUIRED";
  if (!/[0-9]/.test(password)) return "PASSWORD_NUMBER_REQUIRED";
  if ((password.match(/[^A-Za-z0-9]/g) ?? []).length < 2) return "PASSWORD_TWO_SPECIAL_REQUIRED";
  return null;
}

export type NameValidationError = "NAME_REQUIRED" | "NAME_LOCALE_MISMATCH";
export function getPersonNameValidationError(name: string, locale: RegistrationLocale): NameValidationError | null {
  const value = name.trim();
  if (!value) return "NAME_REQUIRED";
  if (locale === "fa") {
    return /^[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06BE\u06CC\u06C0\u06C1]+(?:[ \u200c][\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06BE\u06CC\u06C0\u06C1]+)*$/u.test(value) ? null : "NAME_LOCALE_MISMATCH";
  }
  return /^[A-Za-z]+(?:[ '\u2019-][A-Za-z]+)*$/.test(value) ? null : "NAME_LOCALE_MISMATCH";
}

export function getUsernameValidationError(username: string): "USERNAME_REQUIRED" | "USERNAME_INVALID" | null {
  const value = username.trim();
  if (!value) return "USERNAME_REQUIRED";
  if (value.length < 3 || value.length > 32 || !/^[\p{L}\p{N}._-]+$/u.test(value)) return "USERNAME_INVALID";
  return null;
}
