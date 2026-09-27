import { TableDefinition } from "../types";

export const brandAssociationsTable: TableDefinition = {
  tableName: "brand_associations",
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
      name: "brand_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "brands",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "entity_name",
      type: "TEXT",
      nullable: false
    },
    {
      name: "relationship_type",
      type: "TEXT",
      nullable: false
    },
    {
      name: "occurrence_count",
      type: "INTEGER",
      nullable: false,
      default: "1"
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
      name: "supporting_context",
      type: "TEXT",
      nullable: false
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

export const recommendationObservationsTable: TableDefinition = {
  tableName: "recommendation_observations",
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
      name: "brand_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "brands",
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
      nullable: false,
      references: {
        table: "ai_observations",
        column: "id",
        onDelete: "CASCADE"
      }
    },
    {
      name: "recommendation_status",
      type: "TEXT",
      nullable: false
    },
    {
      name: "position",
      type: "INTEGER",
      nullable: true
    },
    {
      name: "evidence_excerpt",
      type: "TEXT",
      nullable: false
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
