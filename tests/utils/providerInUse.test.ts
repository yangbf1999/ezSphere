import { describe, expect, it } from "vitest";
import {
  resolveProviderInUse,
  resolveStoredCurrent,
} from "@/utils/providerInUse";

describe("resolveStoredCurrent", () => {
  it("isOmo 时用 omoCurrentId 判断", () => {
    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "omo-1",
        storedCurrentId: "other",
        omoCurrentId: "omo-1",
        isOmo: true,
      }),
    ).toBe(true);

    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "omo-2",
        storedCurrentId: "omo-2",
        omoCurrentId: "omo-1",
        isOmo: true,
      }),
    ).toBe(false);
  });

  it("isOmoSlim 时用 omoSlimCurrentId 判断", () => {
    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "slim-1",
        storedCurrentId: "other",
        omoSlimCurrentId: "slim-1",
        isOmoSlim: true,
      }),
    ).toBe(true);

    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "slim-2",
        storedCurrentId: "slim-2",
        omoSlimCurrentId: "slim-1",
        isOmoSlim: true,
      }),
    ).toBe(false);
  });

  it("isOmo 优先于 isOmoSlim", () => {
    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "omo-1",
        storedCurrentId: "x",
        omoCurrentId: "omo-1",
        omoSlimCurrentId: "slim-1",
        isOmo: true,
        isOmoSlim: true,
      }),
    ).toBe(true);
  });

  it("hermes 用 hermesCurrentId 判断", () => {
    expect(
      resolveStoredCurrent({
        appId: "hermes",
        providerId: "hermes-prov",
        storedCurrentId: "other",
        hermesCurrentId: "hermes-prov",
      }),
    ).toBe(true);

    expect(
      resolveStoredCurrent({
        appId: "hermes",
        providerId: "hermes-prov",
        storedCurrentId: "hermes-prov",
        hermesCurrentId: "another",
      }),
    ).toBe(false);
  });

  it("hermes 的 hermesCurrentId 为 null 时返回 false", () => {
    expect(
      resolveStoredCurrent({
        appId: "hermes",
        providerId: "hermes-prov",
        storedCurrentId: "hermes-prov",
        hermesCurrentId: null,
      }),
    ).toBe(false);
  });

  it("其余 app 用 storedCurrentId 判断", () => {
    expect(
      resolveStoredCurrent({
        appId: "claude",
        providerId: "prov-1",
        storedCurrentId: "prov-1",
      }),
    ).toBe(true);

    expect(
      resolveStoredCurrent({
        appId: "codex",
        providerId: "prov-1",
        storedCurrentId: "prov-2",
      }),
    ).toBe(false);
  });

  it("omoCurrentId 为空字符串时 omo 判断返回 false（falsy 回退）", () => {
    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "any",
        storedCurrentId: "any",
        omoCurrentId: "",
        isOmo: true,
      }),
    ).toBe(false);
  });

  it("omoSlimCurrentId 为 null 时 slim 判断返回 false", () => {
    expect(
      resolveStoredCurrent({
        appId: "opencode",
        providerId: "any",
        storedCurrentId: "any",
        omoSlimCurrentId: null,
        isOmoSlim: true,
      }),
    ).toBe(false);
  });
});

describe("resolveProviderInUse", () => {
  it("isOmo 时直接返回 isCurrent", () => {
    expect(
      resolveProviderInUse({
        appId: "opencode",
        providerId: "p1",
        isCurrent: true,
        isOmo: true,
      }),
    ).toBe(true);

    expect(
      resolveProviderInUse({
        appId: "opencode",
        providerId: "p1",
        isCurrent: false,
        isOmo: true,
      }),
    ).toBe(false);
  });

  it("isOmoSlim 时直接返回 isCurrent", () => {
    expect(
      resolveProviderInUse({
        appId: "opencode",
        providerId: "p1",
        isCurrent: true,
        isOmoSlim: true,
      }),
    ).toBe(true);
  });

  it("isOmo 和 isOmoSlim 同时为 true 时仍返回 isCurrent", () => {
    expect(
      resolveProviderInUse({
        appId: "opencode",
        providerId: "p1",
        isCurrent: false,
        isOmo: true,
        isOmoSlim: true,
      }),
    ).toBe(false);
  });

  it("openclaw 返回 isDefaultModel", () => {
    expect(
      resolveProviderInUse({
        appId: "openclaw",
        providerId: "p1",
        isCurrent: false,
        isDefaultModel: true,
      }),
    ).toBe(true);

    expect(
      resolveProviderInUse({
        appId: "openclaw",
        providerId: "p1",
        isCurrent: true,
        isDefaultModel: false,
      }),
    ).toBe(false);
  });

  it("opencode（非 OMO）始终返回 false", () => {
    expect(
      resolveProviderInUse({
        appId: "opencode",
        providerId: "p1",
        isCurrent: true,
      }),
    ).toBe(false);
  });

  it("故障转移模式开启时用 activeProviderId 判断", () => {
    expect(
      resolveProviderInUse({
        appId: "claude",
        providerId: "active-prov",
        isCurrent: false,
        isFailoverModeActive: true,
        activeProviderId: "active-prov",
      }),
    ).toBe(true);

    expect(
      resolveProviderInUse({
        appId: "claude",
        providerId: "inactive-prov",
        isCurrent: true,
        isFailoverModeActive: true,
        activeProviderId: "active-prov",
      }),
    ).toBe(false);
  });

  it("普通模式返回 isCurrent", () => {
    expect(
      resolveProviderInUse({
        appId: "claude",
        providerId: "p1",
        isCurrent: true,
      }),
    ).toBe(true);

    expect(
      resolveProviderInUse({
        appId: "gemini",
        providerId: "p1",
        isCurrent: false,
      }),
    ).toBe(false);
  });

  it("OMO 优先于 openclaw 和故障转移", () => {
    // isOmo 在最前面判断，即使 appId 是 openclaw 或开了故障转移
    expect(
      resolveProviderInUse({
        appId: "openclaw",
        providerId: "p1",
        isCurrent: true,
        isOmo: true,
        isDefaultModel: false,
        isFailoverModeActive: true,
        activeProviderId: "other",
      }),
    ).toBe(true);
  });

  it("故障转移模式 activeProviderId 为 undefined 时返回 false", () => {
    expect(
      resolveProviderInUse({
        appId: "claude",
        providerId: "p1",
        isCurrent: true,
        isFailoverModeActive: true,
      }),
    ).toBe(false);
  });
});
