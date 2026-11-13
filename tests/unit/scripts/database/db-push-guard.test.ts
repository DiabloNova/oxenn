import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveConfiguredDbPushTarget,
  validateDbPushGuard,
  type GuardEnvironment,
} from "../../../../scripts/database/db-push-guard";
import {
  APPROVED_DISPOSABLE_DB_PUSH_TARGETS,
  type DisposableDbPushTarget,
} from "../../../../scripts/database/db-push-targets";

const target: DisposableDbPushTarget = {
  id: "local-throwaway",
  host: "127.0.0.1",
  port: 5432,
  database: "oxenn_throwaway",
  username: "oxenn_db_push",
  databaseOwner: "oxenn_db_owner",
  databaseComment: "oxenn:disposable-db-push:v1:local-throwaway",
  expectedExtensions: ["plpgsql"],
};

const baseEnv: GuardEnvironment = {
  NODE_ENV: "development",
  ALLOW_DB_PUSH: "true",
  DB_PUSH_TARGET_ID: target.id,
  DB_PUSH_DATABASE_URL: "postgresql://oxenn_db_push:secret@127.0.0.1:5432/oxenn_throwaway",
};

function catalogRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    database_name: target.database,
    role_name: target.username,
    server_port: target.port,
    database_comment: target.databaseComment,
    database_owner: target.databaseOwner,
    role_is_database_owner_or_member: false,
    allows_connections: true,
    role_is_superuser: false,
    role_can_create_database: false,
    role_can_create_role: false,
    role_can_replicate: false,
    role_bypasses_rls: false,
    role_memberships: [],
    object_inventory: { schemas: 0, relations: 0, types: 0, routines: 0 },
    extensions: ["plpgsql"],
    ...overrides,
  };
}

function mockClient(
  rows: Array<Record<string, unknown>> = [catalogRow()],
  options: { connectError?: Error; queryError?: Error; endError?: Error } = {},
) {
  return {
    connect: vi.fn(async () => {
      if (options.connectError) throw options.connectError;
    }),
    query: vi.fn(async () => {
      if (options.queryError) throw options.queryError;
      return { rows };
    }),
    end: vi.fn(async () => {
      if (options.endError) throw options.endError;
    }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("db:push target resolution", () => {
  it("keeps the repository's approved disposable target registry empty until a target is provisioned", () => {
    expect(APPROVED_DISPOSABLE_DB_PUSH_TARGETS).toEqual([]);
  });

  it("does not invent a default target when the registry is empty", () => {
    expect(() => resolveConfiguredDbPushTarget(baseEnv, [])).toThrow(
      /not present in the reviewed disposable-target registry/,
    );
  });

  it("requires an explicit development or test environment", () => {
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, NODE_ENV: "production" }, [target]),
    ).toThrow(/NODE_ENV/);
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, NODE_ENV: undefined }, [target]),
    ).toThrow(/NODE_ENV/);
  });

  it.each([
    ["VERCEL_ENV", "production"],
    ["VERCEL_ENV", "preview"],
    ["APP_ENV", "staging"],
    ["DATABASE_ENV", "production"],
  ] as const)("blocks a non-development deployment marker: %s=%s", (name, value) => {
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, [name]: value }, [target]),
    ).toThrow(new RegExp(name));
  });

  it("requires the additional operator approval gate", () => {
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, ALLOW_DB_PUSH: "false" }, [target]),
    ).toThrow(/ALLOW_DB_PUSH=true/);
  });

  it("requires a target identifier and a separate push URL", () => {
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, DB_PUSH_TARGET_ID: "" }, [target]),
    ).toThrow(/DB_PUSH_TARGET_ID/);
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, DB_PUSH_DATABASE_URL: "" }, [target]),
    ).toThrow(/DB_PUSH_DATABASE_URL/);
  });

  it("matches host, port, database, and login role exactly against the reviewed target", () => {
    const wrongDatabase = {
      ...baseEnv,
      DB_PUSH_DATABASE_URL: "postgresql://oxenn_db_push:secret@127.0.0.1:5432/another_db",
    };
    expect(() => resolveConfiguredDbPushTarget(wrongDatabase, [target])).toThrow(/does not match the reviewed target/);
  });

  it.each([
    "DATABASE_URL",
    "MIGRATION_DATABASE_URL",
    "AUTHENTICATOR_DATABASE_URL",
    "PLATFORM_ADMIN_DATABASE_URL",
    "PLATFORM_ADMIN_MIGRATION_DATABASE_URL",
  ] as const)("rejects a push target that aliases %s", (variable) => {
    expect(() =>
      resolveConfiguredDbPushTarget({ ...baseEnv, [variable]: baseEnv.DB_PUSH_DATABASE_URL }, [target]),
    ).toThrow(`separate from ${variable}`);
  });

  it("requires hostname-verifying TLS for a non-local target", () => {
    const remoteTarget: DisposableDbPushTarget = {
      ...target,
      id: "remote-throwaway",
      host: "db.example.test",
      databaseComment: "oxenn:disposable-db-push:v1:remote-throwaway",
    };
    const remoteEnv = {
      ...baseEnv,
      DB_PUSH_TARGET_ID: remoteTarget.id,
      DB_PUSH_DATABASE_URL: "postgresql://oxenn_db_push:secret@db.example.test:5432/oxenn_throwaway",
    };
    expect(() => resolveConfiguredDbPushTarget(remoteEnv, [remoteTarget])).toThrow(/sslmode=verify-full/);

    expect(() =>
      resolveConfiguredDbPushTarget(
        { ...remoteEnv, DB_PUSH_DATABASE_URL: "postgresql://oxenn_db_push:secret@db.example.test:5432/oxenn_throwaway?sslmode=verify-full" },
        [remoteTarget],
      ),
    ).not.toThrow();
  });
});

