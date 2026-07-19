import { describe, it, expect, vi } from "vitest";
import { parseSkillError, formatSkillError } from "@/lib/errors/skillErrorParser";
import type { TFunction } from "i18next";

/**
 * Mock TFunction: returns the i18n key itself so tests can assert on which
 * key was selected. Ignores interpolation options.
 */
function createMockT() {
  const fn = vi.fn((key: string) => key);
  return fn as unknown as TFunction;
}

// ---------------------------------------------------------------------------
// parseSkillError
// ---------------------------------------------------------------------------

describe("parseSkillError", () => {
  it("parses valid JSON with code and context", () => {
    const input = JSON.stringify({
      code: "SKILL_NOT_FOUND",
      context: { skillName: "my-skill" },
    });
    const result = parseSkillError(input);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("SKILL_NOT_FOUND");
    expect(result!.context).toEqual({ skillName: "my-skill" });
  });

  it("includes suggestion when present", () => {
    const input = JSON.stringify({
      code: "DOWNLOAD_FAILED",
      context: { repoUrl: "https://github.com/x/y" },
      suggestion: "checkNetwork",
    });
    const result = parseSkillError(input);
    expect(result!.suggestion).toBe("checkNetwork");
  });

  it("returns null for valid JSON missing code", () => {
    const input = JSON.stringify({ context: { foo: "bar" } });
    expect(parseSkillError(input)).toBeNull();
  });

  it("returns null for valid JSON missing context", () => {
    const input = JSON.stringify({ code: "SOME_CODE" });
    expect(parseSkillError(input)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseSkillError("not json at all")).toBeNull();
    expect(parseSkillError("{invalid}")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseSkillError("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatSkillError
// ---------------------------------------------------------------------------

describe("formatSkillError", () => {
  it("returns raw string as description for non-JSON errors", () => {
    const t = createMockT();
    const result = formatSkillError("something went wrong", t);
    expect(result.title).toBe("skills.installFailed"); // default title key
    expect(result.description).toBe("something went wrong");
  });

  it("falls back to common.error when error string is empty", () => {
    const t = createMockT();
    const result = formatSkillError("", t);
    expect(result.title).toBe("skills.installFailed");
    expect(result.description).toBe("common.error");
  });

  it("uses custom defaultTitle", () => {
    const t = createMockT();
    const result = formatSkillError("err", t, "skills.uninstallFailed");
    expect(result.title).toBe("skills.uninstallFailed");
  });

  it("maps known error code to its i18n key", () => {
    const t = createMockT();
    const errorStr = JSON.stringify({
      code: "SKILL_NOT_FOUND",
      context: { skillName: "test" },
    });
    const result = formatSkillError(errorStr, t);
    expect(result.description).toBe("skills.error.skillNotFound");
    // verify context was passed as second arg to t()
    expect(t).toHaveBeenCalledWith("skills.error.skillNotFound", {
      skillName: "test",
    });
  });

  it("maps all known error codes", () => {
    const knownCodes: Record<string, string> = {
      SKILL_NOT_FOUND: "skills.error.skillNotFound",
      MISSING_REPO_INFO: "skills.error.missingRepoInfo",
      DOWNLOAD_TIMEOUT: "skills.error.downloadTimeout",
      DOWNLOAD_FAILED: "skills.error.downloadFailed",
      SKILL_DIR_NOT_FOUND: "skills.error.skillDirNotFound",
      SKILL_DIRECTORY_CONFLICT: "skills.error.directoryConflict",
      EMPTY_ARCHIVE: "skills.error.emptyArchive",
      GET_HOME_DIR_FAILED: "skills.error.getHomeDirFailed",
      NO_SKILLS_IN_ZIP: "skills.error.noSkillsInZip",
      SKILL_ALREADY_EXISTS: "skills.error.alreadyExists",
    };

    for (const [code, expectedKey] of Object.entries(knownCodes)) {
      const t = createMockT();
      const errorStr = JSON.stringify({ code, context: {} });
      const result = formatSkillError(errorStr, t);
      expect(result.description).toBe(expectedKey);
    }
  });

  it("maps unknown error code to unknownError key", () => {
    const t = createMockT();
    const errorStr = JSON.stringify({
      code: "TOTALLY_UNKNOWN",
      context: {},
    });
    const result = formatSkillError(errorStr, t);
    expect(result.description).toBe("skills.error.unknownError");
  });

  it("appends known suggestion text to description", () => {
    const t = createMockT();
    const errorStr = JSON.stringify({
      code: "DOWNLOAD_FAILED",
      context: { repoUrl: "https://github.com/x/y" },
      suggestion: "checkNetwork",
    });
    const result = formatSkillError(errorStr, t);
    expect(result.description).toBe(
      "skills.error.downloadFailed\n\nskills.error.suggestion.checkNetwork",
    );
  });

  it("appends unknown suggestion as-is (passthrough key)", () => {
    const t = createMockT();
    const errorStr = JSON.stringify({
      code: "DOWNLOAD_FAILED",
      context: {},
      suggestion: "someCustomSuggestion",
    });
    const result = formatSkillError(errorStr, t);
    expect(result.description).toBe(
      "skills.error.downloadFailed\n\nsomeCustomSuggestion",
    );
  });

  it("maps known suggestion codes", () => {
    const knownSuggestions: Record<string, string> = {
      checkNetwork: "skills.error.suggestion.checkNetwork",
      checkProxy: "skills.error.suggestion.checkProxy",
      retryLater: "skills.error.suggestion.retryLater",
      checkRepoUrl: "skills.error.suggestion.checkRepoUrl",
      checkPermission: "skills.error.suggestion.checkPermission",
      uninstallFirst: "skills.error.suggestion.uninstallFirst",
      checkZipContent: "skills.error.suggestion.checkZipContent",
      http403: "skills.error.http403",
      http404: "skills.error.http404",
      http429: "skills.error.http429",
    };

    for (const [suggestion, expectedKey] of Object.entries(knownSuggestions)) {
      const t = createMockT();
      const errorStr = JSON.stringify({
        code: "DOWNLOAD_FAILED",
        context: {},
        suggestion,
      });
      const result = formatSkillError(errorStr, t);
      expect(result.description).toBe(
        `skills.error.downloadFailed\n\n${expectedKey}`,
      );
    }
  });

  it("does not append suggestion when absent", () => {
    const t = createMockT();
    const errorStr = JSON.stringify({
      code: "SKILL_NOT_FOUND",
      context: {},
    });
    const result = formatSkillError(errorStr, t);
    expect(result.description).not.toContain("\n\n");
  });
});
