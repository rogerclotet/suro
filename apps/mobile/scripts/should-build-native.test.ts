import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const repositories: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  for (const repository of repositories.splice(0)) {
    rmSync(repository, { recursive: true, force: true });
  }
});

function runGate({
  version = "1.25.6",
  changelog = "## [1.25.6] — 2026-09-08\n",
  changedPath = "packages/backend/convex/projects.ts",
} = {}) {
  const repository = mkdtempSync(join(tmpdir(), "suro-release-gate-"));
  repositories.push(repository);
  // Git hooks export repository paths; fixtures must never inherit those paths.
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("GIT_")) delete env[key];
  }
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: repository,
      env,
      encoding: "utf8",
    }).trim();
  const write = (path: string, contents: string) => {
    const target = join(repository, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  const commit = (message: string) => {
    git("add", ".");
    git("-c", "commit.gpgsign=false", "commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };

  git("init", "-q");
  git("config", "user.name", "Release gate test");
  git("config", "user.email", "release-gate@example.test");
  mkdirSync(join(repository, "apps/mobile/scripts"), { recursive: true });
  copyFileSync(
    new URL("./should-build-native.mjs", import.meta.url),
    join(repository, "apps/mobile/scripts/should-build-native.mjs"),
  );
  write("package.json", JSON.stringify({ version: "1.25.5" }));
  write("apps/web/CHANGELOG.md", "## [1.25.5] — 2026-09-06\n");
  const before = commit("Previous release");

  write("package.json", JSON.stringify({ version }));
  write("apps/web/CHANGELOG.md", changelog);
  write(changedPath, "// Release change\n");
  const after = commit("Release candidate");
  const outputPath = join(repository, "github-output");
  execFileSync(
    process.execPath,
    ["apps/mobile/scripts/should-build-native.mjs", before, after],
    {
      cwd: repository,
      env: {
        ...env,
        BEFORE_SHA: before,
        AFTER_SHA: after,
        GITHUB_OUTPUT: outputPath,
      },
    },
  );
  return readFileSync(outputPath, "utf8");
}

describe("mobile release gate", () => {
  it("isolates fixture repositories from the parent Git hook environment", () => {
    const parentGitDir = mkdtempSync(join(tmpdir(), "suro-parent-git-"));
    repositories.push(parentGitDir);
    const config = "[core]\n\tbare = true\n";
    writeFileSync(join(parentGitDir, "config"), config);
    vi.stubEnv("GIT_DIR", parentGitDir);
    vi.stubEnv("GIT_INDEX_FILE", join(parentGitDir, "index"));
    expect(runGate()).toContain("should_build=true\n");
    expect(readFileSync(join(parentGitDir, "config"), "utf8")).toBe(config);
  });

  it.each([
    "packages/backend/convex/projects.ts",
    "apps/web/src/components/group-list.tsx",
    "apps/mobile/store.config.json",
    "apps/mobile/src/components/group-switcher.tsx",
  ])("builds a versioned changelog release touching %s", (changedPath) => {
    expect(runGate({ changedPath })).toContain("should_build=true\n");
  });

  it("skips changes without a version bump", () => {
    const output = runGate({ version: "1.25.5" });
    expect(output).toContain("should_build=false\n");
    expect(output).toContain("no version bump");
  });

  it("skips a version bump without a changelog entry", () => {
    const output = runGate({ changelog: "# Changelog\n" });
    expect(output).toContain("should_build=false\n");
    expect(output).toContain("no version entry");
  });

  it("skips a version bump with a mismatched changelog", () => {
    const output = runGate({ changelog: "## [1.25.5] — 2026-09-06\n" });
    expect(output).toContain("should_build=false\n");
    expect(output).toContain("does not match package.json");
  });
});
