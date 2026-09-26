import fs from "fs";
import path from "path";

type Mode = "dev" | "build" | "migrate" | "test";

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
    modes: ["dev", "build", "migrate", "test"],
    required: true,
    format: /^postgres(ql)?:\/\/.+/,
    formatDescription: "must be a valid PostgreSQL connection URL (e.g. postgresql://user:pass@host:5432/db)",
  },
  {
    name: "MIGRATION_DATABASE_URL",
    modes: ["migrate"],
    required: false,
    format: /^postgres(ql)?:\/\/.+/,
    formatDescription: "must be a valid PostgreSQL connection URL if provided",
  },
  {
    name: "SESSION_SECRET",
    modes: ["dev", "build"],
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

export function validateEnv(modeArg?: string) {
  const mode: Mode = (modeArg as Mode) || (process.env.APP_MODE as Mode) || "dev";
  const missing: string[] = [];
  const invalid: { name: string; reason: string }[] = [];

  const activeRules = RULES.filter((r) => r.modes.includes(mode));

  for (const rule of activeRules) {
    const val = process.env[rule.name];

    if (!val) {
      if (rule.required) {
        missing.push(rule.name);
      }
      continue;
    }

    if (rule.format && !rule.format.test(val)) {
      invalid.push({
        name: rule.name,
        reason: rule.formatDescription || "invalid format",
      });
    }
  }

  return { mode, missing, invalid, valid: missing.length === 0 && invalid.length === 0 };
}

if (require.main === module) {
  // Try loading .env or .env.local if present
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env"));

  const targetMode = process.argv[2] || "dev";
  const result = validateEnv(targetMode);

  console.log(`[env-check] Validating environment for mode '${result.mode}'...`);

  if (!result.valid) {
    console.error(`\n❌ [env-check] Environment validation failed for mode '${result.mode}':`);
    if (result.missing.length > 0) {
      console.error(`   Missing required variables: ${result.missing.join(", ")}`);
    }
    if (result.invalid.length > 0) {
      console.error("   Invalid variable formats:");
      for (const item of result.invalid) {
        console.error(`     - ${item.name}: ${item.reason}`);
      }
    }
    console.error("\nPlease check your .env file or environment settings (see .env.example).\n");
    process.exit(1);
  }

  console.log(`✅ [env-check] Environment check passed for mode '${result.mode}'.`);
  process.exit(0);
}
