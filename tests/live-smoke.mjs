import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const PORT = Number(process.env.SMOKE_PORT ?? 3100);
const DEFAULT_BASE_URL = `http://${HOST}:${PORT}`;
const EXTERNAL_BASE_URL = process.env.SMOKE_BASE_URL?.trim() || null;
const STARTUP_TIMEOUT_MS = Number(
  process.env.SMOKE_STARTUP_TIMEOUT_MS ?? 120000,
);
const REQUEST_TIMEOUT_MS = Number(
  process.env.SMOKE_REQUEST_TIMEOUT_MS ?? 20000,
);
const REQUIRE_ARABIC = process.env.SMOKE_REQUIRE_ARABIC === "1";

function log(message) {
  process.stdout.write(`${message}\n`);
}

function createServerProcess() {
  return spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev", "--hostname", HOST, "--port", String(PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        __NEXT_DISABLE_MEMORY_WATCHER: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

async function waitForServer(server, getOutput) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    if (server.exitCode !== null) {
      const output = getOutput();
      if (output.includes("Another next dev server is already running")) {
        throw new Error(
          "Another `next dev` server is already running for this workspace. Stop it before running `npm run smoke`, or rerun with SMOKE_BASE_URL=http://localhost:3000 to target the existing server explicitly.",
        );
      }

      throw new Error(`Smoke server exited early with code ${server.exitCode}`);
    }

    try {
      const response = await fetch(`${DEFAULT_BASE_URL}/`, {
        redirect: "manual",
      });

      if (response.status < 500) {
        return {
          baseUrl: DEFAULT_BASE_URL,
        };
      }
    } catch (error) {
      lastError = error;
    }

    await delay(1000);
  }

  throw new Error(
    `Timed out waiting for smoke server at ${DEFAULT_BASE_URL}${
      lastError ? ` (${lastError.message})` : ""
    }`,
  );
}

async function readResponse(baseUrl, pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      redirect: "manual",
      signal: controller.signal,
      ...options,
    });
    const body = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `Timed out after ${REQUEST_TIMEOUT_MS}ms while requesting ${pathname}`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function assertDocument(response, pathname) {
  assert.equal(
    response.status,
    200,
    `${pathname} should render successfully, received ${response.status}`,
  );
  const contentType = response.headers.get("content-type") ?? "";
  assert.match(
    contentType,
    /text\/html/i,
    `${pathname} should return HTML, received ${contentType || "unknown"}`,
  );
  assert.ok(
    response.body.includes("<html"),
    `${pathname} should include an HTML document shell`,
  );
}

function assertMatchesAny(responseBody, patterns, message) {
  assert.ok(
    patterns.some((pattern) => pattern.test(responseBody)),
    message,
  );
}

const internalWorkspaceShellPatterns = [
  /data-internal-workspace-root="true"/i,
  /Session required/i,
  /Go to sign in/i,
  /Access denied/i,
];

async function readCheckedResponse(baseUrl, pathname, options) {
  log(`Checking ${pathname}`);
  return readResponse(baseUrl, pathname, options);
}

function assertJsonResponse(response, pathname) {
  const contentType = response.headers.get("content-type") ?? "";
  assert.match(
    contentType,
    /application\/json/i,
    `${pathname} should return JSON, received ${contentType || "unknown"}`,
  );
}

function parseJsonBody(response, pathname) {
  try {
    return JSON.parse(response.body);
  } catch (error) {
    throw new Error(`${pathname} returned invalid JSON: ${error}`);
  }
}

