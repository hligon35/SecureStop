import {
    isStoredSessionExpired,
    parseStoredSession,
} from "@/lib/auth/sessionStorage";

describe("sessionStorage", () => {
  it("returns a valid unexpired stored session", () => {
    const now = 1_700_000_000_000;
    const raw = JSON.stringify({
      accessToken: "token-123",
      expiresAt: now + 60_000,
    });

    expect(parseStoredSession(raw, now)).toEqual({
      accessToken: "token-123",
      expiresAt: now + 60_000,
    });
  });

  it("rejects expired stored sessions", () => {
    const now = 1_700_000_000_000;
    const raw = JSON.stringify({
      accessToken: "token-123",
      expiresAt: now - 1,
    });

    expect(parseStoredSession(raw, now)).toBeUndefined();
    expect(
      isStoredSessionExpired(
        { accessToken: "token-123", expiresAt: now - 1 },
        now,
      ),
    ).toBe(true);
  });

  it("rejects malformed stored sessions without an access token", () => {
    const raw = JSON.stringify({ refreshToken: "refresh-only" });

    expect(parseStoredSession(raw)).toBeUndefined();
  });
});
