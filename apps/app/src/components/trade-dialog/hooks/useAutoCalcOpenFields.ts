"use client";

import { useEffect, useRef } from "react";
import { FieldPath, FieldPathValue, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { newTradeFormSchema } from "@/zodSchema/schema";

type FormType = z.infer<typeof newTradeFormSchema>;

function toNum(value?: string): number | undefined {
    if (value == null) return undefined;
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
}

export function useAutoCalcOpenFields(form: UseFormReturn<FormType>) {
    const { watch, setValue } = form;

    const entryPrice = watch("entryPrice"); // string
    const quantity = watch("quantity"); // string
    const deposit = watch("deposit"); // string

    // Debounce timer reference
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // One-time assist flag: after first auto-fill, disable further assists
    const hasAssistedRef = useRef<boolean>(false);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        // If we already assisted once, do nothing further
        if (hasAssistedRef.current) {
            return;
        }

        debounceRef.current = setTimeout(() => {
            const e = toNum(entryPrice);
            const q = toNum(quantity);
            const d = toNum(deposit);

            // Helper to conditionally set a field only if empty and changed
            type NumericStringFields = "entryPrice" | "quantity" | "deposit";
            const setIfEmptyAndChanged = <K extends FieldPath<FormType> & NumericStringFields>(
                name: K,
                value: number,
                decimals: number
            ) => {
                const current = watch(name);
                if (current && current.trim() !== "") return; // user already entered something
                const next = value.toFixed(decimals);
                if (current !== next) {
                    setValue(name, next as FieldPathValue<FormType, K>, { shouldDirty: true, shouldValidate: true });
                    hasAssistedRef.current = true;
                }
            };

            // Compute missing third value when exactly two are present
            if (e != null && q != null && (deposit == null || deposit.trim() === "")) {
                setIfEmptyAndChanged("deposit", e * q, 2);
                return;
            }

            if (d != null && q != null && (entryPrice == null || entryPrice.trim() === "")) {
                if (q !== 0) setIfEmptyAndChanged("entryPrice", d / q, 2);
                return;
            }

            if (d != null && e != null && (quantity == null || quantity.trim() === "")) {
                if (e !== 0) setIfEmptyAndChanged("quantity", d / e, 6);
                return;
            }
        }, 1000);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [entryPrice, quantity, deposit, setValue, watch]);
}

export default useAutoCalcOpenFields;


