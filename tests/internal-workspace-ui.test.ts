import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const shellSource = read(
  "src/components/workspaces/InternalWorkspaceShell.tsx",
);
const topBarSource = read(
  "src/components/workspaces/WorkspaceModuleTopBar.tsx",
);
const primitiveSource = read(
  "src/components/workspaces/WorkspacePrimitives.tsx",
);

assert.match(
  shellSource,
  /<SidebarProvider[\s\S]*defaultOpen=\{sidebarDefaultOpen\}/,
  "shell should support expanded and collapsed sidebar smoke coverage",
);
assert.match(
  shellSource,
  /aria-current=\{item\.active \? "page" : undefined\}/,
  "shell nav items should surface active state markup",
);
assert.match(
  shellSource,
  /loadingMessage = "Refreshing workspace access\.\.\."/,
  "shell should expose a loading overlay message",
);

assert.match(
  topBarSource,
  /rightSlot \? \(/,
  "workspace top bar should render header actions",
);
assert.match(
  topBarSource,
  /aria-current=\{tab\.active \? "page" : undefined\}/,
  "module tabs should mark the active tab",
);

assert.match(
  primitiveSource,
  /export function WorkspaceEmptyState/,
  "empty state primitive should be present",
);
assert.match(
  primitiveSource,
  /export function WorkspacePageHeader/,
  "page header primitive should be present",
);

console.log("internal workspace ui smoke tests passed");
