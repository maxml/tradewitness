"use client";

import { Strategy } from "@/types/strategies.types";
import { Rule } from "@/types/dbSchema.types";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";

const priorityColors = {
    high: "bg-sellWithOpacity text-sell",
    medium: "bg-yellow-400 text-yellow-600 bg-opacity-50",
    low: "bg-buyWithOpacity text-buy",
};

interface StrategyRulesProps {
    strategy: Strategy;
    checkedOpenRules: string[];
    checkedCloseRules: string[];
    onOpenRuleToggle: (ruleId: string, rule: Rule) => void;
    onCloseRuleToggle: (ruleId: string, rule: Rule) => void;
}

export const StrategyRules = ({
    strategy,
    checkedOpenRules,
    checkedCloseRules,
    onOpenRuleToggle,
    onCloseRuleToggle,
}: StrategyRulesProps) => {
    return (
        <div className="mb-6 space-y-4 py-8">
            {/* Open Position Rules */}
            {strategy.openPositionRules.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-semibold text-sm">
                        Open Position Rules
                    </h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Priority</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {strategy.openPositionRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="w-[5%]">
                                        <Checkbox
                                            checked={checkedOpenRules.includes(rule.id)}
                                            onCheckedChange={() => onOpenRuleToggle(rule.id, rule)}
                                        />
                                    </TableCell>
                                    <TableCell className="w-[70%]">
                                        {rule.rule}
                                    </TableCell>
                                    <TableCell className="w-[25%]">
                                        <div
                                            className={`${priorityColors[rule.priority]
                                                } px-3 p-1 rounded-lg w-fit flex-center`}>
                                            &bull; {rule.priority}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Close Position Rules */}
            {strategy.closePositionRules.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-semibold text-sm">
                        Close Position Rules
                    </h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Priority</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {strategy.closePositionRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="w-[5%]">
                                        <Checkbox
                                            checked={checkedCloseRules.includes(rule.id)}
                                            onCheckedChange={() => onCloseRuleToggle(rule.id, rule)}
                                        />
                                    </TableCell>
                                    <TableCell className="w-[70%]">
                                        {rule.rule}
                                    </TableCell>
                                    <TableCell className="w-[25%]">
                                        <div
                                            className={`${priorityColors[rule.priority]
                                                } px-3 p-1 rounded-lg w-fit flex-center`}>
                                            &bull; {rule.priority}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};