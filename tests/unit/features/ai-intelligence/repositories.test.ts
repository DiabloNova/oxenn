import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connectClient: vi.fn(),
  lifecycleQuery: vi.fn(),
  release: vi.fn()
}));

vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: { getInstance: () => ({ connectClient: mocks.connectClient }) }
}));

import { TenantContextManager } from "@/core/database/tenant-context";
import type { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { db, PageRepository, WebsiteRepository } from "@/features/ai-intelligence/repositories";

const WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

function inWorkspace<T>(work: () => Promise<T>): Promise<T> {
  return TenantContextManager.runWithTenantContext(
    WORKSPACE_ID, USER_ID, "repository-contract-test", work
  );
}

function createPostgresMock() {
  const query = vi.fn();
  return { client: { query } as unknown as PostgresClient, query };
}

function websiteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    organization_id: WORKSPACE_ID,
    domain: "example.com",
    normalized_url: "https://example.com/",
    status: "active",
    cms_type: "wordpress",
    last_crawled_at: new Date("2026-11-20T10:00:00.000Z"),
    last_analyzed_at: null,
    created_at: new Date("2026-11-20T09:00:00.000Z"),
    updated_at: new Date("2026-11-20T10:00:00.000Z"),
    created_by: USER_ID,
    updated_by: USER_ID,
    deleted_at: null,
    version: 2,
    ...overrides
  };
}

function pageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    organization_id: WORKSPACE_ID,
    website_id: "33333333-3333-4333-8333-333333333333",
    url: "https://example.com/about",
    normalized_url: "https://example.com/about",
    path: "/about",
    title: "About",
    meta_description: "About the company",
    http_status: 200,
    content_type: "text/html",
    content_hash: "hash-1",
    word_count: 120,
    canonical_url: "https://example.com/about",
    robots_directives: ["noindex"],
    inlink_count: 2,
    outlink_count: 3,
    last_crawled_at: new Date("2026-11-20T10:00:00.000Z"),
    created_at: new Date("2026-11-20T09:00:00.000Z"),
    updated_at: new Date("2026-11-20T10:00:00.000Z"),
    created_by: USER_ID,
    updated_by: USER_ID,
    deleted_at: null,
    version: 3,
    ...overrides
  };
}

function keywordRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    organization_id: WORKSPACE_ID,
    term: "Temperature sensor",
    normalized_term: "temperature sensor",
    language: "en",
    intent: "commercial",
    created_at: new Date("2026-11-20T09:00:00.000Z"),
    updated_at: new Date("2026-11-20T10:00:00.000Z"),
    created_by: USER_ID,
    updated_by: USER_ID,
    deleted_at: null,
    version: 2,
    ...overrides
  };
}

function topicRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    organization_id: WORKSPACE_ID,
    name: "Temperature measurement",
    description: "Temperature sensing topics",
    language: "en",
    parent_topic_id: null,
    created_at: new Date("2026-11-20T09:00:00.000Z"),
    updated_at: new Date("2026-11-20T10:00:00.000Z"),
    created_by: USER_ID,
    updated_by: USER_ID,
    deleted_at: null,
    version: 3,
    ...overrides
  };
}

const audit = {
  createdAt: "2026-11-20T09:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
  createdBy: USER_ID,
  updatedBy: USER_ID,
  version: 1
};

beforeEach(() => {
  mocks.lifecycleQuery.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
  mocks.connectClient.mockReset().mockImplementation(async () => ({
    query: mocks.lifecycleQuery,
    release: mocks.release
  }));
  mocks.release.mockReset();
});

describe("WebsiteRepository canonical PostgreSQL contract", () => {
  it("maps the PostgreSQL row instead of reading the process-local Map", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [websiteRow()], rowCount: 1 });
    const website = await inWorkspace(() =>
      new WebsiteRepository(client).findById(WORKSPACE_ID, "33333333-3333-4333-8333-333333333333")
    );
    expect(website).toMatchObject({
      organizationId: WORKSPACE_ID,
      domain: "example.com",
      normalizedUrl: "https://example.com/",
      cmsType: "wordpress",
      audit: { version: 2, createdBy: USER_ID }
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("organization_id = $2 AND deleted_at IS NULL"),
      ["33333333-3333-4333-8333-333333333333", WORKSPACE_ID]
    );
  });

  it("upserts against the actual partial unique index and returns the stored row", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({
      rows: [websiteRow({ id: "55555555-5555-4555-8555-555555555555" })],
      rowCount: 1
    });
    const website = await inWorkspace(() =>
      new WebsiteRepository(client).save({
        id: "66666666-6666-4666-8666-666666666666",
        organizationId: WORKSPACE_ID,
        domain: "example.com",
        normalizedUrl: "https://example.com/",
        status: "active",
        cmsType: "wordpress",
        audit
      })
    );
    expect(website.id).toBe("55555555-5555-4555-8555-555555555555");
    const [sql] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("ON CONFLICT (organization_id, domain) WHERE deleted_at IS NULL");
    expect(sql).toContain("RETURNING *");
  });
});

