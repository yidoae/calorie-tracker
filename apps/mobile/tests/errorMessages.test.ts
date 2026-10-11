import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthApiError, AuthPKCECodeVerifierMissingError, AuthRetryableFetchError, AuthSessionMissingError, AuthWeakPasswordError } from "@supabase/supabase-js";
import { describeError, MESSAGES } from "../src/services/errorMessages.ts";

const api = (code: string, message = "Some English text from the server") => new AuthApiError(message, 400, code);

describe("Supabase Auth errors", () => {
  it("map each known code to its Turkish message", () => {
    const cases: [string, keyof typeof MESSAGES][] = [
      ["invalid_credentials", "invalid_credentials"],
      ["email_not_confirmed", "email_not_confirmed"],
      ["user_already_exists", "user_already_exists"],
      ["email_exists", "user_already_exists"],
      ["same_password", "same_password"],
      ["email_address_invalid", "email_address_invalid"],
      ["email_address_not_authorized", "email_address_not_authorized"],
      ["over_email_send_rate_limit", "email_rate_limit"],
      ["over_request_rate_limit", "rate_limit"],
      ["otp_expired", "link_invalid"],
      ["flow_state_expired", "link_invalid"],
      ["flow_state_not_found", "link_invalid"],
      ["bad_code_verifier", "link_invalid"],
      ["session_not_found", "session_expired"],
      ["refresh_token_not_found", "session_expired"],
      ["signup_disabled", "signup_disabled"],
      ["email_provider_disabled", "provider_disabled"],
      ["provider_disabled", "provider_disabled"],
      ["user_banned", "user_banned"],
      ["identity_already_exists", "identity_already_exists"],
      ["request_timeout", "network"],
    ];
    for (const [server, expected] of cases) {
      assert.deepEqual(describeError(api(server)), { code: expected, message: MESSAGES[expected] }, server);
    }
  });

  it("map client-side auth errors by their kind", () => {
    assert.equal(describeError(new AuthWeakPasswordError("Password is too weak", 422, ["length"])).code, "weak_password");
    assert.equal(describeError(new AuthRetryableFetchError("Failed to fetch", 0)).code, "network");
    assert.equal(describeError(new AuthSessionMissingError()).code, "session_expired");
    assert.equal(describeError(new AuthPKCECodeVerifierMissingError()).code, "link_invalid");
  });

  it("never show the server's English text for an unknown auth error", () => {
    for (const code of ["captcha_failed", "something_new_from_a_later_server", ""]) {
      const { code: mapped, message } = describeError(api(code, "Captcha verification process failed"));
      assert.equal(mapped, "auth_failed", code);
      assert.equal(message, MESSAGES.auth_failed);
    }
  });
});

describe("database and other errors", () => {
  it("map database function codes found in the message", () => {
    assert.equal(describeError({ message: "plan_below_floor", code: "P0001" }).code, "plan_below_floor");
    assert.equal(describeError(new Error("meal_not_found")).code, "meal_not_found");
  });

  it("map the setup and plan codes of complete_onboarding and save_plan", () => {
    for (const code of ["invalid_answers", "invalid_plan", "already_completed", "onboarding_required"] as const) {
      assert.equal(describeError({ message: code, code: "22023" }).code, code);
    }
    assert.equal(describeError({ message: "not_authenticated", code: "42501" }).code, "session_expired");
  });

  it("treat fetch failures as a network problem and anything else as unexpected", () => {
    assert.equal(describeError(new TypeError("Network request failed")).code, "network");
    assert.equal(describeError("boom").code, "unexpected");
    assert.equal(describeError(null).code, "unexpected");
  });

  it("only contain Turkish, complete sentences", () => {
    for (const [code, message] of Object.entries(MESSAGES)) assert.match(message, /^[A-ZÇĞİÖŞÜ].*\.$/u, code);
  });
});
