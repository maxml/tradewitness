import { relations } from "drizzle-orm/relations";
import { user, strategies, trades, feedbacks } from "./schema";

export const strategiesRelations = relations(strategies, ({one, many}) => ({
	user: one(user, {
		fields: [strategies.userId],
		references: [user.id]
	}),
	trades: many(trades),
}));

export const userRelations = relations(user, ({many}) => ({
	strategies: many(strategies),
	feedbacks: many(feedbacks),
}));

export const tradesRelations = relations(trades, ({one}) => ({
	strategy: one(strategies, {
		fields: [trades.strategyId],
		references: [strategies.id]
	}),
}));

export const feedbacksRelations = relations(feedbacks, ({one}) => ({
	user: one(user, {
		fields: [feedbacks.userId],
		references: [user.id]
	}),
}));