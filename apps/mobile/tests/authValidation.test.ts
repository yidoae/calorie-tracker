import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailError, normalizeEmail, passwordError, PASSWORD_MIN_LENGTH } from "../src/hooks/authValidation.ts";

describe("e-mail validation", () => {
  it("accepts ordinary addresses, with spaces and capitals around them", () => {
    for (const email of ["ali@ornek.com", "  Ayse.Yilmaz+kalori@posta.com.tr ", "a@b.co"]) assert.equal(emailError(email), null, email);
  });

  it("asks for an address when the field is empty", () => {
    assert.equal(emailError("   "), "E-posta adresini yaz.");
  });

  it("rejects text that is not an address", () => {
    for (const email of ["ali", "ali@", "@ornek.com", "ali@ornek", "ali veli@ornek.com", "ali@@ornek.com"]) {
      assert.match(emailError(email) ?? "", /Geçerli bir e-posta/, email);
    }
  });

  it("normalizes without the Turkish dotless i (I → i, not ı)", () => {
    assert.equal(normalizeEmail("  ALI@ORNEK.COM "), "ali@ornek.com");
  });
});

describe("password validation", () => {
  it("requires at least 8 characters for a new password", () => {
    assert.equal(PASSWORD_MIN_LENGTH, 8);
    assert.match(passwordError("1234567", { isNew: true }) ?? "", /en az 8 karakter/);
    assert.equal(passwordError("12345678", { isNew: true }), null);
  });

  it("counts characters, not UTF-16 units", () => {
    assert.match(passwordError("şğüöçı🙂", { isNew: true }) ?? "", /en az 8 karakter/);
    assert.equal(passwordError("şğüöçı🙂x", { isNew: true }), null);
  });

  it("only asks for a non-empty password when signing in", () => {
    assert.equal(passwordError("", { isNew: false }), "Şifreni yaz.");
    assert.equal(passwordError("kısa", { isNew: false }), null);
    assert.equal(passwordError("", { isNew: true }), "Bir şifre belirle.");
  });
});
