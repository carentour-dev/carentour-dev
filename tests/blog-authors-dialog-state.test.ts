import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("blog author dialog resets local form state when the selected author changes", () => {
  const source = readSource("src/app/(internal)/cms/blog/authors/page.tsx");

  assert.match(source, /import \{ useEffect, useState \} from "react"/);
  assert.match(source, /useEffect\(\(\) => \{/);
  assert.match(source, /setAuthorType\(initialAuthorType\)/);
  assert.match(source, /setUserId\(initialUserId\)/);
  assert.match(source, /setName\(initialName\)/);
  assert.match(source, /setSlug\(initialSlug\)/);
  assert.match(source, /setEmail\(initialEmail\)/);
  assert.match(source, /setBio\(initialBio\)/);
  assert.match(source, /setAvatar\(initialAvatar\)/);
  assert.match(source, /setWebsite\(initialWebsite\)/);
  assert.match(source, /setTwitter\(initialTwitter\)/);
  assert.match(source, /setLinkedin\(initialLinkedin\)/);
  assert.match(source, /setGithub\(initialGithub\)/);
  assert.match(source, /setActive\(initialActive\)/);
  assert.match(source, /setStatus\(initialStatus\)/);
  assert.match(source, /author\?\.id/);
});
