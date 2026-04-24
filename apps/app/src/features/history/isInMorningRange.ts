export function isInMorningRange(timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutes = h * 60 + m;

    const start = 8 * 60;
    const end = 21 * 60 + 59;

    return totalMinutes >= start && totalMinutes <= end;
}
