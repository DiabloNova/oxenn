import { TableDefinition } from "../types";

export const citationSourcesTable: TableDefinition = {
  tableName: "citation_sources",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true
    },
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "organizations",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "domain",
      type: "TEXT",
      nullable: false
    },
    {
      name: "canonical_url",
      type: "TEXT",
      nullable: true
    },
    {
      name: "classification",
      type: "TEXT",
      nullable: false
    },
    {
      name: "quality_score",
      type: "INTEGER",
      nullable: false
    },
    {
      name: "authority_score",
      type: "INTEGER",
      nullable: false
    },
    {
      name: "first_seen_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()"
    },
    {
      name: "last_seen_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()"
    },
    {
      name: "occurrence_count",
      type: "INTEGER",
      nullable: false,
      default: "0"
    },
    {
      name: "created_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()"
    },
    {
      name: "updated_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()"
    }
  ],
  sql: ""
};

export const citationOccurrencesTable: TableDefinition = {
  tableName: "citation_occurrences",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true
    },
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "organizations",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "source_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "citation_sources",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "audit_id",
      type: "UUID",
      nullable: true,
      references: {
        table: "ai_visibility_audits",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "execution_id",
      type: "UUID",
      nullable: true,
      references: {
        table: "prompt_executions",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "prompt_id",
      type: "UUID",
      nullable: true
    },
    {
      name: "observation_id",
      type: "UUID",
      nullable: true,
      references: {
        table: "ai_observations",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "url",
      type: "TEXT",
      nullable: false
    },
    {
      name: "title",
      type: "TEXT",
      nullable: true
    },
    {
      name: "snippet",
      type: "TEXT",
      nullable: true
    },
    {
      name: "position",
      type: "INTEGER",
      nullable: true
    },
    {
      name: "confidence",
      type: "DOUBLE PRECISION",
      nullable: false,
      default: "1.0"
    },
    {
      name: "created_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()"
    }
  ],
  sql: ""
};