async function run() {
  const shouldSpawnServer = !EXTERNAL_BASE_URL;
  const server = shouldSpawnServer ? createServerProcess() : null;
  let stdout = "";
  let stderr = "";

  if (server) {
    server.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
    });

    server.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
    });
  }

  const shutdown = () =>
    new Promise((resolve) => {
      if (!server) {
        resolve();
        return;
      }

      if (server.exitCode !== null) {
        resolve();
        return;
      }

      server.once("exit", () => resolve());
      server.kill("SIGTERM");
      setTimeout(() => {
        if (server.exitCode === null) {
          server.kill("SIGKILL");
        }
      }, 5000).unref();
    });

  const handleTermination = async () => {
    await shutdown();
    process.exit(1);
  };

  process.once("SIGINT", handleTermination);
  process.once("SIGTERM", handleTermination);

  try {
    const baseUrl = EXTERNAL_BASE_URL
      ? EXTERNAL_BASE_URL
      : (await waitForServer(server, () => `${stdout}\n${stderr}`.trim()))
          .baseUrl;
    log(
      EXTERNAL_BASE_URL
        ? `Using existing server at ${baseUrl}`
        : `Smoke server is ready at ${baseUrl}`,
    );

    const home = await readCheckedResponse(baseUrl, "/");
    assertDocument(home, "/");
    assert.match(
      home.body,
      /Care N Tour/i,
      "Homepage should contain brand text",
    );

    const auth = await readCheckedResponse(baseUrl, "/auth");
    assertDocument(auth, "/auth");
    assert.match(
      auth.body,
      /Welcome to Care N Tour/i,
      "Auth page should render the welcome heading",
    );
    assert.match(auth.body, /Sign In/i, "Auth page should expose sign-in UI");

    const contact = await readCheckedResponse(baseUrl, "/contact");
    assertDocument(contact, "/contact");
    assert.match(
      contact.body,
      /Care N Tour/i,
      "Contact page should render the public shell",
    );

    const robots = await readCheckedResponse(baseUrl, "/robots.txt");
    assert.equal(robots.status, 200, "/robots.txt should render successfully");
    assert.match(
      robots.headers.get("content-type") ?? "",
      /text\/plain/i,
      "/robots.txt should return plain text",
    );
    assert.match(
      robots.body,
      /Sitemap:\s*https?:\/\/.+\/sitemap\.xml/i,
      "robots.txt should advertise the sitemap",
    );

    const sitemap = await readCheckedResponse(baseUrl, "/sitemap.xml");
    assert.equal(
      sitemap.status,
      200,
      "/sitemap.xml should render successfully",
    );
    assert.match(
      sitemap.headers.get("content-type") ?? "",
      /(application|text)\/xml/i,
      "/sitemap.xml should return XML",
    );
    assert.match(
      sitemap.body,
      /<loc>https?:\/\/[^<]+<\/loc>/i,
      "Sitemap should contain at least one URL entry",
    );

    const arabicContact = await readCheckedResponse(baseUrl, "/ar/contact");
    if (arabicContact.status === 200) {
      assertDocument(arabicContact, "/ar/contact");
      assert.ok(
        arabicContact.body.includes('dir="rtl"') ||
          arabicContact.body.includes("اتصل"),
        "Arabic contact page should render RTL or Arabic copy",
      );
      log("Arabic smoke route passed: /ar/contact");
    } else if (arabicContact.status === 404 && !REQUIRE_ARABIC) {
      log(
        "Arabic smoke route skipped: /ar/contact returned 404. Set SMOKE_REQUIRE_ARABIC=1 to enforce it.",
      );
    } else {
      throw new Error(
        `/ar/contact should return 200${
          REQUIRE_ARABIC ? "" : " or an allowed 404 skip"
        }, received ${arabicContact.status}`,
      );
    }

    const workspaceChecks = [
      {
        pathname: "/cms",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/cms should render either the CMS loading shell or the session-required recovery UI",
      },
      {
        pathname: "/admin",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/admin should render either the admin loading shell or the session-required recovery UI",
      },
      {
        pathname: "/operations",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/operations should render either the operations loading shell or the session-required recovery UI",
      },
      {
        pathname: "/finance",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/finance should render either the finance loading shell or the session-required recovery UI",
      },
      {
        pathname: "/admin/finance",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/admin/finance should render either the admin loading shell or the session-required recovery UI",
      },
      {
        pathname: "/finance/payables",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/finance/payables should render either the finance loading shell or the session-required recovery UI",
      },
      {
        pathname: "/finance/settings",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/finance/settings should render either the finance loading shell or the session-required recovery UI",
      },
      {
        pathname: "/finance/quotation-calculator",
        patterns: internalWorkspaceShellPatterns,
        message:
          "/finance/quotation-calculator should render either the finance loading shell or the session-required recovery UI",
      },
      {
        pathname: "/cms/preview/blog",
        patterns: [/Unauthorized/i, /No preview available/i],
        message:
          "/cms/preview/blog should expose the preview authorization fallback when no preview token is present",
      },
    ];

    for (const workspaceCheck of workspaceChecks) {
      const response = await readCheckedResponse(
        baseUrl,
        workspaceCheck.pathname,
      );
      assertDocument(response, workspaceCheck.pathname);
      assertMatchesAny(
        response.body,
        workspaceCheck.patterns,
        workspaceCheck.message,
      );
    }

    const unauthorizedApiChecks = [
      {
        pathname: "/api/admin/roles",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/cms/pages",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/cms/preview/data?pageSlug=blog",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/cms/preview/session",
        options: {
          method: "POST",
        },
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/admin/finance/invoices",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/admin/finance/payables",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/admin/finance/settings",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/admin/finance/approval-requests",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/admin/finance/reports/profit-loss",
        options: undefined,
        expectedError: /Missing or invalid Authorization header/i,
      },
      {
        pathname: "/api/patient/documents",
        options: undefined,
        expectedError: /Authentication required to view documents/i,
      },
      {
        pathname: "/api/patient/finance/installments",
        options: undefined,
        expectedError: /Authentication required to view finance installments/i,
      },
    ];

    for (const apiCheck of unauthorizedApiChecks) {
      const response = await readCheckedResponse(
        baseUrl,
        apiCheck.pathname,
        apiCheck.options,
      );
      assert.equal(
        response.status,
        401,
        `${apiCheck.pathname} should reject unauthenticated access with 401`,
      );
      assertJsonResponse(response, apiCheck.pathname);
      const payload = parseJsonBody(response, apiCheck.pathname);
      assert.match(
        String(payload.error ?? ""),
        apiCheck.expectedError,
        `${apiCheck.pathname} should explain the auth failure`,
      );
    }

    log("Live smoke checks passed");
  } catch (error) {
    const serverOutput = [stdout.trim(), stderr.trim()]
      .filter(Boolean)
      .join("\n");
    if (serverOutput) {
      log("--- smoke server output ---");
      log(serverOutput);
      log("--- end smoke server output ---");
    }
    throw error;
  } finally {
    process.removeListener("SIGINT", handleTermination);
    process.removeListener("SIGTERM", handleTermination);
    await shutdown();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
