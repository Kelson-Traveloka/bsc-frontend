export const parseCell = (
    ref: string,
    options?: { asIndex?: boolean }
): { col: string | number | null; row: number | null } => {
    if (!ref || typeof ref !== "string") return { col: null, row: null };

    const m = ref.trim().match(/\[?([A-Z]+)(\d+)\]?/i);
    if (!m) return { col: null, row: null };

    const [, colLetters, rowStr] = m;
    const row = rowStr ? parseInt(rowStr, 10) : null;

    if (options?.asIndex) {
        let colIndex = 0;
        for (let i = 0; i < colLetters.length; i++) {
            colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
        }
        return { col: colIndex - 1, row: row !== null ? row - 1 : null };
    }

    return { col: colLetters.toUpperCase(), row };
};
