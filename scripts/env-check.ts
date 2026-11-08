import fs from "fs";
import path from "path";

type Mode = "dev" | "build" | "migrate" | "test" | "start";
type DeploymentEnvironment = "development" | "test" | "staging" | "production";

interface VarRule {
  name: string;
  modes: Mode[];
  required: boolean;
  format?: RegExp;
  formatDescription?: string;
}

const RULES: VarRule[] = [
  {
    name: "DATABASE_URL",
    modes: ["dev", "build", "migrate", "test", "start"],
    required: true,
    format: /^postgres(ql)?:\/\/.+/,
    formatDescription: "must be a valid PostgreSQL connection URL",
  },
  {
    name: "MIGRATION_DATABASE_URL",
    modes: ["migrate"],
    required: false,
    format: /^postgres(ql)?:\/\/.+/,
    formatDescription: "must be a valid PostgreSQL connection URL if provided",
  },
  {
    name: "AUTHENTICATOR_DATABASE_URL",
    modes: ["build", "migrate", "start"],
    required: false,
    format: /^postgres(ql)?:\/\/.+/,
    formatDescription: "must be a valid PostgreSQL connection URL if provided",
  },
  {
    name: "SESSION_SECRET",
    modes: ["dev", "build", "start"],
    required: true,
    format: /^.{16,}$/,
    formatDescription: "must be at least 16 characters long",
  },
  {
    name: "ALLOW_DB_PUSH",
    modes: ["dev", "migrate", "test"],
    required: false,
    format: /^(true|false)$/,
    formatDescription: "must be 'true' or 'false'",
  },
  {
    name: "DISPOSABLE_DB",
    modes: ["dev", "migrate", "test"],
    required: false,
    format: /^(true|false)$/,
    formatDescription: "must be 'true' or 'false'",
  },
  {
    name: "NEXT_PUBLIC_API_URL",
    modes: ["dev", "build"],
    required: false,
    format: /^https?:\/\/.+/,
    formatDescription: "must be a valid http(s) URL",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    modes: ["dev", "build"],
    required: false,
    format: /^https?:\/\/.+/,
    formatDescription: "must be a valid http(s) URL",
  },
];

const MODES: readonly Mode[] = ["dev", "build", "migrate", "test", "start"];
const DEPLOYMENT_ENVIRONMENTS: readonly DeploymentEnvironment[] = [
  "development",
  "test",
  "staging",
  "production",
];
const KNOWN_PLACEHOLDER_SECRETS = [
  "change-this-to-a-secure-32-character-secret-in-production",
  "change-me",
  "changeme",
  "your-secret",
  "your-session-secret",
  "replace-me",
  "placeholder",
  "example-secret",
];
const SUPERUSER_ROLE_NAMES = new Set([
  "postgres",
  "superuser",
  "rds_superuser",
  "cloudsqlsuperuser",
  "azure_pg_admin",
]);

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

export function resolveMode(modeArg?: string): Mode {
  const candidate = modeArg || process.env.APP_MODE || "dev";

  if (!MODES.includes(candidate as Mode)) {
    throw new Error(
      `Unsupported environment mode '${candidate}'. Expected one of: ${MODES.join(", ")}.`,
    );
  }

  return candidate as Mode;
}

export function resolveDeploymentEnvironment(): DeploymentEnvironment {
  const configured = process.env.APP_ENVIRONMENT?.trim().toLowerCase();
  if (configured && !DEPLOYMENT_ENVIRONMENTS.includes(configured as DeploymentEnvironment)) {
    throw new Error(
      `Unsupported APP_ENVIRONMENT '${configured}'. Expected one of: ${DEPLOYMENT_ENVIRONMENTS.join(", ")}.`,
    );
  }

  // NODE_ENV=production is authoritative and cannot be downgraded by APP_ENVIRONMENT.
  if (process.env.NODE_ENV === "production") return "production";
  return (configured as DeploymentEnvironment | undefined) || "development";
}

function parseDatabaseUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") return null;
    if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") return null;
    return parsed;
  } catch {
    return null;
  }
}

function databaseRoleName(databaseUrl: string): string | null {
  const parsed = parseDatabaseUrl(databaseUrl);
  if (!parsed || !parsed.username) return null;
  try {
    return decodeURIComponent(parsed.username).toLowerCase();
  } catch {
    return null;
  }
}

function isLocalDatabaseHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "::1" || host === "host.docker.internal" ||
    /^127(?:\.\d{1,3}){3}$/.test(host);
}

function isWeakOrPlaceholderSecret(secret: string): boolean {
  const normalized = secret.trim().toLowerCase();
  return secret.length < 32 ||
    KNOWN_PLACEHOLDER_SECRETS.some((placeholder) => normalized.includes(placeholder)) ||
    /^(.)\1+$/.test(secret) ||
    /^(password|secret|sessionsecret|testsecret)[-_0-9]*$/i.test(secret);
}