describe("PageRepository canonical PostgreSQL contract", () => {
  it("loads Page ownership through the matching Workspace-owned Website", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [pageRow()], rowCount: 1 });
    const page = await inWorkspace(() =>
      new PageRepository(client).findById(WORKSPACE_ID, "44444444-4444-4444-8444-444444444444")
    );
    expect(page).toMatchObject({
      organizationId: WORKSPACE_ID,
      websiteId: "33333333-3333-4333-8333-333333333333",
      httpStatus: 200,
      statusCode: 200,
      metaDescription: "About the company",
      description: "About the company",
      robotsDirectives: ["noindex"],
      indexability: "noindex"
    });
    const [sql] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("INNER JOIN websites w");
    expect(sql).toContain("w.organization_id = p.organization_id");
  });

  it("persists only canonical Page columns and returns the persisted representation", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [pageRow()], rowCount: 1 });
    const page = await inWorkspace(() =>
      new PageRepository(client).save({
        id: "44444444-4444-4444-8444-444444444444",
        organizationId: WORKSPACE_ID,
        websiteId: "33333333-3333-4333-8333-333333333333",
        url: "https://example.com/about",
        normalizedUrl: "https://example.com/about",
        path: "/about",
        statusCode: 200,
        indexability: "noindex",
        robotsDirectives: ["noindex"],
        title: "About",
        description: "About the company",
        audit
      })
    );
    expect(page.indexability).toBe("noindex");
    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("WITH owned_website");
    expect(sql).toContain("organization_id, normalized_url) WHERE deleted_at IS NULL");
    expect(sql).toContain("http_status");
    expect(sql).toContain("meta_description");
    expect(sql).not.toContain("status_code");
    expect(sql).not.toContain("indexability");
    expect(sql).not.toMatch(/\bdescription\s*,/);
    expect(params[1]).toBe(WORKSPACE_ID);
    expect(params[2]).toBe("33333333-3333-4333-8333-333333333333");
    expect(params[7]).toBe("About the company");
    expect(params[13]).toEqual(["noindex"]);
  });

  it("writes Page-to-Keyword links only to PostgreSQL", async () => {
    const { client, query } = createPostgresMock();
    const previousLength = db.pagesKeywords.length;
    await inWorkspace(() =>
      new PageRepository(client).linkKeyword(
        WORKSPACE_ID,
        "44444444-4444-4444-8444-444444444444",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      )
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO pages_keywords"),
      [WORKSPACE_ID, "44444444-4444-4444-8444-444444444444", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]
    );
    expect(db.pagesKeywords).toHaveLength(previousLength);
  });

  it("writes Page-to-Topic links only to PostgreSQL", async () => {
    const { client, query } = createPostgresMock();
    const previousLength = db.pagesTopics.length;
    await inWorkspace(() =>
      new PageRepository(client).linkTopic(
        WORKSPACE_ID,
        "44444444-4444-4444-8444-444444444444",
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
      )
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO pages_topics"),
      [WORKSPACE_ID, "44444444-4444-4444-8444-444444444444", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]
    );
    expect(db.pagesTopics).toHaveLength(previousLength);
  });

  it("reads linked Keywords from PostgreSQL and maps canonical columns", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [keywordRow()], rowCount: 1 });
    const keywords = await inWorkspace(() =>
      new PageRepository(client).getLinkedKeywords(
        WORKSPACE_ID,
        "44444444-4444-4444-8444-444444444444"
      )
    );
    expect(keywords).toMatchObject([{
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationId: WORKSPACE_ID,
      name: "temperature sensor",
      displayName: "Temperature sensor",
      language: "en",
      intent: "commercial",
      audit: { version: 2, createdBy: USER_ID }
    }]);
    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("k.organization_id = pk.organization_id");
    expect(sql).toContain("k.deleted_at IS NULL");
    expect(params).toEqual(["44444444-4444-4444-8444-444444444444", WORKSPACE_ID]);
  });

  it("reads linked Topics from PostgreSQL and maps canonical columns", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [topicRow()], rowCount: 1 });
    const topics = await inWorkspace(() =>
      new PageRepository(client).getLinkedTopics(
        WORKSPACE_ID,
        "44444444-4444-4444-8444-444444444444"
      )
    );
    expect(topics).toMatchObject([{
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      organizationId: WORKSPACE_ID,
      name: "Temperature measurement",
      description: "Temperature sensing topics",
      language: "en",
      audit: { version: 3, createdBy: USER_ID }
    }]);
    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("t.organization_id = pt.organization_id");
    expect(sql).toContain("t.deleted_at IS NULL");
    expect(params).toEqual(["44444444-4444-4444-8444-444444444444", WORKSPACE_ID]);
  });

  it("does not invent noindex evidence when robotsDirectives are absent", async () => {
    const { client, query } = createPostgresMock();
    await expect(inWorkspace(() =>
      new PageRepository(client).save({
        id: "44444444-4444-4444-8444-444444444444",
        organizationId: WORKSPACE_ID,
        websiteId: "33333333-3333-4333-8333-333333333333",
        url: "https://example.com/about",
        normalizedUrl: "https://example.com/about",
        path: "/about",
        statusCode: 200,
        indexability: "noindex",
        audit
      })
    )).rejects.toThrow("without explicit robotsDirectives");
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects saving a Page when its Website is not owned by the active Workspace", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(inWorkspace(() =>
      new PageRepository(client).save({
        id: "44444444-4444-4444-8444-444444444444",
        organizationId: WORKSPACE_ID,
        websiteId: "77777777-7777-4777-8777-777777777777",
        url: "https://foreign.example/about",
        normalizedUrl: "https://foreign.example/about",
        path: "/about",
        statusCode: 200,
        indexability: "undetermined",
        audit
      })
    )).rejects.toThrow("target Website is not present in the same Workspace");
  });

  it("does not reassign a normalized URL to another Website in the same Workspace", async () => {
    const { client, query } = createPostgresMock();
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: "77777777-7777-4777-8777-777777777777" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ website_id: "88888888-8888-4888-8888-888888888888" }], rowCount: 1 });

    await expect(inWorkspace(() =>
      new PageRepository(client).save({
        id: "44444444-4444-4444-8444-444444444444",
        organizationId: WORKSPACE_ID,
        websiteId: "77777777-7777-4777-8777-777777777777",
        url: "https://example.com/about",
        normalizedUrl: "https://example.com/about",
        path: "/about",
        statusCode: 200,
        indexability: "undetermined",
        audit
      })
    )).rejects.toThrow("already owned by another Website");
  });

  it("does not claim blocked_by_robots without persisted robots.txt evidence", async () => {
    const { client, query } = createPostgresMock();
    await expect(inWorkspace(() =>
      new PageRepository(client).save({
        id: "44444444-4444-4444-8444-444444444444",
        organizationId: WORKSPACE_ID,
        websiteId: "33333333-3333-4333-8333-333333333333",
        url: "https://example.com/about",
        normalizedUrl: "https://example.com/about",
        path: "/about",
        statusCode: 200,
        indexability: "blocked_by_robots",
        audit
      })
    )).rejects.toThrow("does not store robots.txt access decisions");
    expect(query).not.toHaveBeenCalled();
  });

  it("returns Page rows and total count from PostgreSQL with stable pagination", async () => {
    const { client, query } = createPostgresMock();
    query
      .mockResolvedValueOnce({ rows: [{ total_count: 3 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [pageRow()], rowCount: 1 });
    const result = await inWorkspace(() =>
      new PageRepository(client).findByWebsiteId(
        WORKSPACE_ID,
        "33333333-3333-4333-8333-333333333333",
        { limit: 1, offset: 1 }
      )
    );
    expect(result).toMatchObject({ totalCount: 3, limit: 1, offset: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("44444444-4444-4444-8444-444444444444");
    expect(query).toHaveBeenCalledTimes(2);
  });
});
