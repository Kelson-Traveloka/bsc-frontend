const columnLetterToIndex = (col: string): number => {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
        index = index * 26 + (col.charCodeAt(i) - "A".charCodeAt(0) + 1);
    }
    return index - 1;
};

export const getCellValue = (
    col: string | null,
    row: number | null,
    content: string[][]
): string => {
    if (!col || row === null) return "";
    const colIndex = columnLetterToIndex(col);
    const rowIndex = row - 1;
    if (rowIndex < 0 || rowIndex >= content.length) return "";
    if (colIndex < 0 || colIndex >= content[rowIndex].length) return "";
    return content[rowIndex][colIndex] ?? "";
};