export function validateEnv(modeArg?: string) {
  const mode = resolveMode(modeArg);
  const missing: string[] = [];
  const invalid: { name: string; reason: string }[] = [];
  let deploymentEnvironment: DeploymentEnvironment;

  try {
    deploymentEnvironment = resolveDeploymentEnvironment();
  } catch (error) {
    invalid.push({
      name: "APP_ENVIRONMENT",
      reason: error instanceof Error ? error.message : "unsupported deployment environment",
    });
    deploymentEnvironment = "production";
  }

  const isNonDevelopment = deploymentEnvironment !== "development";
  const activeRules = RULES.filter((rule) => rule.modes.includes(mode));

  for (const rule of activeRules) {
    const value = process.env[rule.name];

    if (!value) {
      if (rule.required) missing.push(rule.name);
      continue;
    }

    if (rule.format && !rule.format.test(value)) {
      invalid.push({
        name: rule.name,
        reason: rule.formatDescription || "invalid format",
      });
    }
  }

  if (isNonDevelopment) {
    const secret = process.env.SESSION_SECRET;
    if (["build", "start"].includes(mode)) {
      if (!secret) {
        if (!missing.includes("SESSION_SECRET")) missing.push("SESSION_SECRET");
      } else if (isWeakOrPlaceholderSecret(secret)) {
        invalid.push({
          name: "SESSION_SECRET",
          reason: "must be a non-placeholder secret with at least 32 characters",
        });
      }
    }

    const databaseVariables = [
      "DATABASE_URL",
      "AUTHENTICATOR_DATABASE_URL",
      ...(mode === "migrate" ? ["MIGRATION_DATABASE_URL"] : []),
    ];

    for (const name of databaseVariables) {
      const value = process.env[name];
      if (!value) {
        if (name === "AUTHENTICATOR_DATABASE_URL" || name === "MIGRATION_DATABASE_URL") {
          if (!missing.includes(name)) missing.push(name);
        }
        continue;
      }

      const parsed = parseDatabaseUrl(value);
      if (!parsed) {
        invalid.push({ name, reason: "must be a parseable PostgreSQL URL" });
        continue;
      }

      if (isLocalDatabaseHost(parsed.hostname)) {
        invalid.push({
          name,
          reason: "local database hosts are permitted only in APP_ENVIRONMENT=development",
        });
      }

      const role = databaseRoleName(value);
      if (role && SUPERUSER_ROLE_NAMES.has(role)) {
        invalid.push({
          name,
          reason: "must use a dedicated least-privilege database role, not a PostgreSQL superuser role",
        });
      }
    }

    const runtimeRole = process.env.DATABASE_URL
      ? databaseRoleName(process.env.DATABASE_URL)
      : null;
    const authenticatorRole = process.env.AUTHENTICATOR_DATABASE_URL
      ? databaseRoleName(process.env.AUTHENTICATOR_DATABASE_URL)
      : null;
    const migrationRole = process.env.MIGRATION_DATABASE_URL
      ? databaseRoleName(process.env.MIGRATION_DATABASE_URL)
      : null;

    if (runtimeRole && authenticatorRole && runtimeRole === authenticatorRole) {
      invalid.push({
        name: "AUTHENTICATOR_DATABASE_URL",
        reason: "must use a separately provisioned role from DATABASE_URL",
      });
    }
    if (mode === "migrate" && runtimeRole && migrationRole && runtimeRole === migrationRole) {
      invalid.push({
        name: "MIGRATION_DATABASE_URL",
        reason: "must use a separately provisioned migration role from DATABASE_URL",
      });
    }
    if (
      mode === "migrate" &&
      authenticatorRole &&
      migrationRole &&
      authenticatorRole === migrationRole
    ) {
      invalid.push({
        name: "MIGRATION_DATABASE_URL",
        reason: "must use a distinct role from AUTHENTICATOR_DATABASE_URL",
      });
    }
  }

  return {
    mode,
    deploymentEnvironment,
    missing,
    invalid,
    valid: missing.length === 0 && invalid.length === 0,
  };
}

if (typeof require !== "undefined" && require.main === module) {
  // Keep the existing simple env-file loader isolated from dotenv tooling changes.
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env"));

  let targetMode: Mode;
  try {
    targetMode = resolveMode(process.argv[2]);
  } catch (error) {
    console.error(
      `\nâ [env-check] ${error instanceof Error ? error.message : "Invalid environment mode."}\n`,
    );
    process.exit(1);
  }

  const result = validateEnv(targetMode);

  console.log(
    `[env-check] Validating environment for mode '${result.mode}' in '${result.deploymentEnvironment}'...`,
  );

  if (!result.valid) {
    console.error(`\nâ [env-check] Environment validation failed for mode '${result.mode}':`);
    if (result.missing.length > 0) {
      console.error(`   Missing required variables: ${result.missing.join(", ")}`);
    }
    if (result.invalid.length > 0) {
      console.error("   Invalid variable formats or unsafe settings:");
      for (const item of result.invalid) {
        console.error(`     - ${item.name}: ${item.reason}`);
      }
    }
    console.error("\nPlease check your deployment environment and secret manager configuration.\n");
    process.exit(1);
  }

  console.log(`â [env-check] Environment check passed for mode '${result.mode}'.`);
  process.exit(0);
}
