import { Rule, CloseEvent } from "@/types/dbSchema.types";
import { relations } from "drizzle-orm";
import {
    boolean,
    doublePrecision,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

/** One detected PII entity — spans + type + score only, NEVER the matched text. */
export type DetectedPiiSpan = {
    type: string;
    start: number;
    end: number;
    score: number;
};

export const UserTable = pgTable("user", {
    id: text("id").notNull().unique(),
    name: text("name").notNull().default(""),
    email: text("email").notNull().default(""),
    capital: text("capital"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    tokens: integer("tokens").default(5),
    onboardingCompleted: boolean("onboarding_completed")
        .notNull()
        .default(false),
    openCustomFieldNames: jsonb("open_custom_field_names").$type<string[]>().default([]),
    closeCustomFieldNames: jsonb("close_custom_field_names").$type<string[]>().default([]),
});

export const TradeTable = pgTable(
    "trades",
    {
        id: text("id").primaryKey().notNull(),
        userId: text("userId").notNull().references(() => UserTable.id),
        positionType: text("positionType").notNull(),
        openDate: text("openDate").notNull(),
        openTime: text("openTime").notNull(),
        closeDate: text("closeDate"),
        closeTime: text("closeTime"),
        isActiveTrade: boolean("isActiveTrade").default(true).notNull(),
        instrumentName: text("instrumentName"),
        symbolName: text("symbolName").notNull(),
        entryPrice: text("entryPrice"),
        deposit: text("deposit"),
        result: text("result"),
        totalCost: text("totalCost"),
        quantity: text("quantity"),
        sellPrice: text("sellPrice"),
        quantitySold: text("quantitySold"),
        notes: text("notes"),
        rating: integer("rating").default(0),
        strategyId: uuid("strategy_id").references(() => StrategyTable.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        appliedOpenRules: jsonb("applied_open_rules").$type<Rule[]>(),
        appliedCloseRules: jsonb("applied_close_rules").$type<Rule[]>(),
        closeEvents: jsonb("close_events").$type<CloseEvent[]>(),
        openOtherDetails: jsonb("open_other_details").$type<Record<string, string>>(),
        closeOtherDetails: jsonb("close_other_details").$type<Record<string, string>>(),
    },
    (table) => ({
        userIdCloseDateIndex: index("userIdCloseDateIndex").on(
            table.userId,
            table.closeDate
        ),
        tradeStrategyIdIndex: index("trade_strategy_id_idx").on(
            table.strategyId
        ),
    })
);

export const StrategyTable = pgTable(
    "strategies",
    {
        id: uuid("id").primaryKey().notNull(),
        userId: text("userId")
            .notNull()
            .references(() => UserTable.id),
        strategyName: text("strategyName").notNull(),
        description: text("description"),
        openPositionRules: jsonb("open_position_rules").$type<Rule[]>().default([]).notNull(),
        closePositionRules: jsonb("close_position_rules").$type<Rule[]>().default([]).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    },
    (table) => ({
        userIdIndex: index("strategy_user_id_idx").on(table.userId),
    })
);

export const StrategyRelations = relations(StrategyTable, ({ many }) => ({
    trades: many(TradeTable),
}));

export const TradeRelations = relations(TradeTable, ({ one }) => ({
    strategy: one(StrategyTable, {
        fields: [TradeTable.strategyId],
        references: [StrategyTable.id],
    }),
}));

export const ReportsTable = pgTable("reports", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    reportData: jsonb("report_data").notNull(),
    isFavorite: boolean("is_favorite").default(false).notNull(),
});

export const TransactionsTable = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    plan: text("plan").notNull(),
});

// New table for user-submitted feedback from the FeedbackCard
export const FeedbackTable = pgTable("feedbacks", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => UserTable.id),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const JournalTable = pgTable(
    "journal",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => UserTable.id),
        date: text("date").notNull(), // Stored as YYYY-MM-DD
        content: jsonb("content"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        userIdDateIndex: index("journal_user_id_date_idx").on(
            table.userId,
            table.date
        ),
    })
);

// M7 — AI assistant chat logs (row-per-turn). See homework/M7/PLAN.md §4.5.
// Privacy: raw user_message/assistant_response are server/local-flow only;
// the admin dashboard reads ONLY the redacted_* columns (AdminChatLogRow).
export const ChatLogsTable = pgTable(
    "chat_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        conversationId: uuid("conversation_id").notNull(),
        // Stable ordering within a conversation even when createdAt collides.
        turnIndex: integer("turn_index").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => UserTable.id),
        // "private" | "public" — server-trusted; cloud context is built only from public turns.
        sensitivity: text("sensitivity").notNull().default("private"),
        userMessage: text("user_message").notNull(),
        redactedUserMessage: text("redacted_user_message"),
        assistantResponse: text("assistant_response"),
        redactedAssistantResponse: text("redacted_assistant_response"),
        // Spans only (type/start/end/score) — never the matched values.
        detectedPii: jsonb("detected_pii").$type<DetectedPiiSpan[]>().default([]),
        // "ok" | "unavailable" | "fallback" — kept separate so a partial failure can't hide.
        userRedactionStatus: text("user_redaction_status"),
        assistantRedactionStatus: text("assistant_redaction_status"),
        // "pending" | "ok" | "failed" | "timeout" | "tool_error" — reserved-row lifecycle.
        status: text("status").notNull().default("pending"),
        errorCode: text("error_code"),
        errorMessageRedacted: text("error_message_redacted"),
        route: text("route"), // "local" | "cloud"
        mode: text("mode"),
        model: text("model"),
        latencyMs: integer("latency_ms"),
        costUsd: doublePrecision("cost_usd"),
        costReason: text("cost_reason"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        // Guards against two parallel sends racing on the same turn slot.
        convTurnUnique: unique("chat_logs_conversation_turn_unique").on(
            table.conversationId,
            table.turnIndex
        ),
        userConvIndex: index("chat_logs_user_conversation_idx").on(
            table.userId,
            table.conversationId
        ),
        createdAtIndex: index("chat_logs_created_at_idx").on(table.createdAt),
    })
);

export const projectsTable = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    techStack: text("tech_stack").array().default([]),
    category: text("category").default('web-dev'),
    githubUrl: text("github_url"),
    demoUrl: text("demo_url"),
    imageUrl: text("image_url"),
    featured: boolean("featured").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    categoryIdx: index("idx_projects_category").on(table.category),
    featuredIdx: index("idx_projects_featured").on(table.featured),
}));

export const blogPostsTable = pgTable("blog_posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    category: text("category").default('tech-ai'),
    published: boolean("published").default(false),
    views: integer("views").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    slugIdx: index("idx_blog_posts_slug").on(table.slug),
    categoryIdx: index("idx_blog_posts_category").on(table.category),
}));

export const contactSubmissionsTable = pgTable("contact_submissions", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
