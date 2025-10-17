export const safeParseDate = (value: any): Date | null => {
    if (!value) return null;

    if (typeof value === "number") {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const millis = value * 86400000;
        const date = new Date(excelEpoch.getTime() + millis);
        date.setUTCHours(12, 0, 0, 0);
        return isNaN(date.getTime()) ? null : date;
    }

    const str = String(value).trim();
    if (!str) return null;

    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmy) {
        let [_, d, m, y] = dmy;
        if (y.length === 2) y = `20${y}`;
        const date = new Date(Date.UTC(+y, +m - 1, +d, 12, 0, 0));
        return isNaN(date.getTime()) ? null : date;
    }

    const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymd) {
        const [_, y, m, d] = ymd;
        const date = new Date(Date.UTC(+y, +m - 1, +d, 12, 0, 0));
        return isNaN(date.getTime()) ? null : date;
    }

    const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    };

    const dmyText = str.match(/^(\d{1,2})[\s\-]([A-Za-z]+)[\s\-](\d{2,4})$/);
    if (dmyText) {
        let [_, d, mon, y] = dmyText;
        if (y.length === 2) y = `20${y}`;
        const mIdx = monthMap[mon.toLowerCase().slice(0, 3)];
        if (mIdx != null) {
            const date = new Date(Date.UTC(+y, mIdx, +d, 12, 0, 0));
            return isNaN(date.getTime()) ? null : date;
        }
    }

    const iso = new Date(str);
    if (!isNaN(iso.getTime())) return iso;

    return null;
}