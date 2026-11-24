import {
  ApplicationCommandHandler,
  ApplicationQueryHandler,
  InMemoryBrandRepository,
  InMemoryEntityRepository,
  InMemoryBrandEntityAssociationRepository,
  db
} from "../../../src/features/ai-intelligence";

export async function testApplication() {
  console.log("▶ Running Application (CQRS) Layer Tests...");

  const commandHandler = new ApplicationCommandHandler(
    new InMemoryBrandRepository(),
    new InMemoryEntityRepository(),
    undefined,
    undefined,
    undefined,
    undefined,
    new InMemoryBrandEntityAssociationRepository()
  );
  const queryHandler = new ApplicationQueryHandler(new InMemoryBrandRepository(), new InMemoryEntityRepository());

  const tenantId = "org-enterprise-01";
  const actorId = "user-test-01";

  // 1. Command execution: Create Brand
  const brandDTO = await commandHandler.handleCreateBrand({
    organizationId: tenantId,
    name: "CQRS SaaS Brand",
    website: "https://cqrs-saas.com",
    actorId
  });

  if (brandDTO.name !== "CQRS SaaS Brand") {
    throw new Error("CreateBrandCommand output mismatch");
  }

  // 1.1 Entity discovery is Organization-owned and linked to a Brand explicitly.
  const entityDTO = await commandHandler.handleDiscoverEntity({
    organizationId: tenantId,
    brandId: brandDTO.id,
    relationshipType: "owns",
    name: "CQRS Product",
    type: "Product",
    confidenceScore: 0.9,
    actorId
  });
  if (entityDTO.organizationId !== tenantId || entityDTO.name !== "CQRS Product") {
    throw new Error("DiscoverEntityCommand did not return an Organization-owned Entity.");
  }

  const entityGraph = await queryHandler.handleGetEntityGraph({
    organizationId: tenantId,
    brandId: brandDTO.id
  });
  if (!entityGraph.nodes.some(entity => entity.id === entityDTO.id)) {
    throw new Error("Brand graph did not resolve the explicit Brand–Entity association.");
  }

  // 2. Command execution: Register Prompt
  const promptDTO = await commandHandler.handleRegisterPrompt({
    organizationId: tenantId,
    brandId: brandDTO.id,
    text: "Review of CQRS SaaS Brand?",
    category: "Reviews",
    intent: "Research",
    language: "en",
    priority: "high",
    actorId
  });

  if (promptDTO.text !== "Review of CQRS SaaS Brand?") {
    throw new Error("RegisterPromptCommand output mismatch");
  }

  // 3. Command execution: Process Ingestion Observation
  const obsDTO = await commandHandler.handleCaptureAIObservation({
    organizationId: tenantId,
    promptId: promptDTO.id,
    engineId: "engine-perplexity", // maps to seed
    responseText: "This is a detailed analysis of CQRS SaaS Brand, showing amazing citation link at https://wikipedia.org/wiki/Acme_SaaS.",
    rawVisibilityScore: 82,
    sentimentScore: 88,
    confidenceScore: 0.95,
    actorId
  });

  if (obsDTO.visibilityScore !== 82) {
    throw new Error("CaptureAIObservationCommand output mismatch");
  }

  // 4. Query execution: Get Brand Intelligence Dashboard
  const intelligence = await queryHandler.handleGetBrandIntelligence({
    organizationId: tenantId,
    brandId: "brand-acme-01" // maps to seeded db brand
  });

  if (!intelligence.brand || !intelligence.analytics) {
    throw new Error("GetBrandIntelligenceQuery output is empty");
  }

  console.log(`  * Query Resolved: Brand name is "${intelligence.brand.name}" with composite score ${intelligence.analytics.overallScore}%`);

  // Ensure soft deleted brand is not returned
  const testBrandId = `brand-temp-${Date.now()}`;
  db.brands.set(testBrandId, {
    id: testBrandId,
    organizationId: tenantId,
    name: "Temporary Brand",
    website: "https://temp.com",
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actorId,
      updatedBy: actorId,
      deletedAt: new Date().toISOString(), // Soft deleted!
      version: 1
    }
  });

  const softDeletedCheck = await queryHandler.handleGetBrandIntelligence({
    organizationId: tenantId,
    brandId: testBrandId
  }).catch(() => null);

  if (softDeletedCheck !== null) {
    throw new Error("Query should have thrown error / filtered out soft-deleted brand aggregate.");
  }

  console.log("✅ Application Layer Tests Passed Successfully!");
}
