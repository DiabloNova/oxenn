--
-- PostgreSQL database dump
--

\restrict tYnhP3tazdyZDPmfwkmolPHxKoFdwnumlK54xdrLKEOe70PPmiuKgcp8OyXZ351

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE public.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.__drizzle_migrations_id_seq OWNED BY public.__drizzle_migrations.id;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    role_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: aeo_analyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aeo_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    url text NOT NULL,
    target_keyword text NOT NULL,
    overall_aeo_score integer NOT NULL,
    answerability_score integer NOT NULL,
    entity_coverage_score integer NOT NULL,
    semantic_coverage_score integer NOT NULL,
    question_coverage_score integer NOT NULL,
    citation_readiness_score integer NOT NULL,
    structured_answer_quality_score integer NOT NULL,
    analysis_details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.aeo_analyses OWNER TO postgres;

--
-- Name: ai_engines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_engines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    provider text NOT NULL,
    version text NOT NULL,
    capabilities text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version_num integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.ai_engines OWNER TO postgres;

--
-- Name: ai_observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_observations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    prompt_id uuid NOT NULL,
    engine_id uuid NOT NULL,
    raw_response_text text NOT NULL,
    parsed_sentiment text NOT NULL,
    position_rank integer,
    observed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.ai_observations OWNER TO postgres;

--
-- Name: ai_provider_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_provider_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_name text NOT NULL,
    endpoint_url text NOT NULL,
    api_key_masked text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    failover_provider_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_provider_configs OWNER TO postgres;

--
-- Name: ai_visibility_audits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_visibility_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    target_brand_name text NOT NULL,
    target_domain text NOT NULL,
    overall_score integer NOT NULL,
    brand_authority_score integer NOT NULL,
    ai_search_share_score integer NOT NULL,
    sentiment_score integer NOT NULL,
    citation_reliability_score integer NOT NULL,
    recommendation_share_score integer NOT NULL,
    dimensions_json jsonb NOT NULL,
    audited_engine_ids text[] NOT NULL,
    audited_prompts_count integer NOT NULL,
    raw_observations_count integer NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_visibility_audits OWNER TO postgres;

--
-- Name: audit_prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    prompt_text text NOT NULL,
    category text NOT NULL,
    weight double precision DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_prompts OWNER TO postgres;

--
-- Name: audit_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    actor_id text NOT NULL,
    actor_email text NOT NULL,
    actor_role text NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    payload_before text,
    payload_after text,
    status text NOT NULL,
    error_details text
);


ALTER TABLE public.audit_records OWNER TO postgres;

--
-- Name: brand_associations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_associations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    attribute_name text NOT NULL,
    association_score double precision DEFAULT 0 NOT NULL,
    mention_count integer DEFAULT 0 NOT NULL,
    sample_excerpts text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brand_associations OWNER TO postgres;

--
-- Name: brand_mentions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_mentions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    observation_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    mention_context text NOT NULL,
    is_recommended boolean DEFAULT false NOT NULL,
    sentiment_score double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.brand_mentions OWNER TO postgres;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    canonical_domain text NOT NULL,
    aliases text[] DEFAULT '{}'::text[] NOT NULL,
    industry text NOT NULL,
    target_markets text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: citation_occurrences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citation_occurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    source_id uuid NOT NULL,
    engine_id text NOT NULL,
    prompt_text text NOT NULL,
    citation_position integer DEFAULT 1 NOT NULL,
    excerpt_text text,
    sentiment_score double precision DEFAULT 0 NOT NULL,
    is_brand_mentioned boolean DEFAULT false NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.citation_occurrences OWNER TO postgres;

--
-- Name: citation_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citation_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    url text NOT NULL,
    domain text NOT NULL,
    publisher_name text,
    publisher_category text DEFAULT 'General'::text NOT NULL,
    authority_score integer DEFAULT 50 NOT NULL,
    is_verified_domain boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.citation_sources OWNER TO postgres;

--
-- Name: citations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    observation_id uuid NOT NULL,
    url text NOT NULL,
    domain text NOT NULL,
    anchor_text text,
    citation_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.citations OWNER TO postgres;

--
-- Name: competitive_analyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competitive_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_url text NOT NULL,
    competitor_urls text[] NOT NULL,
    overall_score integer NOT NULL,
    market_position text NOT NULL,
    comparison_data jsonb NOT NULL,
    advantages jsonb NOT NULL,
    gaps jsonb NOT NULL,
    opportunities jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.competitive_analyses OWNER TO postgres;

--
-- Name: competitive_seo_findings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competitive_seo_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    competitor_id uuid,
    finding_type text NOT NULL,
    severity text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
    recommendation text NOT NULL,
    impact_score integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT competitive_seo_findings_finding_type_check CHECK ((finding_type = ANY (ARRAY['technical_gap'::text, 'content_gap'::text, 'keyword_gap'::text, 'topic_gap'::text, 'structural_difference'::text, 'ai_visibility_gap'::text, 'citation_gap'::text, 'prompt_gap'::text, 'brand_mention_gap'::text, 'ai_recommendation_gap'::text, 'citation_overlap'::text])))
);


ALTER TABLE public.competitive_seo_findings OWNER TO postgres;

--
-- Name: competitor_changes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competitor_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    competitor_id uuid NOT NULL,
    change_type text NOT NULL,
    severity text NOT NULL,
    summary text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.competitor_changes OWNER TO postgres;

--
-- Name: competitors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    domain text NOT NULL,
    normalized_url text NOT NULL,
    is_direct boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.competitors OWNER TO postgres;

--
-- Name: crawl_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crawl_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id text NOT NULL,
    cache_scope text DEFAULT 'tenant'::text NOT NULL,
    cache_key text NOT NULL,
    normalized_result jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crawl_cache_scope_check CHECK ((cache_scope = 'tenant'::text))
);


ALTER TABLE public.crawl_cache OWNER TO postgres;

--
-- Name: crawl_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crawl_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id text NOT NULL,
    requested_url text NOT NULL,
    normalized_url text NOT NULL,
    policy jsonb NOT NULL,
    dedup_key text NOT NULL,
    cache_key text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    provider_id text,
    provider_job_id text,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer NOT NULL,
    scheduled_for timestamp with time zone,
    claimed_at timestamp with time zone,
    heartbeat_at timestamp with time zone,
    lease_expires_at timestamp with time zone,
    worker_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    duration_ms integer,
    page_count integer,
    bytes_processed bigint,
    cache_outcome text,
    error jsonb,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    cancellation_requested_by text,
    result_ref uuid,
    correlation_id text,
    request_id text,
    trace_id text,
    version integer DEFAULT 1 NOT NULL,
    CONSTRAINT crawl_jobs_attempts_check CHECK ((attempts >= 0)),
    CONSTRAINT crawl_jobs_cache_outcome_check CHECK (((cache_outcome IS NULL) OR (cache_outcome = ANY (ARRAY['HIT'::text, 'MISS'::text, 'STALE'::text, 'BYPASS'::text])))),
    CONSTRAINT crawl_jobs_max_attempts_check CHECK ((max_attempts > 0)),
    CONSTRAINT crawl_jobs_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'QUEUED'::text, 'RUNNING'::text, 'SUCCEEDED'::text, 'PARTIAL'::text, 'FAILED'::text, 'CANCELLED'::text]))),
    CONSTRAINT crawl_jobs_version_check CHECK ((version > 0))
);