describe("db:push database guard", () => {
  it("rejects an unregistered target before opening a connection", async () => {
    const factory = vi.fn();
    const result = await validateDbPushGuard({ env: baseEnv, targets: [], clientFactory: factory });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not present in the reviewed disposable-target registry/);
    expect(factory).not.toHaveBeenCalled();
  });

  it("allows only a matching independently attested, empty, least-privilege target", async () => {
    const client = mockClient();
    const factory = vi.fn(() => client);
    const result = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: factory,
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("passed the reviewed identity");
    expect(factory).toHaveBeenCalledWith(baseEnv.DB_PUSH_DATABASE_URL);
    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.query).toHaveBeenCalledOnce();
    expect(client.end).toHaveBeenCalledOnce();
  });

  it("rejects an empty or malformed catalog response instead of treating it as an empty database", async () => {
    const noRowsClient = mockClient([]);
    const noRows = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => noRowsClient,
    });
    expect(noRows.allowed).toBe(false);
    expect(noRows.reason).toMatch(/exactly one identity row/);

    const malformedClient = mockClient([catalogRow({ object_inventory: {} })]);
    const malformed = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => malformedClient,
    });
    expect(malformed.allowed).toBe(false);
    expect(malformed.reason).toMatch(/incomplete or invalid object inventory/);
  });

  it.each([
    ["schemas", 1],
    ["relations", 2],
    ["types", 1],
    ["routines", 1],
  ] as const)("rejects an unexpected user %s object", async (objectType, count) => {
    const client = mockClient([
      catalogRow({ object_inventory: { schemas: 0, relations: 0, types: 0, routines: 0, [objectType]: count } }),
    ]);
    const result = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => client,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain(objectType);
  });

  it.each([
    "role_is_superuser",
    "role_can_create_database",
    "role_can_create_role",
    "role_can_replicate",
    "role_bypasses_rls",
    "role_is_database_owner_or_member",
  ] as const)("rejects a target role with elevated privilege: %s", async (privilege) => {
    const client = mockClient([catalogRow({ [privilege]: true })]);
    const result = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => client,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/privileges/);
  });

  it.each([
    ["pg_write_all_data"],
    ["pg_execute_server_program"],
    ["another_privileged_role"],
  ])("rejects any inherited or assumable PostgreSQL role: %j", async (memberships) => {
    const client = mockClient([catalogRow({ role_memberships: memberships })]);
    const result = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => client,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/must not inherit or be able to assume/);
  });

  it("rejects a missing or malformed role-membership catalog value", async () => {
    for (const roleMemberships of [undefined, "invalid-json", ["role", 42]]) {
      const client = mockClient([catalogRow({ role_memberships: roleMemberships })]);
      const result = await validateDbPushGuard({
        env: baseEnv,
        targets: [target],
        clientFactory: () => client,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/must not inherit or be able to assume/);
    }
  });

  it("rejects an identity, database owner, or database-attestation mismatch", async () => {
    for (const override of [
      { database_name: "another_database" },
      { role_name: "postgres" },
      { server_port: 5433 },
      { database_comment: "operator-controlled boolean is not an attestation" },
      { database_owner: target.username },
      { allows_connections: false },
    ]) {
      const client = mockClient([catalogRow(override)]);
      const result = await validateDbPushGuard({
        env: baseEnv,
        targets: [target],
        clientFactory: () => client,
      });
      expect(result.allowed).toBe(false);
    }
  });

  it("requires the exact reviewed PostgreSQL extension set", async () => {
    const client = mockClient([catalogRow({ extensions: ["plpgsql", "unreviewed_extension"] })]);
    const result = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => client,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/extensions do not match/);
  });

  it("fails closed when connecting or inspecting the catalog fails", async () => {
    const connectClient = mockClient([], { connectError: new Error("connection refused") });
    const connectResult = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => connectClient,
    });
    expect(connectResult.allowed).toBe(false);

    const queryClient = mockClient([], { queryError: new Error("catalog unavailable") });
    const queryResult = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => queryClient,
    });
    expect(queryResult.allowed).toBe(false);
  });

  it("does not allow a successful check when the inspection connection cannot be closed", async () => {
    const client = mockClient([catalogRow()], { endError: new Error("close failed") });
    const result = await validateDbPushGuard({
      env: baseEnv,
      targets: [target],
      clientFactory: () => client,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/could not be closed cleanly/);
  });

  it("does not disclose push credentials in a connection error", async () => {
    const secretUrl = "postgresql://oxenn_db_push:verySecretPassword@127.0.0.1:5432/oxenn_throwaway";
    const client = mockClient([], {
      connectError: new Error(`connection failed: ${secretUrl}`),
    });
    const result = await validateDbPushGuard({
      env: { ...baseEnv, DB_PUSH_DATABASE_URL: secretUrl },
      targets: [target],
      clientFactory: () => client,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).not.toContain("verySecretPassword");
    expect(result.reason).not.toContain(secretUrl);
  });
});
