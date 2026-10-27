#!/usr/bin/env -S node
import {
  checkExpression,
  col,
  fn,
  lit,
  Migration,
  MigrationCLI,
  primaryKey,
  sql,
} from "@prisma/orm-postgres/migration";
import type { Contract as End } from "../../snapshots/4f33162d849c0def3458c643f64f551ea1b55c59e286accf88af77674252e3ee/contract";
import endContract from "../../snapshots/4f33162d849c0def3458c643f64f551ea1b55c59e286accf88af77674252e3ee/contract.json" with {
  type: "json",
};

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: "public" }),
      this.createTable({
        schema: "public",
        table: "business_members",
        columns: [
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("profile_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("role", "text", {
            notNull: true,
            default: lit("owner"),
            codecRef: { codecId: "pg/text@1" },
          }),
        ],
        constraints: [
          primaryKey(["business_id", "profile_id"]),
          checkExpression(
            "business_members_role_bfedbf8f",
            sql`role IN ('owner')`,
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "businesses",
        columns: [
          col("business_type", "text", {
            notNull: true,
            default: lit(""),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("currency_code", "character(3)", {
            notNull: true,
            default: lit("KES"),
            codecRef: { codecId: "sql/char@1", typeParams: { length: 3 } },
          }),
          col("id", "uuid", {
            notNull: true,
            default: fn(sql`gen_random_uuid()`),
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("market_location", "text", {
            notNull: true,
            default: lit(""),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("name", "text", {
            notNull: true,
            default: lit(""),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("timezone", "text", {
            notNull: true,
            default: lit("Africa/Nairobi"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updated_at", "timestamptz(3)", {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "customers",
        columns: [
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("created_by", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("is_favorite", "bool", {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: "pg/bool@1" },
          }),
          col("name", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("notes", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("phone", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("updated_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "items",
        columns: [
          col("allows_fractional", "bool", {
            notNull: true,
            codecRef: { codecId: "pg/bool@1" },
          }),
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("buying_price", "numeric(14,2)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 2 },
            },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("created_by", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("is_active", "bool", {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: "pg/bool@1" },
          }),
          col("kind", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("low_stock_threshold", "numeric(14,3)", {
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 3 },
            },
          }),
          col("name", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("selling_price", "numeric(14,2)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 2 },
            },
          }),
          col("unit", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updated_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "items_kind_ab433f46",
            sql`kind IN ('goods', 'service')`,
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "merchant_settings",
        columns: [
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("settings", "jsonb", {
            notNull: true,
            default: fn(sql`'{}'::jsonb`),
            codecRef: { codecId: "pg/jsonb@1" },
          }),
          col("updated_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
        ],
        constraints: [primaryKey(["business_id"])],
      }),
      this.createTable({
        schema: "public",
        table: "profiles",
        columns: [
          col("clerk_user_id", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("email", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("full_name", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("id", "uuid", {
            notNull: true,
            default: fn(sql`gen_random_uuid()`),
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("updated_at", "timestamptz(3)", {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "suppliers",
        columns: [
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("created_by", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("is_favorite", "bool", {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: "pg/bool@1" },
          }),
          col("name", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("notes", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("phone", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("updated_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "transaction_items",
        columns: [
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("description", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("item_id", "uuid", { codecRef: { codecId: "pg/uuid@1" } }),
          col("item_kind", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("quantity", "numeric(14,3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 3 },
            },
          }),
          col("transaction_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("unit", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("unit_cost", "numeric(14,2)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 2 },
            },
          }),
          col("unit_price", "numeric(14,2)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 2 },
            },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "transaction_items_item_kind_d1cd4566",
            sql`item_kind IS NULL OR item_kind IN ('goods', 'service')`,
          ),
          checkExpression(
            "transaction_items_quantity_46975249",
            sql`quantity <> 0`,
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "transactions",
        columns: [
          col("amount_paid", "numeric(14,2)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 2 },
            },
          }),
          col("business_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("created_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("created_by", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("customer_id", "uuid", { codecRef: { codecId: "pg/uuid@1" } }),
          col("description", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("due_date", "date", {
            codecRef: { codecId: "pg/date-string@1" },
          }),
          col("due_date_note", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("expense_category", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("external_reference", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("occurred_at", "timestamptz(3)", {
            notNull: true,
            codecRef: {
              codecId: "pg/timestamptz-string@1",
              typeParams: { precision: 3 },
            },
          }),
          col("overrides", "jsonb", {
            notNull: true,
            default: fn(sql`'[]'::jsonb`),
            codecRef: { codecId: "pg/jsonb@1" },
          }),
          col("payment_method", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("source", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("supplier_id", "uuid", { codecRef: { codecId: "pg/uuid@1" } }),
          col("total_amount", "numeric(14,2)", {
            notNull: true,
            codecRef: {
              codecId: "pg/numeric@1",
              typeParams: { precision: 14, scale: 2 },
            },
          }),
          col("type", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("voids_transaction_id", "uuid", {
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "transactions_amount_paid_30f696c9",
            sql`amount_paid >= 0`,
          ),
          checkExpression(
            "transactions_payment_method_85b9af5f",
            sql`payment_method IS NULL OR payment_method IN ('cash', 'mpesa', 'other')`,
          ),
          checkExpression(
            "transactions_source_bcc3bfae",
            sql`source IN ('manual', 'onboarding')`,
          ),
          checkExpression(
            "transactions_total_amount_b70a6922",
            sql`total_amount >= 0`,
          ),
          checkExpression(
            "transactions_type_330d8a19",
            sql`type IN ('sale', 'expense', 'customer_payment', 'opening_balance', 'stock_adjustment', 'void')`,
          ),
        ],
      }),
      this.addUnique({
        schema: "public",
        table: "business_members",
        constraint: "business_members_profile_id_key",
        columns: ["profile_id"],
      }),
      this.addUnique({
        schema: "public",
        table: "profiles",
        constraint: "profiles_clerk_user_id_key",
        columns: ["clerk_user_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "business_members",
        index: "business_members_business_id_idx_23036de8",
        columns: ["business_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "customers",
        index: "customers_business_id_idx_23036de8",
        columns: ["business_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "customers",
        index: "customers_business_id_updated_at_id_idx_825901f5",
        columns: ["business_id", "updated_at", "id"],
      }),
      this.createIndex({
        schema: "public",
        table: "items",
        index: "items_business_id_idx_23036de8",
        columns: ["business_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "items",
        index: "items_business_id_updated_at_id_idx_825901f5",
        columns: ["business_id", "updated_at", "id"],
      }),
      this.createIndex({
        schema: "public",
        table: "suppliers",
        index: "suppliers_business_id_idx_23036de8",
        columns: ["business_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "suppliers",
        index: "suppliers_business_id_updated_at_id_idx_825901f5",
        columns: ["business_id", "updated_at", "id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transaction_items",
        index: "transaction_items_business_id_created_at_id_idx_b6ec2575",
        columns: ["business_id", "created_at", "id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transaction_items",
        index: "transaction_items_business_id_idx_23036de8",
        columns: ["business_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transaction_items",
        index: "transaction_items_transaction_id_idx_d55c89e2",
        columns: ["transaction_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transactions",
        index: "transactions_business_id_created_at_id_idx_b6ec2575",
        columns: ["business_id", "created_at", "id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transactions",
        index: "transactions_business_id_idx_23036de8",
        columns: ["business_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transactions",
        index: "transactions_customer_id_idx_e16dfa6b",
        columns: ["customer_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "transactions",
        index: "transactions_supplier_id_idx_c2f51ce2",
        columns: ["supplier_id"],
      }),
      this.addForeignKey({
        schema: "public",
        table: "business_members",
        foreignKey: {
          name: "business_members_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "business_members",
        foreignKey: {
          name: "business_members_profile_id_fkey",
          columns: ["profile_id"],
          references: { schema: "public", table: "profiles", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "customers",
        foreignKey: {
          name: "customers_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "items",
        foreignKey: {
          name: "items_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "merchant_settings",
        foreignKey: {
          name: "merchant_settings_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "suppliers",
        foreignKey: {
          name: "suppliers_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "transaction_items",
        foreignKey: {
          name: "transaction_items_transaction_id_fkey",
          columns: ["transaction_id"],
          references: {
            schema: "public",
            table: "transactions",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "transaction_items",
        foreignKey: {
          name: "transaction_items_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "transactions",
        foreignKey: {
          name: "transactions_business_id_fkey",
          columns: ["business_id"],
          references: {
            schema: "public",
            table: "businesses",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "transactions",
        foreignKey: {
          name: "transactions_customer_id_fkey",
          columns: ["customer_id"],
          references: { schema: "public", table: "customers", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "transactions",
        foreignKey: {
          name: "transactions_supplier_id_fkey",
          columns: ["supplier_id"],
          references: { schema: "public", table: "suppliers", columns: ["id"] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