ALTER TABLE public.crawl_jobs OWNER TO postgres;

--
-- Name: crawl_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crawl_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id text NOT NULL,
    job_id uuid NOT NULL,
    result jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.crawl_results OWNER TO postgres;

--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    amount integer NOT NULL,
    transaction_type text NOT NULL,
    description text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.credit_transactions OWNER TO postgres;

--
-- Name: diagnostic_finding_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diagnostic_finding_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    parent_finding_id uuid NOT NULL,
    child_finding_id uuid NOT NULL,
    relationship_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.diagnostic_finding_relationships OWNER TO postgres;

--
-- Name: diagnostic_findings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diagnostic_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    domain text NOT NULL,
    finding_type text NOT NULL,
    severity text NOT NULL,
    confidence double precision NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
    recommendation text NOT NULL,
    impact_score integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.diagnostic_findings OWNER TO postgres;

--
-- Name: document_embeddings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_embeddings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    content_chunk text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    embedding public.vector(768) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_embeddings OWNER TO postgres;

--
-- Name: entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    entity_type text NOT NULL,
    description text,
    properties jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.entities OWNER TO postgres;

--
-- Name: entity_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entity_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    source_entity_id uuid NOT NULL,
    target_entity_id uuid NOT NULL,
    relationship_type text NOT NULL,
    weight double precision DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.entity_relationships OWNER TO postgres;

--
-- Name: faq_opportunities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faq_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    aeo_analysis_id uuid NOT NULL,
    question_text text NOT NULL,
    user_intent text DEFAULT 'Informational'::text NOT NULL,
    opportunity_score integer DEFAULT 50 NOT NULL,
    suggested_answer text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.faq_opportunities OWNER TO postgres;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    is_enabled_globally boolean DEFAULT false NOT NULL,
    tenant_overrides text DEFAULT '{}'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO postgres;

--
-- Name: historical_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historical_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    metric_name text NOT NULL,
    metric_value double precision NOT NULL,
    dimensions jsonb DEFAULT '{}'::jsonb NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.historical_metrics OWNER TO postgres;

--
-- Name: keywords; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.keywords (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    term text NOT NULL,
    normalized_term text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    intent text,
    search_volume integer,
    cpc double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.keywords OWNER TO postgres;

--
-- Name: keywords_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.keywords_topics (
    keyword_id uuid NOT NULL,
    topic_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.keywords_topics OWNER TO postgres;

--
-- Name: kg_alignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kg_alignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    aeo_analysis_id uuid NOT NULL,
    entity_name text NOT NULL,
    entity_type text NOT NULL,
    wikidata_id text,
    alignment_status text DEFAULT 'unmapped'::text NOT NULL,
    confidence double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kg_alignments OWNER TO postgres;

--
-- Name: kg_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kg_entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kg_entities OWNER TO postgres;

--
-- Name: kg_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kg_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    source_entity_id uuid NOT NULL,
    target_entity_id uuid NOT NULL,
    relationship_type text NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kg_relationships OWNER TO postgres;

--
-- Name: organization_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organization_invitations OWNER TO postgres;

--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organization_members OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    website_id uuid NOT NULL,
    url text NOT NULL,
    normalized_url text NOT NULL,
    path text NOT NULL,
    title text,
    meta_description text,
    http_status integer DEFAULT 200 NOT NULL,
    content_type text,
    content_hash text,
    word_count integer DEFAULT 0 NOT NULL,
    canonical_url text,
    robots_directives text[] DEFAULT '{}'::text[] NOT NULL,
    inlink_count integer DEFAULT 0 NOT NULL,
    outlink_count integer DEFAULT 0 NOT NULL,
    last_crawled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- Name: pages_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages_entities (
    page_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    salience double precision DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pages_entities OWNER TO postgres;

--
-- Name: pages_keywords; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages_keywords (
    page_id uuid NOT NULL,
    keyword_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pages_keywords OWNER TO postgres;

--
-- Name: pages_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages_topics (
    page_id uuid NOT NULL,
    topic_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    score double precision DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pages_topics OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: position_observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.position_observations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    source_execution_id uuid NOT NULL,
    subject_entity_id text NOT NULL,
    presence text NOT NULL,
    numeric_position integer,
    evidence_excerpt text NOT NULL,
    evidence_structure text NOT NULL,
    confidence double precision NOT NULL,
    analyzer_version text DEFAULT '1.0.0'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.position_observations OWNER TO postgres;

--
-- Name: premium_audits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.premium_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    url text NOT NULL,
    score integer NOT NULL,
    grade text NOT NULL,
    pages_analyzed integer NOT NULL,
    metrics jsonb NOT NULL,
    issues jsonb NOT NULL,
    recommendations jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.premium_audits OWNER TO postgres;

--
-- Name: prompt_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    name text NOT NULL,
    prompt_template text NOT NULL,
    category text NOT NULL,
    intent text NOT NULL,
    locale text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    variables jsonb NOT NULL,
    competitors text[] NOT NULL,
    tags text[] NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    opt_version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.prompt_definitions OWNER TO postgres;

--
-- Name: prompt_executions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    prompt_id uuid NOT NULL,
    prompt_version integer NOT NULL,
    resolved_prompt_text text NOT NULL,
    variables_values jsonb NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    model_version text,
    response_text text,
    latency_ms integer,
    error_message text,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    scheduled_for timestamp with time zone,
    executed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT prompt_executions_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'succeeded'::text, 'failed'::text, 'timed_out'::text, 'cancelled'::text])))
);


ALTER TABLE public.prompt_executions OWNER TO postgres;

--
-- Name: prompt_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    prompt_id uuid NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    cron_expression text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    next_execution_at timestamp with time zone,
    last_execution_at timestamp with time zone,
    status text DEFAULT 'IDLE'::text NOT NULL,
    failure_reason text,
    schedule_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prompt_schedules OWNER TO postgres;

--
-- Name: prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    query_text text NOT NULL,
    category text NOT NULL,
    buying_intent text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.prompts OWNER TO postgres;

--
-- Name: recommendation_observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendation_observations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    category text NOT NULL,
    recommended_action text NOT NULL,
    engine_id text NOT NULL,
    frequency integer DEFAULT 1 NOT NULL,
    confidence_score double precision DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recommendation_observations OWNER TO postgres;

--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    category text NOT NULL,
    priority text NOT NULL,
    impact_score integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    action_plan jsonb NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    hierarchy_rank integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: system_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    category text NOT NULL,
    is_encrypted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_configurations OWNER TO postgres;

--
-- Name: technical_audits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.technical_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    url text NOT NULL,
    technical_score integer NOT NULL,
    grade text NOT NULL,
    pages_analyzed integer NOT NULL,
    categories jsonb NOT NULL,
    critical_issues jsonb NOT NULL,
    quick_wins jsonb NOT NULL,
    performance_metrics jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.technical_audits OWNER TO postgres;

