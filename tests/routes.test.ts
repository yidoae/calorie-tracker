import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authPath, ROUTES, safeReturnPath } from "@/lib/routes";

describe("safeReturnPath", () => {
  it("keeps same-site paths", () => {
    assert.equal(safeReturnPath("/plan"), "/plan");
    assert.equal(safeReturnPath("/plan?duzenle=1"), "/plan?duzenle=1");
  });

  it("blocks open redirects and junk", () => {
    // Tabs/newlines are stripped by browsers, so "/<TAB>/evil.com" would become "//evil.com".
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "/ /evil.com", "evil", "", null, 42, undefined]) {
      assert.equal(safeReturnPath(bad), ROUTES.panel, String(bad));
    }
  });

  it("never returns to the auth, landing or setup pages", () => {
    for (const p of ["/", ROUTES.landing, ROUTES.login, `${ROUTES.register}?x=1`, ROUTES.onboarding]) {
      assert.equal(safeReturnPath(p), ROUTES.panel, p);
    }
  });
});

describe("authPath", () => {
  it("adds ?sonra= only when the page is worth returning to", () => {
    assert.equal(authPath("login", "/gelisim"), "/giris-yap?sonra=%2Fgelisim");
    assert.equal(authPath("register", "/panel"), "/kayit-ol");
    assert.equal(authPath("login", "/giris"), "/giris-yap");
    assert.equal(authPath("login"), "/giris-yap");
  });
});
