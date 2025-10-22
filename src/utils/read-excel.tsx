import * as XLSX from "xlsx";

export function extractSheetWithTrueRange(sheet: XLSX.WorkSheet) {
    const cellAddrs = Object.keys(sheet).filter(k => !k.startsWith("!"));
    if (cellAddrs.length === 0) return [];

    let minRow = Infinity,
        maxRow = -Infinity,
        minCol = Infinity,
        maxCol = -Infinity;

    for (const addr of cellAddrs) {
        const { c, r } = XLSX.utils.decode_cell(addr);
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
    }

    const range = { s: { c: minCol, r: minRow }, e: { c: maxCol, r: maxRow } };

    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        range,
        blankrows: true,
        defval: "",
        raw: true,
    }) as string[][];

    return rows;
}

export async function readExcelFile(file: File): Promise<string[][]> {
    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
        const buffer = await file.arrayBuffer();

        let text = new TextDecoder("utf-8").decode(buffer);
        if (/[�]/.test(text) || /[A-Za-z]/.test(text) && !/[ก-๙]/.test(text)) {
            try {
                text = new TextDecoder("windows-874").decode(buffer);
                console.warn("🔄 Fallback: decoded as CP874 (Thai)");
            } catch (e) {
                console.error("⚠️ windows-874 not supported, please re-save as UTF-8");
            }
        }

        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        const content = lines.map((line) => {
            const result: string[] = [];
            let current = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === "," && !inQuotes) {
                    result.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        });

        return content;
    }


    const data = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;

    try {
        workbook = XLSX.read(data, {
            type: "array",
            cellDates: false,
            raw: true,
        });
    } catch (err) {
        console.error("⚠️ Failed to parse as ArrayBuffer, retrying as binary string...");
        const binary = await file.text();
        workbook = XLSX.read(binary, {
            type: "binary",
            cellDates: false,
            raw: true,
        });
    }

    let validSheet: string[][] = [];

    for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet) continue;

        const rows = extractSheetWithTrueRange(sheet);

        if (rows.length > 1) {
            validSheet = rows;
            break;
        } else {
            console.warn(`⚠️ "${name}" skipped — only ${rows.length} row(s)`);
        }
    }

    if (validSheet.length === 0) {
        console.warn("⚠️ No valid sheets found, returning empty array.");
    }

    return validSheet;
}