--
-- Name: tenant_quotas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    max_users integer NOT NULL,
    max_brands integer NOT NULL,
    max_prompts integer NOT NULL,
    max_observations_per_month integer NOT NULL,
    max_crawl_jobs_per_day integer NOT NULL,
    monthly_token_limit integer NOT NULL,
    monthly_cost_limit_usd integer NOT NULL,
    used_observations_this_month integer DEFAULT 0 NOT NULL,
    used_tokens_this_month integer DEFAULT 0 NOT NULL,
    used_crawl_jobs_today integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    credits_balance integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.tenant_quotas OWNER TO postgres;

--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plan text NOT NULL,
    status text NOT NULL,
    billing_cycle text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    price_amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_subscriptions OWNER TO postgres;

--
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    language text DEFAULT 'en'::text NOT NULL,
    parent_topic_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- Name: topics_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics_entities (
    topic_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.topics_entities OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: visibility_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visibility_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    engine_id uuid NOT NULL,
    overall_score integer NOT NULL,
    presence_rate double precision NOT NULL,
    avg_position double precision,
    net_sentiment double precision NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.visibility_scores OWNER TO postgres;

--
-- Name: websites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.websites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    domain text NOT NULL,
    normalized_url text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    cms_type text,
    last_crawled_at timestamp with time zone,
    last_analyzed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    updated_by text DEFAULT 'system'::text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.websites OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('public.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_unique UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: aeo_analyses aeo_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aeo_analyses
    ADD CONSTRAINT aeo_analyses_pkey PRIMARY KEY (id);


--
-- Name: ai_engines ai_engines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_engines
    ADD CONSTRAINT ai_engines_pkey PRIMARY KEY (id);


--
-- Name: ai_observations ai_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_observations
    ADD CONSTRAINT ai_observations_pkey PRIMARY KEY (id);


--
-- Name: ai_provider_configs ai_provider_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_provider_configs
    ADD CONSTRAINT ai_provider_configs_pkey PRIMARY KEY (id);


--
-- Name: ai_visibility_audits ai_visibility_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_visibility_audits
    ADD CONSTRAINT ai_visibility_audits_pkey PRIMARY KEY (id);


--
-- Name: audit_prompts audit_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_prompts
    ADD CONSTRAINT audit_prompts_pkey PRIMARY KEY (id);


--
-- Name: audit_records audit_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_records
    ADD CONSTRAINT audit_records_pkey PRIMARY KEY (id);


--
-- Name: brand_associations brand_associations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_associations
    ADD CONSTRAINT brand_associations_pkey PRIMARY KEY (id);


--
-- Name: brand_mentions brand_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_mentions
    ADD CONSTRAINT brand_mentions_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: citation_occurrences citation_occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citation_occurrences
    ADD CONSTRAINT citation_occurrences_pkey PRIMARY KEY (id);


--
-- Name: citation_sources citation_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citation_sources
    ADD CONSTRAINT citation_sources_pkey PRIMARY KEY (id);


--
-- Name: citations citations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citations
    ADD CONSTRAINT citations_pkey PRIMARY KEY (id);


--
-- Name: competitive_analyses competitive_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitive_analyses
    ADD CONSTRAINT competitive_analyses_pkey PRIMARY KEY (id);


--
-- Name: competitive_seo_findings competitive_seo_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitive_seo_findings
    ADD CONSTRAINT competitive_seo_findings_pkey PRIMARY KEY (id);


--
-- Name: competitor_changes competitor_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitor_changes
    ADD CONSTRAINT competitor_changes_pkey PRIMARY KEY (id);


--
-- Name: competitors competitors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitors
    ADD CONSTRAINT competitors_pkey PRIMARY KEY (id);


--
-- Name: crawl_cache crawl_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crawl_cache
    ADD CONSTRAINT crawl_cache_pkey PRIMARY KEY (id);


--
-- Name: crawl_jobs crawl_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crawl_jobs
    ADD CONSTRAINT crawl_jobs_pkey PRIMARY KEY (id);


--
-- Name: crawl_results crawl_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crawl_results
    ADD CONSTRAINT crawl_results_pkey PRIMARY KEY (id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_finding_relationships diagnostic_finding_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_finding_relationships
    ADD CONSTRAINT diagnostic_finding_relationships_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_findings diagnostic_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_findings
    ADD CONSTRAINT diagnostic_findings_pkey PRIMARY KEY (id);


--
-- Name: document_embeddings document_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_embeddings
    ADD CONSTRAINT document_embeddings_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: entity_relationships entity_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_relationships
    ADD CONSTRAINT entity_relationships_pkey PRIMARY KEY (id);


--
-- Name: faq_opportunities faq_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faq_opportunities
    ADD CONSTRAINT faq_opportunities_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_key_unique UNIQUE (key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: historical_metrics historical_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historical_metrics
    ADD CONSTRAINT historical_metrics_pkey PRIMARY KEY (id);


--
-- Name: keywords keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_pkey PRIMARY KEY (id);


--
-- Name: keywords_topics keywords_topics_keyword_id_topic_id_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords_topics
    ADD CONSTRAINT keywords_topics_keyword_id_topic_id_pk PRIMARY KEY (keyword_id, topic_id);


--
-- Name: kg_alignments kg_alignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_alignments
    ADD CONSTRAINT kg_alignments_pkey PRIMARY KEY (id);


--
-- Name: kg_entities kg_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_entities
    ADD CONSTRAINT kg_entities_pkey PRIMARY KEY (id);


--
-- Name: kg_relationships kg_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_relationships
    ADD CONSTRAINT kg_relationships_pkey PRIMARY KEY (id);


--
-- Name: organization_invitations organization_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_pkey PRIMARY KEY (id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);


--
-- Name: pages_entities pages_entities_page_id_entity_id_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_entities
    ADD CONSTRAINT pages_entities_page_id_entity_id_pk PRIMARY KEY (page_id, entity_id);


--
-- Name: pages_keywords pages_keywords_page_id_keyword_id_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_keywords
    ADD CONSTRAINT pages_keywords_page_id_keyword_id_pk PRIMARY KEY (page_id, keyword_id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: pages_topics pages_topics_page_id_topic_id_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_topics
    ADD CONSTRAINT pages_topics_page_id_topic_id_pk PRIMARY KEY (page_id, topic_id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: position_observations position_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_observations
    ADD CONSTRAINT position_observations_pkey PRIMARY KEY (id);


--
-- Name: premium_audits premium_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_audits
    ADD CONSTRAINT premium_audits_pkey PRIMARY KEY (id);


--
-- Name: prompt_definitions prompt_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_definitions
    ADD CONSTRAINT prompt_definitions_pkey PRIMARY KEY (id);


--
-- Name: prompt_executions prompt_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_executions
    ADD CONSTRAINT prompt_executions_pkey PRIMARY KEY (id);


--
-- Name: prompt_schedules prompt_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_schedules
    ADD CONSTRAINT prompt_schedules_pkey PRIMARY KEY (id);


--
-- Name: prompts prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);


--
-- Name: recommendation_observations recommendation_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_observations
    ADD CONSTRAINT recommendation_observations_pkey PRIMARY KEY (id);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: system_configurations system_configurations_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_key_unique UNIQUE (key);


--
-- Name: system_configurations system_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_pkey PRIMARY KEY (id);


--
-- Name: technical_audits technical_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.technical_audits
    ADD CONSTRAINT technical_audits_pkey PRIMARY KEY (id);


--
-- Name: tenant_quotas tenant_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_quotas
    ADD CONSTRAINT tenant_quotas_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscriptions tenant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: topics_entities topics_entities_topic_id_entity_id_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics_entities
    ADD CONSTRAINT topics_entities_topic_id_entity_id_pk PRIMARY KEY (topic_id, entity_id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visibility_scores visibility_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visibility_scores
    ADD CONSTRAINT visibility_scores_pkey PRIMARY KEY (id);


--
-- Name: websites websites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.websites
    ADD CONSTRAINT websites_pkey PRIMARY KEY (id);


--
-- Name: crawl_results_job_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX crawl_results_job_unique ON public.crawl_results USING btree (job_id);


--
-- Name: crawl_results_tenant_job_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX crawl_results_tenant_job_unique ON public.crawl_results USING btree (tenant_id, job_id);


--
-- Name: idx_admin_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_deleted_at ON public.admin_users USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_admin_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);


--
-- Name: idx_aeo_analyses_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeo_analyses_tenant ON public.aeo_analyses USING btree (tenant_id);


--
-- Name: idx_aeo_analyses_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeo_analyses_url ON public.aeo_analyses USING btree (url);


--
-- Name: idx_ai_observations_engine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_observations_engine ON public.ai_observations USING btree (engine_id);


--
-- Name: idx_ai_observations_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_observations_organization ON public.ai_observations USING btree (organization_id);


--
-- Name: idx_ai_observations_prompt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_observations_prompt ON public.ai_observations USING btree (prompt_id);


--
-- Name: idx_ai_provider_configs_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_provider_configs_active ON public.ai_provider_configs USING btree (is_active);


--
-- Name: idx_ai_vis_audits_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_vis_audits_brand ON public.ai_visibility_audits USING btree (target_brand_name);


--
-- Name: idx_ai_vis_audits_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_vis_audits_org ON public.ai_visibility_audits USING btree (organization_id);


--
-- Name: idx_ai_vis_audits_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_vis_audits_status ON public.ai_visibility_audits USING btree (status);


--
-- Name: idx_audit_prompts_audit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_prompts_audit ON public.audit_prompts USING btree (audit_id);


--
-- Name: idx_audit_prompts_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_prompts_org ON public.audit_prompts USING btree (organization_id);


--
-- Name: idx_audit_records_actor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_records_actor ON public.audit_records USING btree (actor_id);


--
-- Name: idx_audit_records_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_records_resource ON public.audit_records USING btree (resource_type, resource_id);


--
-- Name: idx_audit_records_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_records_timestamp ON public.audit_records USING btree ("timestamp");


--
-- Name: idx_brand_associations_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_associations_brand ON public.brand_associations USING btree (brand_id);


--
-- Name: idx_brand_associations_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_associations_tenant ON public.brand_associations USING btree (organization_id);


--
-- Name: idx_brand_mentions_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_mentions_brand ON public.brand_mentions USING btree (brand_id);


--
-- Name: idx_brand_mentions_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_mentions_organization ON public.brand_mentions USING btree (organization_id);


--
-- Name: idx_brands_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brands_domain ON public.brands USING btree (canonical_domain);


--
-- Name: idx_brands_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brands_organization ON public.brands USING btree (organization_id);


--
-- Name: idx_citation_occurrences_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citation_occurrences_source ON public.citation_occurrences USING btree (source_id);


--
-- Name: idx_citation_occurrences_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citation_occurrences_tenant ON public.citation_occurrences USING btree (organization_id);


--
-- Name: idx_citation_sources_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citation_sources_tenant ON public.citation_sources USING btree (organization_id);


--
-- Name: idx_citation_sources_url_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_citation_sources_url_org ON public.citation_sources USING btree (organization_id, url);


--
-- Name: idx_citations_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citations_domain ON public.citations USING btree (domain);


--
-- Name: idx_citations_observation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citations_observation ON public.citations USING btree (observation_id);


--
-- Name: idx_citations_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_citations_organization ON public.citations USING btree (organization_id);


--
-- Name: idx_comp_seo_findings_comp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comp_seo_findings_comp ON public.competitive_seo_findings USING btree (competitor_id);


--
-- Name: idx_comp_seo_findings_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comp_seo_findings_tenant ON public.competitive_seo_findings USING btree (tenant_id);


--
-- Name: idx_comp_seo_findings_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comp_seo_findings_type ON public.competitive_seo_findings USING btree (finding_type);


--
-- Name: idx_competitor_changes_comp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_competitor_changes_comp ON public.competitor_changes USING btree (competitor_id);


--
-- Name: idx_competitor_changes_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_competitor_changes_tenant ON public.competitor_changes USING btree (tenant_id);


--
-- Name: idx_competitor_changes_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_competitor_changes_type ON public.competitor_changes USING btree (change_type);


--
-- Name: idx_competitors_domain_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_competitors_domain_org ON public.competitors USING btree (organization_id, domain) WHERE (deleted_at IS NULL);


--
-- Name: idx_competitors_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_competitors_organization ON public.competitors USING btree (organization_id);


--
-- Name: idx_crawl_cache_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_crawl_cache_key ON public.crawl_cache USING btree (tenant_id, cache_scope, cache_key);


--
-- Name: idx_crawl_jobs_active_dedup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_crawl_jobs_active_dedup ON public.crawl_jobs USING btree (tenant_id, dedup_key) WHERE (status = ANY (ARRAY['PENDING'::text, 'QUEUED'::text, 'RUNNING'::text]));


--
-- Name: idx_crawl_jobs_provider_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crawl_jobs_provider_job_id ON public.crawl_jobs USING btree (provider_job_id);


--
-- Name: idx_crawl_jobs_status_scheduled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crawl_jobs_status_scheduled ON public.crawl_jobs USING btree (status, scheduled_for) WHERE (status = 'QUEUED'::text);


--
-- Name: idx_crawl_jobs_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crawl_jobs_tenant_created ON public.crawl_jobs USING btree (tenant_id, created_at);


--
-- Name: idx_crawl_jobs_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crawl_jobs_tenant_status ON public.crawl_jobs USING btree (tenant_id, status);


--
-- Name: idx_credit_transactions_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_transactions_tenant ON public.credit_transactions USING btree (tenant_id);


--
-- Name: idx_diagnostic_findings_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_findings_domain ON public.diagnostic_findings USING btree (domain);


--
-- Name: idx_diagnostic_findings_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_findings_org ON public.diagnostic_findings USING btree (organization_id);


--
-- Name: idx_diagnostic_findings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_findings_status ON public.diagnostic_findings USING btree (status);


--
-- Name: idx_diagnostic_rel_child; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_rel_child ON public.diagnostic_finding_relationships USING btree (child_finding_id);


--
-- Name: idx_diagnostic_rel_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_rel_org ON public.diagnostic_finding_relationships USING btree (organization_id);


--
-- Name: idx_diagnostic_rel_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diagnostic_rel_parent ON public.diagnostic_finding_relationships USING btree (parent_finding_id);


--
-- Name: idx_document_embeddings_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_embeddings_tenant ON public.document_embeddings USING btree (tenant_id);


--
-- Name: idx_entities_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entities_organization ON public.entities USING btree (organization_id);


--
-- Name: idx_entities_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entities_type ON public.entities USING btree (entity_type);


--
-- Name: idx_entity_relationships_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entity_relationships_org ON public.entity_relationships USING btree (organization_id);


--
-- Name: idx_entity_relationships_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entity_relationships_source ON public.entity_relationships USING btree (source_entity_id);


--
-- Name: idx_entity_relationships_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entity_relationships_target ON public.entity_relationships USING btree (target_entity_id);


--
-- Name: idx_faq_opps_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_faq_opps_analysis ON public.faq_opportunities USING btree (aeo_analysis_id);


--
-- Name: idx_faq_opps_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_faq_opps_tenant ON public.faq_opportunities USING btree (tenant_id);


--
-- Name: idx_feature_flags_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feature_flags_key ON public.feature_flags USING btree (key);


--
-- Name: idx_historical_metrics_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historical_metrics_lookup ON public.historical_metrics USING btree (organization_id, entity_type, entity_id, metric_name);


--
-- Name: idx_historical_metrics_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historical_metrics_time ON public.historical_metrics USING btree (recorded_at);


--
-- Name: idx_keywords_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_keywords_organization ON public.keywords USING btree (organization_id);


--
-- Name: idx_keywords_term_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_keywords_term_org ON public.keywords USING btree (organization_id, normalized_term) WHERE (deleted_at IS NULL);


--
-- Name: idx_keywords_topics_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_keywords_topics_org ON public.keywords_topics USING btree (organization_id);


--
-- Name: idx_kg_alignments_analysis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_alignments_analysis ON public.kg_alignments USING btree (aeo_analysis_id);


--
-- Name: idx_kg_alignments_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_alignments_tenant ON public.kg_alignments USING btree (tenant_id);


--
-- Name: idx_kg_entities_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_entities_name ON public.kg_entities USING btree (name);


--
-- Name: idx_kg_entities_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_entities_tenant ON public.kg_entities USING btree (tenant_id);


--
-- Name: idx_kg_relationships_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_relationships_source ON public.kg_relationships USING btree (source_entity_id);


--
-- Name: idx_kg_relationships_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_relationships_target ON public.kg_relationships USING btree (target_entity_id);


--
-- Name: idx_kg_relationships_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kg_relationships_tenant ON public.kg_relationships USING btree (tenant_id);


--
-- Name: idx_org_invitations_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_invitations_email ON public.organization_invitations USING btree (email);


--
-- Name: idx_org_invitations_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_invitations_token ON public.organization_invitations USING btree (token_hash);


--
-- Name: idx_org_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_members_user_id ON public.organization_members USING btree (user_id);


--
-- Name: idx_org_members_user_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_org_members_user_org ON public.organization_members USING btree (organization_id, user_id);


--
-- Name: idx_organizations_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_organizations_slug ON public.organizations USING btree (slug) WHERE (deleted_at IS NULL);


--
-- Name: idx_pages_entities_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pages_entities_org ON public.pages_entities USING btree (organization_id);


--
-- Name: idx_pages_keywords_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pages_keywords_org ON public.pages_keywords USING btree (organization_id);


--
-- Name: idx_pages_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pages_organization ON public.pages USING btree (organization_id);


--
-- Name: idx_pages_topics_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pages_topics_org ON public.pages_topics USING btree (organization_id);


--
-- Name: idx_pages_url_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_pages_url_org ON public.pages USING btree (organization_id, normalized_url) WHERE (deleted_at IS NULL);


--
-- Name: idx_pages_website; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pages_website ON public.pages USING btree (website_id);


--
-- Name: idx_permissions_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permissions_role_id ON public.permissions USING btree (role_id);


--
-- Name: idx_position_obs_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_position_obs_tenant ON public.position_observations USING btree (organization_id);


--
-- Name: idx_premium_audits_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_premium_audits_organization ON public.premium_audits USING btree (organization_id);


--
-- Name: idx_prompt_definitions_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompt_definitions_tenant ON public.prompt_definitions USING btree (organization_id);


--
-- Name: idx_prompt_executions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompt_executions_status ON public.prompt_executions USING btree (status);


--
-- Name: idx_prompt_executions_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompt_executions_tenant ON public.prompt_executions USING btree (organization_id);


--
-- Name: idx_prompt_schedules_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompt_schedules_tenant ON public.prompt_schedules USING btree (organization_id);


--
-- Name: idx_prompts_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompts_brand ON public.prompts USING btree (brand_id);


--
-- Name: idx_prompts_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompts_organization ON public.prompts USING btree (organization_id);


--
-- Name: idx_recommendation_obs_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendation_obs_brand ON public.recommendation_observations USING btree (brand_id);


--
-- Name: idx_recommendation_obs_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendation_obs_tenant ON public.recommendation_observations USING btree (organization_id);


--
-- Name: idx_recommendations_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendations_brand ON public.recommendations USING btree (brand_id);


--
-- Name: idx_recommendations_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendations_organization ON public.recommendations USING btree (organization_id);


--
-- Name: idx_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_name ON public.roles USING btree (name);


--
-- Name: idx_system_configurations_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_configurations_key ON public.system_configurations USING btree (key);


--
-- Name: idx_tenant_quotas_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_quotas_tenant ON public.tenant_quotas USING btree (tenant_id);


--
-- Name: idx_tenant_subscriptions_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_subscriptions_tenant ON public.tenant_subscriptions USING btree (tenant_id);


--
-- Name: idx_topics_entities_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_topics_entities_org ON public.topics_entities USING btree (organization_id);


--
-- Name: idx_topics_name_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_topics_name_org ON public.topics USING btree (organization_id, name) WHERE (deleted_at IS NULL);


--
-- Name: idx_topics_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_topics_organization ON public.topics USING btree (organization_id);


--
-- Name: idx_visibility_scores_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visibility_scores_brand ON public.visibility_scores USING btree (brand_id);


--
-- Name: idx_visibility_scores_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visibility_scores_organization ON public.visibility_scores USING btree (organization_id);


--
-- Name: idx_websites_domain_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_websites_domain_org ON public.websites USING btree (organization_id, domain) WHERE (deleted_at IS NULL);


--
-- Name: idx_websites_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_websites_organization ON public.websites USING btree (organization_id);


--
-- Name: aeo_analyses aeo_analyses_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aeo_analyses
    ADD CONSTRAINT aeo_analyses_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ai_observations ai_observations_engine_id_ai_engines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_observations
    ADD CONSTRAINT ai_observations_engine_id_ai_engines_id_fk FOREIGN KEY (engine_id) REFERENCES public.ai_engines(id) ON DELETE CASCADE;


--
-- Name: ai_observations ai_observations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_observations
    ADD CONSTRAINT ai_observations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ai_observations ai_observations_prompt_id_prompts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_observations
    ADD CONSTRAINT ai_observations_prompt_id_prompts_id_fk FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- Name: ai_visibility_audits ai_visibility_audits_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_visibility_audits
    ADD CONSTRAINT ai_visibility_audits_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: audit_prompts audit_prompts_audit_id_ai_visibility_audits_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_prompts
    ADD CONSTRAINT audit_prompts_audit_id_ai_visibility_audits_id_fk FOREIGN KEY (audit_id) REFERENCES public.ai_visibility_audits(id) ON DELETE CASCADE;


--
-- Name: audit_prompts audit_prompts_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_prompts
    ADD CONSTRAINT audit_prompts_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: brand_associations brand_associations_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_associations
    ADD CONSTRAINT brand_associations_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: brand_associations brand_associations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_associations
    ADD CONSTRAINT brand_associations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: brand_mentions brand_mentions_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_mentions
    ADD CONSTRAINT brand_mentions_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: brand_mentions brand_mentions_observation_id_ai_observations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_mentions
    ADD CONSTRAINT brand_mentions_observation_id_ai_observations_id_fk FOREIGN KEY (observation_id) REFERENCES public.ai_observations(id) ON DELETE CASCADE;


--
-- Name: brand_mentions brand_mentions_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_mentions
    ADD CONSTRAINT brand_mentions_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: brands brands_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: citation_occurrences citation_occurrences_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citation_occurrences
    ADD CONSTRAINT citation_occurrences_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: citation_occurrences citation_occurrences_source_id_citation_sources_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citation_occurrences
    ADD CONSTRAINT citation_occurrences_source_id_citation_sources_id_fk FOREIGN KEY (source_id) REFERENCES public.citation_sources(id) ON DELETE CASCADE;


--
-- Name: citation_sources citation_sources_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citation_sources
    ADD CONSTRAINT citation_sources_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: citations citations_observation_id_ai_observations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citations
    ADD CONSTRAINT citations_observation_id_ai_observations_id_fk FOREIGN KEY (observation_id) REFERENCES public.ai_observations(id) ON DELETE CASCADE;


--
-- Name: citations citations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citations
    ADD CONSTRAINT citations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: competitive_seo_findings competitive_seo_findings_competitor_id_competitors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitive_seo_findings
    ADD CONSTRAINT competitive_seo_findings_competitor_id_competitors_id_fk FOREIGN KEY (competitor_id) REFERENCES public.competitors(id) ON DELETE SET NULL;


--
-- Name: competitive_seo_findings competitive_seo_findings_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitive_seo_findings
    ADD CONSTRAINT competitive_seo_findings_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: competitor_changes competitor_changes_competitor_id_competitors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitor_changes
    ADD CONSTRAINT competitor_changes_competitor_id_competitors_id_fk FOREIGN KEY (competitor_id) REFERENCES public.competitors(id) ON DELETE CASCADE;


--
-- Name: competitor_changes competitor_changes_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitor_changes
    ADD CONSTRAINT competitor_changes_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: competitors competitors_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitors
    ADD CONSTRAINT competitors_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: crawl_results crawl_results_job_id_crawl_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crawl_results
    ADD CONSTRAINT crawl_results_job_id_crawl_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.crawl_jobs(id) ON DELETE CASCADE;


--
-- Name: diagnostic_finding_relationships diagnostic_finding_relationships_child_finding_id_diagnostic_fi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_finding_relationships
    ADD CONSTRAINT diagnostic_finding_relationships_child_finding_id_diagnostic_fi FOREIGN KEY (child_finding_id) REFERENCES public.diagnostic_findings(id) ON DELETE CASCADE;


--
-- Name: diagnostic_finding_relationships diagnostic_finding_relationships_organization_id_organizations_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_finding_relationships
    ADD CONSTRAINT diagnostic_finding_relationships_organization_id_organizations_ FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: diagnostic_finding_relationships diagnostic_finding_relationships_parent_finding_id_diagnostic_f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_finding_relationships
    ADD CONSTRAINT diagnostic_finding_relationships_parent_finding_id_diagnostic_f FOREIGN KEY (parent_finding_id) REFERENCES public.diagnostic_findings(id) ON DELETE CASCADE;


--
-- Name: diagnostic_findings diagnostic_findings_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diagnostic_findings
    ADD CONSTRAINT diagnostic_findings_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: entities entities_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: entity_relationships entity_relationships_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_relationships
    ADD CONSTRAINT entity_relationships_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: entity_relationships entity_relationships_source_entity_id_entities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_relationships
    ADD CONSTRAINT entity_relationships_source_entity_id_entities_id_fk FOREIGN KEY (source_entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: entity_relationships entity_relationships_target_entity_id_entities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_relationships
    ADD CONSTRAINT entity_relationships_target_entity_id_entities_id_fk FOREIGN KEY (target_entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: faq_opportunities faq_opportunities_aeo_analysis_id_aeo_analyses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faq_opportunities
    ADD CONSTRAINT faq_opportunities_aeo_analysis_id_aeo_analyses_id_fk FOREIGN KEY (aeo_analysis_id) REFERENCES public.aeo_analyses(id) ON DELETE CASCADE;


--
-- Name: faq_opportunities faq_opportunities_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faq_opportunities
    ADD CONSTRAINT faq_opportunities_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: historical_metrics historical_metrics_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historical_metrics
    ADD CONSTRAINT historical_metrics_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: keywords keywords_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: keywords_topics keywords_topics_keyword_id_keywords_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords_topics
    ADD CONSTRAINT keywords_topics_keyword_id_keywords_id_fk FOREIGN KEY (keyword_id) REFERENCES public.keywords(id) ON DELETE CASCADE;


--
-- Name: keywords_topics keywords_topics_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords_topics
    ADD CONSTRAINT keywords_topics_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: keywords_topics keywords_topics_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keywords_topics
    ADD CONSTRAINT keywords_topics_topic_id_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: kg_alignments kg_alignments_aeo_analysis_id_aeo_analyses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_alignments
    ADD CONSTRAINT kg_alignments_aeo_analysis_id_aeo_analyses_id_fk FOREIGN KEY (aeo_analysis_id) REFERENCES public.aeo_analyses(id) ON DELETE CASCADE;


--
-- Name: kg_alignments kg_alignments_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_alignments
    ADD CONSTRAINT kg_alignments_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: kg_entities kg_entities_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_entities
    ADD CONSTRAINT kg_entities_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: kg_relationships kg_relationships_source_entity_id_kg_entities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_relationships
    ADD CONSTRAINT kg_relationships_source_entity_id_kg_entities_id_fk FOREIGN KEY (source_entity_id) REFERENCES public.kg_entities(id) ON DELETE CASCADE;


--
-- Name: kg_relationships kg_relationships_target_entity_id_kg_entities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_relationships
    ADD CONSTRAINT kg_relationships_target_entity_id_kg_entities_id_fk FOREIGN KEY (target_entity_id) REFERENCES public.kg_entities(id) ON DELETE CASCADE;


--
-- Name: kg_relationships kg_relationships_tenant_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kg_relationships
    ADD CONSTRAINT kg_relationships_tenant_id_organizations_id_fk FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pages_entities pages_entities_entity_id_entities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_entities
    ADD CONSTRAINT pages_entities_entity_id_entities_id_fk FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: pages_entities pages_entities_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_entities
    ADD CONSTRAINT pages_entities_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pages_entities pages_entities_page_id_pages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_entities
    ADD CONSTRAINT pages_entities_page_id_pages_id_fk FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: pages_keywords pages_keywords_keyword_id_keywords_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_keywords
    ADD CONSTRAINT pages_keywords_keyword_id_keywords_id_fk FOREIGN KEY (keyword_id) REFERENCES public.keywords(id) ON DELETE CASCADE;


--
-- Name: pages_keywords pages_keywords_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_keywords
    ADD CONSTRAINT pages_keywords_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pages_keywords pages_keywords_page_id_pages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_keywords
    ADD CONSTRAINT pages_keywords_page_id_pages_id_fk FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: pages pages_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pages_topics pages_topics_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_topics
    ADD CONSTRAINT pages_topics_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pages_topics pages_topics_page_id_pages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_topics
    ADD CONSTRAINT pages_topics_page_id_pages_id_fk FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: pages_topics pages_topics_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages_topics
    ADD CONSTRAINT pages_topics_topic_id_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: pages pages_website_id_websites_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_website_id_websites_id_fk FOREIGN KEY (website_id) REFERENCES public.websites(id) ON DELETE CASCADE;


--
-- Name: permissions permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: position_observations position_observations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_observations
    ADD CONSTRAINT position_observations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: position_observations position_observations_source_execution_id_prompt_executions_id_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_observations
    ADD CONSTRAINT position_observations_source_execution_id_prompt_executions_id_ FOREIGN KEY (source_execution_id) REFERENCES public.prompt_executions(id) ON DELETE CASCADE;


--
-- Name: premium_audits premium_audits_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_audits
    ADD CONSTRAINT premium_audits_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: prompt_definitions prompt_definitions_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_definitions
    ADD CONSTRAINT prompt_definitions_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: prompt_definitions prompt_definitions_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_definitions
    ADD CONSTRAINT prompt_definitions_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: prompt_executions prompt_executions_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_executions
    ADD CONSTRAINT prompt_executions_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: prompt_executions prompt_executions_prompt_id_prompt_definitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_executions
    ADD CONSTRAINT prompt_executions_prompt_id_prompt_definitions_id_fk FOREIGN KEY (prompt_id) REFERENCES public.prompt_definitions(id) ON DELETE CASCADE;


--
-- Name: prompt_schedules prompt_schedules_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_schedules
    ADD CONSTRAINT prompt_schedules_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: prompt_schedules prompt_schedules_prompt_id_prompt_definitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_schedules
    ADD CONSTRAINT prompt_schedules_prompt_id_prompt_definitions_id_fk FOREIGN KEY (prompt_id) REFERENCES public.prompt_definitions(id) ON DELETE CASCADE;


--
-- Name: prompts prompts_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: prompts prompts_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: recommendation_observations recommendation_observations_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_observations
    ADD CONSTRAINT recommendation_observations_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: recommendation_observations recommendation_observations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_observations
    ADD CONSTRAINT recommendation_observations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: recommendations recommendations_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: recommendations recommendations_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: topics_entities topics_entities_entity_id_entities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics_entities
    ADD CONSTRAINT topics_entities_entity_id_entities_id_fk FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: topics_entities topics_entities_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics_entities
    ADD CONSTRAINT topics_entities_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: topics_entities topics_entities_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics_entities
    ADD CONSTRAINT topics_entities_topic_id_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: topics topics_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: topics topics_parent_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_parent_topic_id_topics_id_fk FOREIGN KEY (parent_topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;


--
-- Name: visibility_scores visibility_scores_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visibility_scores
    ADD CONSTRAINT visibility_scores_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: visibility_scores visibility_scores_engine_id_ai_engines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visibility_scores
    ADD CONSTRAINT visibility_scores_engine_id_ai_engines_id_fk FOREIGN KEY (engine_id) REFERENCES public.ai_engines(id) ON DELETE CASCADE;


--
-- Name: visibility_scores visibility_scores_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visibility_scores
    ADD CONSTRAINT visibility_scores_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: websites websites_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.websites
    ADD CONSTRAINT websites_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: aeo_analyses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.aeo_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_observations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_observations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_visibility_audits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_visibility_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_prompts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: brand_associations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.brand_associations ENABLE ROW LEVEL SECURITY;

--
-- Name: brand_mentions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: citation_occurrences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.citation_occurrences ENABLE ROW LEVEL SECURITY;

--
-- Name: citation_sources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.citation_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: citations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

--
-- Name: competitive_analyses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.competitive_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: competitive_seo_findings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.competitive_seo_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: competitor_changes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.competitor_changes ENABLE ROW LEVEL SECURITY;

--
-- Name: competitors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

--
-- Name: crawl_cache; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.crawl_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: crawl_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: crawl_results; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.crawl_results ENABLE ROW LEVEL SECURITY;

--
-- Name: crawl_cache crawl_tenant_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY crawl_tenant_policy ON public.crawl_cache USING ((tenant_id = NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))) WITH CHECK ((tenant_id = NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text)));


--
-- Name: crawl_jobs crawl_tenant_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY crawl_tenant_policy ON public.crawl_jobs USING ((tenant_id = NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))) WITH CHECK ((tenant_id = NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text)));


--
-- Name: crawl_results crawl_tenant_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY crawl_tenant_policy ON public.crawl_results USING ((tenant_id = NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))) WITH CHECK ((tenant_id = NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text)));


--
-- Name: credit_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations delete_org_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_org_isolation_policy ON public.organizations FOR DELETE USING ((id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_observations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.ai_observations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_visibility_audits delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.ai_visibility_audits FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: audit_prompts delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.audit_prompts FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_associations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.brand_associations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_mentions delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.brand_mentions FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brands delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.brands FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_occurrences delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.citation_occurrences FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_sources delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.citation_sources FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.citations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_analyses delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.competitive_analyses FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitors delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.competitors FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_finding_relationships delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.diagnostic_finding_relationships FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_findings delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.diagnostic_findings FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entities delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.entities FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entity_relationships delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.entity_relationships FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: historical_metrics delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.historical_metrics FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: keywords delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.keywords FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_invitations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.organization_invitations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_members delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.organization_members FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: pages delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.pages FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: position_observations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.position_observations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: premium_audits delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.premium_audits FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_definitions delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.prompt_definitions FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_executions delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.prompt_executions FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_schedules delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.prompt_schedules FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompts delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.prompts FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendation_observations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.recommendation_observations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendations delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.recommendations FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: technical_audits delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.technical_audits FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: topics delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.topics FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: visibility_scores delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.visibility_scores FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: websites delete_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_organization_id_isolation_policy ON public.websites FOR DELETE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: aeo_analyses delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.aeo_analyses FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_seo_findings delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.competitive_seo_findings FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitor_changes delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.competitor_changes FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: credit_transactions delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.credit_transactions FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: document_embeddings delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.document_embeddings FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: faq_opportunities delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.faq_opportunities FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_alignments delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.kg_alignments FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_entities delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.kg_entities FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_relationships delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.kg_relationships FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_quotas delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.tenant_quotas FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_subscriptions delete_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY delete_tenant_id_isolation_policy ON public.tenant_subscriptions FOR DELETE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_finding_relationships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.diagnostic_finding_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: diagnostic_findings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.diagnostic_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: document_embeddings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

--
-- Name: entities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_relationships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: faq_opportunities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.faq_opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: historical_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.historical_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations insert_org_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_org_isolation_policy ON public.organizations FOR INSERT WITH CHECK ((id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_observations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.ai_observations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_visibility_audits insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.ai_visibility_audits FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: audit_prompts insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.audit_prompts FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_associations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.brand_associations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_mentions insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.brand_mentions FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brands insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.brands FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_occurrences insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.citation_occurrences FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_sources insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.citation_sources FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.citations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_analyses insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.competitive_analyses FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitors insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.competitors FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_finding_relationships insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.diagnostic_finding_relationships FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_findings insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.diagnostic_findings FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entities insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.entities FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entity_relationships insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.entity_relationships FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: historical_metrics insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.historical_metrics FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: keywords insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.keywords FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_invitations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.organization_invitations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_members insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.organization_members FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: pages insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.pages FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: position_observations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.position_observations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: premium_audits insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.premium_audits FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_definitions insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.prompt_definitions FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_executions insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.prompt_executions FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_schedules insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.prompt_schedules FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompts insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.prompts FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendation_observations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.recommendation_observations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendations insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.recommendations FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: technical_audits insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.technical_audits FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: topics insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.topics FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: visibility_scores insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.visibility_scores FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: websites insert_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_organization_id_isolation_policy ON public.websites FOR INSERT WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: aeo_analyses insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.aeo_analyses FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_seo_findings insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.competitive_seo_findings FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitor_changes insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.competitor_changes FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: credit_transactions insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.credit_transactions FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: document_embeddings insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.document_embeddings FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: faq_opportunities insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.faq_opportunities FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_alignments insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.kg_alignments FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_entities insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.kg_entities FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_relationships insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.kg_relationships FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_quotas insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.tenant_quotas FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_subscriptions insert_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY insert_tenant_id_isolation_policy ON public.tenant_subscriptions FOR INSERT WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: keywords; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

--
-- Name: kg_alignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kg_alignments ENABLE ROW LEVEL SECURITY;

--
-- Name: kg_entities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kg_entities ENABLE ROW LEVEL SECURITY;

--
-- Name: kg_relationships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kg_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_invitations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: pages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

--
-- Name: position_observations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.position_observations ENABLE ROW LEVEL SECURITY;

--
-- Name: premium_audits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.premium_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: prompt_definitions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_definitions ENABLE ROW LEVEL SECURITY;

--
-- Name: prompt_executions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_executions ENABLE ROW LEVEL SECURITY;

--
-- Name: prompt_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: prompts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: recommendation_observations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.recommendation_observations ENABLE ROW LEVEL SECURITY;

--
-- Name: recommendations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations select_org_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_org_isolation_policy ON public.organizations FOR SELECT USING ((id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_observations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.ai_observations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_visibility_audits select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.ai_visibility_audits FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: audit_prompts select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.audit_prompts FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_associations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.brand_associations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_mentions select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.brand_mentions FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brands select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.brands FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_occurrences select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.citation_occurrences FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_sources select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.citation_sources FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.citations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_analyses select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.competitive_analyses FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitors select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.competitors FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_finding_relationships select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.diagnostic_finding_relationships FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_findings select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.diagnostic_findings FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entities select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.entities FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entity_relationships select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.entity_relationships FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: historical_metrics select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.historical_metrics FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: keywords select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.keywords FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_invitations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.organization_invitations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_members select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.organization_members FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: pages select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.pages FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: position_observations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.position_observations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: premium_audits select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.premium_audits FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_definitions select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.prompt_definitions FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_executions select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.prompt_executions FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_schedules select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.prompt_schedules FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompts select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.prompts FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendation_observations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.recommendation_observations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendations select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.recommendations FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: technical_audits select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.technical_audits FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: topics select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.topics FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: visibility_scores select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.visibility_scores FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: websites select_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_organization_id_isolation_policy ON public.websites FOR SELECT USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: aeo_analyses select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.aeo_analyses FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_seo_findings select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.competitive_seo_findings FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitor_changes select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.competitor_changes FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: credit_transactions select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.credit_transactions FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: document_embeddings select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.document_embeddings FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: faq_opportunities select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.faq_opportunities FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_alignments select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.kg_alignments FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_entities select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.kg_entities FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_relationships select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.kg_relationships FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_quotas select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.tenant_quotas FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_subscriptions select_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY select_tenant_id_isolation_policy ON public.tenant_subscriptions FOR SELECT USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: technical_audits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.technical_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_quotas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant_quotas ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: topics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations update_org_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_org_isolation_policy ON public.organizations FOR UPDATE USING ((id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_observations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.ai_observations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: ai_visibility_audits update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.ai_visibility_audits FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: audit_prompts update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.audit_prompts FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_associations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.brand_associations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brand_mentions update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.brand_mentions FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: brands update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.brands FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_occurrences update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.citation_occurrences FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citation_sources update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.citation_sources FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: citations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.citations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_analyses update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.competitive_analyses FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitors update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.competitors FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_finding_relationships update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.diagnostic_finding_relationships FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: diagnostic_findings update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.diagnostic_findings FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entities update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.entities FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: entity_relationships update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.entity_relationships FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: historical_metrics update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.historical_metrics FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: keywords update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.keywords FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_invitations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.organization_invitations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: organization_members update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.organization_members FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: pages update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.pages FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: position_observations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.position_observations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: premium_audits update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.premium_audits FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_definitions update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.prompt_definitions FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_executions update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.prompt_executions FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompt_schedules update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.prompt_schedules FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: prompts update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.prompts FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendation_observations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.recommendation_observations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: recommendations update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.recommendations FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: technical_audits update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.technical_audits FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: topics update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.topics FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: visibility_scores update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.visibility_scores FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: websites update_organization_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_organization_id_isolation_policy ON public.websites FOR UPDATE USING ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((organization_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: aeo_analyses update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.aeo_analyses FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitive_seo_findings update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.competitive_seo_findings FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: competitor_changes update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.competitor_changes FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: credit_transactions update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.credit_transactions FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: document_embeddings update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.document_embeddings FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: faq_opportunities update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.faq_opportunities FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_alignments update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.kg_alignments FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_entities update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.kg_entities FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: kg_relationships update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.kg_relationships FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_quotas update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.tenant_quotas FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: tenant_subscriptions update_tenant_id_isolation_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_tenant_id_isolation_policy ON public.tenant_subscriptions FOR UPDATE USING ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid)) WITH CHECK ((tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid));


--
-- Name: visibility_scores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.visibility_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: websites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict tYnhP3tazdyZDPmfwkmolPHxKoFdwnumlK54xdrLKEOe70PPmiuKgcp8OyXZ351
