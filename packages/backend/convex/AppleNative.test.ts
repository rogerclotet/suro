import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { verifyAppleIdentityToken } from "./AppleNative";

const ISSUER = "https://appleid.apple.com";
const AUDIENCE = "dev.clotet.suro";
const KID = "test-key";

type KeyPair = Awaited<ReturnType<typeof generateKeyPair>>;

let privateKey: KeyPair["privateKey"];
let jwks: ReturnType<typeof createLocalJWKSet>;
let wrongKeyJwks: ReturnType<typeof createLocalJWKSet>;

async function localJwks(
  publicKey: KeyPair["publicKey"],
): Promise<ReturnType<typeof createLocalJWKSet>> {
  const jwk = await exportJWK(publicKey);
  return createLocalJWKSet({ keys: [{ ...jwk, kid: KID, alg: "RS256" }] });
}

type Overrides = { iss?: string; aud?: string; expSeconds?: number };

function signToken(
  claims: Record<string, unknown>,
  overrides: Overrides = {},
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuedAt()
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? AUDIENCE)
    .setExpirationTime(
      overrides.expSeconds ?? Math.floor(Date.now() / 1000) + 300,
    )
    .sign(privateKey);
}

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateKey = pair.privateKey;
  jwks = await localJwks(pair.publicKey);
  // A second, unrelated key advertised under the same `kid` — a token signed by
  // our key must NOT verify against it (proves the signature is actually checked).
  const other = await generateKeyPair("RS256", { extractable: true });
  wrongKeyJwks = await localJwks(other.publicKey);
});

describe("verifyAppleIdentityToken", () => {
  it("accepts a valid token and lowercases the email", async () => {
    const token = await signToken({ sub: "001.abc", email: "Me@Example.com" });
    expect(await verifyAppleIdentityToken(token, [AUDIENCE], jwks)).toEqual({
      sub: "001.abc",
      email: "me@example.com",
    });
  });

  it("accepts a token with no email", async () => {
    const token = await signToken({ sub: "001.abc" });
    expect(await verifyAppleIdentityToken(token, [AUDIENCE], jwks)).toEqual({
      sub: "001.abc",
      email: undefined,
    });
  });

  it("accepts any of multiple allowed audiences (e.g. Expo Go)", async () => {
    const token = await signToken({ sub: "x" }, { aud: "host.exp.Exponent" });
    const result = await verifyAppleIdentityToken(
      token,
      [AUDIENCE, "host.exp.Exponent"],
      jwks,
    );
    expect(result.sub).toBe("x");
  });

  it("rejects a wrong audience", async () => {
    const token = await signToken({ sub: "x" }, { aud: "com.evil.app" });
    await expect(
      verifyAppleIdentityToken(token, [AUDIENCE], jwks),
    ).rejects.toThrow();
  });

  it("rejects a wrong issuer", async () => {
    const token = await signToken(
      { sub: "x" },
      { iss: "https://evil.example" },
    );
    await expect(
      verifyAppleIdentityToken(token, [AUDIENCE], jwks),
    ).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const token = await signToken(
      { sub: "x" },
      { expSeconds: Math.floor(Date.now() / 1000) - 60 },
    );
    await expect(
      verifyAppleIdentityToken(token, [AUDIENCE], jwks),
    ).rejects.toThrow();
  });

  it("rejects a token signed by a different key", async () => {
    const token = await signToken({ sub: "x" });
    await expect(
      verifyAppleIdentityToken(token, [AUDIENCE], wrongKeyJwks),
    ).rejects.toThrow();
  });

  it("rejects a token missing sub", async () => {
    const token = await signToken({ email: "a@b.com" });
    await expect(
      verifyAppleIdentityToken(token, [AUDIENCE], jwks),
    ).rejects.toThrow(/sub/);
  });
});
