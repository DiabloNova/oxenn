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
import { db, PageRepository, WebsiteRepository, EntityRepository, BrandRepository, BrandEntityAssociationRepository } from "@/features/ai-intelligence/repositories";

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

const entityRow = (overrides: Record<string, unknown> = {}) => ({
  id: "99999999-9999-4999-8999-999999999999",
  organization_id: WORKSPACE_ID,
  name: "Acme Product",
  entity_type: "Product",
  description: "A canonical entity",
  properties: {
    wikidataId: "Q12345",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Acme_Product",
    aliases: ["Acme", "Acme product"],
    confidence: { score: 0.91, rating: "high" },
    provenance: { source: "unit-test" },
    authorityScore: 80,
    completenessScore: 90,
    status: "active"
  },
  created_at: new Date("2026-11-20T09:00:00.000Z"),
  updated_at: new Date("2026-11-20T10:00:00.000Z"),
  created_by: USER_ID,
  updated_by: USER_ID,
  deleted_at: null,
  version: 2,
  ...overrides
});

const brandRow = (overrides: Record<string, unknown> = {}) => ({
  id: "88888888-8888-4888-8888-888888888888",
  organization_id: WORKSPACE_ID,
  name: "Acme",
  canonical_domain: "acme.example",
  aliases: ["Acme Inc"],
  industry: null,
  target_markets: ["global"],
  properties: { website: "https://acme.example", description: "Acme description", country: "Global" },
  created_at: new Date("2026-11-20T09:00:00.000Z"),
  updated_at: new Date("2026-11-20T10:00:00.000Z"),
  created_by: USER_ID,
  updated_by: USER_ID,
  deleted_at: null,
  version: 1,
  ...overrides
});

const brandEntityAssociationRow = (overrides: Record<string, unknown> = {}) => ({
  id: "77777777-7777-4777-8777-777777777777",
  organization_id: WORKSPACE_ID,
  brand_id: "88888888-8888-4888-8888-888888888888",
  entity_id: "99999999-9999-4999-8999-999999999999",
  relationship_type: "owns",
  weight: 1,
  properties: { source: "manual" },
  created_at: new Date("2026-11-20T09:00:00.000Z"),
  updated_at: new Date("2026-11-20T10:00:00.000Z"),
  created_by: USER_ID,
  updated_by: USER_ID,
  deleted_at: null,
  version: 1,
  ...overrides
});

