export const parseCell = (ref: string): [number | null, number | null] => {
    if (!ref || typeof ref !== "string") return [null, null];
    const m = ref.trim().match(/\[?([A-Z]+)(\d+)\]?/);
    if (!m) return [null, null];
    const [, colLetters, rowStr] = m;
    let colIndex = 0;
    for (let i = 0; i < colLetters.length; i++) {
        colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
    }
    return [colIndex - 1, parseInt(rowStr, 10) - 1];
}