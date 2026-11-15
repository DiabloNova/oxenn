import { describe, expect, it } from "vitest";
import {
  emailLocalPartHasUppercase,
  getEmailValidationError,
  getPasswordValidationError,
  getPersonNameValidationError,
  getUsernameValidationError,
  passwordHasUppercase,
} from "@/services/auth/registration-validation";

describe("registration validation", () => {
  it("accepts the x@x.x shape with a lowercase domain", () => {
    expect(getEmailValidationError("x@x.x")).toBeNull();
    expect(getEmailValidationError("User.Name+tag@sub.example.com")).toBeNull();
  });

  it("allows and warns about uppercase letters only in the email local-part", () => {
    expect(getEmailValidationError("User@domain.com")).toBeNull();
    expect(emailLocalPartHasUppercase("User@domain.com")).toBe(true);
    expect(emailLocalPartHasUppercase("user@domain.com")).toBe(false);
  });

  it("blocks uppercase domains, hyphens, non-English email and malformed addresses", () => {
    expect(getEmailValidationError("user@Domain.com")).toBe("EMAIL_DOMAIN_UPPERCASE");
    expect(getEmailValidationError("user-name@domain.com")).toBe("EMAIL_HYPHEN_NOT_ALLOWED");
    expect(getEmailValidationError("کاربر@domain.com")).toBe("EMAIL_ENGLISH_ONLY");
    expect(getEmailValidationError("userdomain.com")).toBe("EMAIL_INVALID_FORMAT");
  });

  it("enforces ASCII password, length, uppercase, digit and two special characters", () => {
    expect(getPasswordValidationError("Aa123456!!")).toBeNull();
    expect(getPasswordValidationError("aa123456!!")).toBe("PASSWORD_UPPERCASE_REQUIRED");
    expect(getPasswordValidationError("Aaabcdef!!")).toBe("PASSWORD_NUMBER_REQUIRED");
    expect(getPasswordValidationError("Aa1234567!")).toBe("PASSWORD_TWO_SPECIAL_REQUIRED");
    expect(getPasswordValidationError("Aa12345 !!")).toBeNull();
    expect(getPasswordValidationError("Aa123456!پ")).toBe("PASSWORD_ENGLISH_ONLY");
    expect(getPasswordValidationError("Aa123!")).toBe("PASSWORD_TOO_SHORT");
    expect(passwordHasUppercase("Aa123456!!")).toBe(true);
  });

  it("enforces locale-specific first and last names", () => {
    expect(getPersonNameValidationError("علی", "fa")).toBeNull();
    expect(getPersonNameValidationError("رضا احمدی", "fa")).toBeNull();
    expect(getPersonNameValidationError("John", "fa")).toBe("NAME_LOCALE_MISMATCH");
    expect(getPersonNameValidationError("John Doe", "en")).toBeNull();
    expect(getPersonNameValidationError("علی", "en")).toBe("NAME_LOCALE_MISMATCH");
  });

  it("validates usernames", () => {
    expect(getUsernameValidationError("my.user_1")).toBeNull();
    expect(getUsernameValidationError("ab")).toBe("USERNAME_INVALID");
    expect(getUsernameValidationError("user name")).toBe("USERNAME_INVALID");
  });
});