describe("EntityRepository canonical Workspace PostgreSQL contract", () => {
  it("maps canonical Entity columns and Entity metadata stored in properties", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [entityRow()], rowCount: 1 });

    const entity = await inWorkspace(() =>
      new EntityRepository(client).findById(WORKSPACE_ID, "99999999-9999-4999-8999-999999999999")
    );

    expect(entity).toMatchObject({
      id: "99999999-9999-4999-8999-999999999999",
      organizationId: WORKSPACE_ID,
      name: "Acme Product",
      type: "Product",
      wikidataId: "Q12345",
      aliases: ["Acme", "Acme product"],
      confidence: { score: 0.91, rating: "high" },
      audit: { version: 2, createdBy: USER_ID }
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("organization_id = $2 AND deleted_at IS NULL"),
      ["99999999-9999-4999-8999-999999999999", WORKSPACE_ID]
    );
  });

  it("writes only canonical Entity columns and persists extended metadata in properties", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [entityRow()], rowCount: 1 });
    await inWorkspace(() =>
      new EntityRepository(client).save({
        id: "99999999-9999-4999-8999-999999999999",
        organizationId: WORKSPACE_ID,
        name: "Acme Product",
        type: "Product",
        description: "A canonical entity",
        wikidataId: "Q12345",
        confidence: { score: 0.91, rating: "high" },
        aliases: ["Acme"],
        audit
      })
    );

    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("entity_type");
    expect(sql).toContain("properties");
    expect(sql).not.toContain("brand_id");
    expect(sql).not.toContain("wikidata_id");
    expect(JSON.parse(String(params[5]))).toMatchObject({
      wikidataId: "Q12345",
      aliases: ["Acme"],
      confidence: { score: 0.91, rating: "high" }
    });
  });

  it("persists relationship identity, weight, and metadata using the active partial unique index", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({
      rows: [{
        id: "66666666-6666-4666-8666-666666666666",
        organization_id: WORKSPACE_ID,
        source_entity_id: "99999999-9999-4999-8999-999999999999",
        target_entity_id: "55555555-5555-4555-8555-555555555555",
        relationship_type: "related_to",
        weight: 2.5,
        properties: {
          confidence: { score: 0.9, rating: "high" },
          direction: "directed",
          provenance: { source: "curated" },
          metadata: { note: "manual" }
        },
        created_at: new Date("2026-11-20T09:00:00.000Z"),
        updated_at: new Date("2026-11-20T10:00:00.000Z"),
        created_by: USER_ID,
        updated_by: USER_ID,
        deleted_at: null,
        version: 1
      }],
      rowCount: 1
    });
    const relationship = await inWorkspace(() =>
      new EntityRepository(client).saveRelationship({
        id: "66666666-6666-4666-8666-666666666666",
        organizationId: WORKSPACE_ID,
        sourceEntityId: "99999999-9999-4999-8999-999999999999",
        targetEntityId: "55555555-5555-4555-8555-555555555555",
        relationshipType: "related_to",
        weight: 2.5,
        confidence: { score: 0.9, rating: "high" },
        direction: "directed",
        provenance: { source: "curated" },
        metadata: { note: "manual" },
        audit
      })
    );

    expect(relationship).toMatchObject({
      id: "66666666-6666-4666-8666-666666666666",
      weight: 2.5,
      confidence: { score: 0.9, rating: "high" },
      direction: "directed",
      provenance: { source: "curated" },
      metadata: { note: "manual" }
    });
    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("properties");
    expect(sql).toContain("ON CONFLICT (organization_id, source_entity_id, target_entity_id, relationship_type) WHERE deleted_at IS NULL");
    expect(JSON.parse(String(params[6]))).toMatchObject({
      confidence: { score: 0.9, rating: "high" },
      direction: "directed",
      provenance: { source: "curated" },
      metadata: { note: "manual" }
    });
  });

  it("resolves Brand-linked entities through the new association table instead of entities.brand_id", async () => {
    const { client, query } = createPostgresMock();
    query
      .mockResolvedValueOnce({ rows: [{ total_count: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [entityRow()], rowCount: 1 });

    const result = await inWorkspace(() =>
      new EntityRepository(client).findByBrandId(
        WORKSPACE_ID,
        "88888888-8888-4888-8888-888888888888",
        { limit: 10, offset: 0 }
      )
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("99999999-9999-4999-8999-999999999999");
    expect(query.mock.calls[0][0]).toContain("brand_entity_associations");
    expect(query.mock.calls[0][0]).not.toContain("e.brand_id");
  });

  it("fails closed on PostgreSQL errors rather than falling back to the process-local Map", async () => {
    const { client, query } = createPostgresMock();
    query.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(inWorkspace(() =>
      new EntityRepository(client).findById(WORKSPACE_ID, "99999999-9999-4999-8999-999999999999")
    )).rejects.toThrow("database unavailable");
  });
});

describe("BrandRepository canonical Workspace PostgreSQL contract", () => {
  it("maps Website and other legacy Domain fields from canonical columns plus properties", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [brandRow()], rowCount: 1 });

    const brand = await inWorkspace(() =>
      new BrandRepository(client).findById(WORKSPACE_ID, "88888888-8888-4888-8888-888888888888")
    );

    expect(brand).toMatchObject({
      organizationId: WORKSPACE_ID,
      name: "Acme",
      website: "https://acme.example",
      description: "Acme description",
      industry: undefined,
      country: "Global",
      aliases: ["Acme Inc"],
      targetMarkets: ["global"]
    });
  });
});

describe("BrandEntityAssociationRepository canonical Workspace PostgreSQL contract", () => {
  it("upserts only active Organization/Brand/Entity links against the matching partial unique index", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [brandEntityAssociationRow()], rowCount: 1 });

    const association = await inWorkspace(() =>
      new BrandEntityAssociationRepository(client).save({
        id: "77777777-7777-4777-8777-777777777777",
        organizationId: WORKSPACE_ID,
        brandId: "88888888-8888-4888-8888-888888888888",
        entityId: "99999999-9999-4999-8999-999999999999",
        relationshipType: "owns",
        weight: 1,
        properties: { source: "manual" },
        audit
      })
    );

    expect(association).toMatchObject({
      organizationId: WORKSPACE_ID,
      brandId: "88888888-8888-4888-8888-888888888888",
      entityId: "99999999-9999-4999-8999-999999999999",
      relationshipType: "owns",
      weight: 1
    });
    const [sql] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("ON CONFLICT (organization_id, brand_id, entity_id, relationship_type) WHERE deleted_at IS NULL");
    expect(sql).toContain("RETURNING *");
  });
});

describe("PageRepository Entity junction contract", () => {
  it("returns persisted Page-to-Entity links from PostgreSQL rather than the process-local Map", async () => {
    const { client, query } = createPostgresMock();
    query.mockResolvedValueOnce({ rows: [entityRow()], rowCount: 1 });

    const entities = await inWorkspace(() =>
      new PageRepository(client).getLinkedEntities(
        WORKSPACE_ID,
        "44444444-4444-4444-8444-444444444444"
      )
    );

    expect(entities).toMatchObject([{
      id: "99999999-9999-4999-8999-999999999999",
      organizationId: WORKSPACE_ID,
      name: "Acme Product",
      type: "Product",
      confidence: { score: 0.91, rating: "high" }
    }]);
    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("e.organization_id = pe.organization_id");
    expect(params).toEqual(["44444444-4444-4444-8444-444444444444", WORKSPACE_ID]);
  });
});
