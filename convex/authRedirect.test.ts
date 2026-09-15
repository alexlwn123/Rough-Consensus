import { describe, expect, it } from "vitest";
import { authRedirect } from "./lib/authRedirect";

const site = "https://consensus.lwn.lol";
const alias = "https://rough-consensus.vercel.app";
describe("OAuth return destinations", () => {
  it("supports the canonical origin and explicitly configured aliases", () => {
    expect(authRedirect("/auth/callback", site)).toBe(`${site}/auth/callback`);
    expect(authRedirect(`${alias}/auth/callback`, site, alias)).toBe(
      `${alias}/auth/callback`,
    );
  });
  it.each([
    "https://consensus.lwn.lol.attacker.example/auth/callback",
    "//attacker.example/auth/callback",
    "https://consensus.lwn.lol@attacker.example/auth/callback",
    "https://user:password@consensus.lwn.lol/auth/callback",
    "http://consensus.lwn.lol/auth/callback",
    "https://consensus.lwn.lol:444/auth/callback",
    "https://consensus.lwn.lol/another-path",
    "https://consensus.lwn.lol/auth/callback?code=injected",
    "https://consensus.lwn.lol/auth/callback#fragment",
    "javascript:alert(1)",
    `${alias}/auth/callback`,
  ])("rejects an unapproved or malformed destination: %s", (value) => {
    expect(() => authRedirect(value, site)).toThrow();
  });
});
