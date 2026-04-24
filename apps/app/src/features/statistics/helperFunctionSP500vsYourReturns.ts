import { Trades } from "@/types";

export function helperFunctionSP500vsYourReturns(
    trades: Trades[],
    capital: string | undefined
): [number[], string[], number[]] {
    if (trades.length === 0 || capital === undefined) {
        return [[], [], []];
    }
    const initialCapital = parseFloat(capital) || 0;

    const tradesWithDate = trades.filter((trade): trade is Trades & { closeDate: string } =>
        Boolean(trade.closeDate)
    ).map((t) => ({
        ...t,
        closeDt: new Date(t.closeDate),
    }));

    const earliestCloseDate = tradesWithDate.reduce((earliest, trade) => {
        return trade.closeDt < earliest ? trade.closeDt : earliest;
    }, tradesWithDate[0].closeDt);

    const today = new Date();

    const totalRangeMs = today.getTime() - earliestCloseDate.getTime();

    const boundaries: Date[] = [];
    for (let i = 1; i <= 6; i++) {
        const boundary = new Date(
            earliestCloseDate.getTime() + (totalRangeMs * i) / 6
        );
        boundaries.push(boundary);
    }

    const capitalChanges: number[] = [];
    const dateLabels: string[] = [];
    const sp500Alternative: number[] = [];

    const totalMonths =
        (today.getFullYear() - earliestCloseDate.getFullYear()) * 12 +
        today.getMonth() -
        earliestCloseDate.getMonth();

    boundaries.forEach((boundaryDate, i) => {
        let cumulativePnL = 0;
        tradesWithDate.forEach((t) => {
            if (t.closeDt <= boundaryDate) {
                const tradeResult = parseFloat(t.result || "0") || 0;
                cumulativePnL += tradeResult;
            }
        });

        const currentCapital = initialCapital + cumulativePnL;
        capitalChanges.push(currentCapital);

        if (totalMonths < 6) {
            dateLabels.push(i.toString());
        } else {
            const label = boundaryDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
            });

            dateLabels.push(label);
        }

        const msDiff = boundaryDate.getTime() - earliestCloseDate.getTime();
        const yearsDiff = msDiff / (365.25 * 24 * 3600 * 1000);
        const spValue = initialCapital * Math.pow(1 + 0.1, yearsDiff);
        sp500Alternative.push(Math.floor(spValue));
    });

    return [capitalChanges, dateLabels, sp500Alternative];
}
