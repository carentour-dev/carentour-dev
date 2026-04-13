import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const workspaceRoot = process.cwd();
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function resolveFileCandidate(basePath) {
  const candidates = [basePath];

  if (!path.extname(basePath)) {
    for (const extension of sourceExtensions) {
      candidates.push(`${basePath}${extension}`);
    }
    for (const extension of sourceExtensions) {
      candidates.push(path.join(basePath, `index${extension}`));
    }
  } else if (basePath.endsWith(".js")) {
    candidates.push(basePath.slice(0, -3));
    candidates.push(`${basePath.slice(0, -3)}.ts`);
    candidates.push(`${basePath.slice(0, -3)}.tsx`);
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveWorkspaceSpecifier(specifier, parentURL) {
  if (specifier.startsWith("@/")) {
    return resolveFileCandidate(
      path.join(workspaceRoot, "src", specifier.slice(2)),
    );
  }

  if (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/")
  ) {
    const parentPath = parentURL
      ? fileURLToPath(parentURL)
      : path.join(workspaceRoot, "__entry__.ts");
    const absolutePath = specifier.startsWith("/")
      ? specifier
      : path.resolve(path.dirname(parentPath), specifier);

    return resolveFileCandidate(absolutePath);
  }

  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }

    const resolvedPath = resolveWorkspaceSpecifier(
      specifier,
      context.parentURL,
    );

    if (!resolvedPath) {
      throw error;
    }

    return {
      url: pathToFileURL(resolvedPath).href,
      shortCircuit: true,
    };
  }
}
