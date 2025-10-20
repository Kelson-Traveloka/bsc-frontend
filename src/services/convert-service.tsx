import { MappingGroupHT } from "@/types/mapping-information";
import { parseCell } from "@/utils/parse-cell";
import { safeParseDate } from "@/utils/parse-date";
import { toNumber } from "@/utils/to-number";
import * as XLSX from "xlsx";

export type MappingField = Record<string, string>;
export type ExcelRow = Record<string, string | number | Date | null | undefined>;
export type GroupHT = Record<string, MappingGroupHT[]>;
export type MappedTransactionRow = Partial<MappingGroupHT> & {
  "Transaction Date"?: Date;
};

function fmtAmount(x: number): string {
  return Number.isInteger(x) ? `${x}` : x.toFixed(2);
}

export async function convertFileInFrontend(
  file: File,
  mapping: MappingField
): Promise<void> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, {
    type: "array", cellDates: false,
    raw: true
  });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  let df: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const [, headerRow] = parseCell(mapping["Date [Header] *"]);
  if (headerRow == null) throw new Error("Invalid mapping: missing Date [Header] *");

  const headerValues = df[headerRow];
  df = df.slice(headerRow + 1);

  const rows: ExcelRow[] = df.map((row) => {
    const obj: ExcelRow = {};
    headerValues.forEach((key, i) => (obj[key] = row[i]));
    return obj;
  });

  const colMap: Record<string, string> = {};
  for (const [label, ref] of Object.entries(mapping)) {
    if (!ref || typeof ref !== "string" || !/\[/.test(ref)) continue;
    const [colIdx] = parseCell(ref);
    if (colIdx != null && headerValues[colIdx]) colMap[label] = headerValues[colIdx];
  }

  const renamed: Partial<MappedTransactionRow>[] = rows.map((r) => {
    const newRow: Partial<MappedTransactionRow> = {};

    (Object.entries(colMap) as [keyof MappedTransactionRow, string][]).forEach(([label, origCol]) => {
      const value = r[origCol];
      if (value !== undefined && value !== null) {
        (newRow as Record<keyof MappedTransactionRow, unknown>)[label] = value;
      }
    });

    return newRow;
  });

  for (const r of renamed) {
    const parsed = safeParseDate(r["Date [Header] *"]);
    if (!parsed) continue;
    r["Transaction Date"] = parsed;

    (["Debit Amount *", "Credit Amount *"] as const).forEach((key) => {
      const val = r[key];
      if (val != null) {
        r[key] = toNumber(val);
      }
    });
  }

  const accountNumber = mapping["Account ID *"];
  const currency = mapping["Account Currency *"];
  const balance = mapping["Opening balance amount *"];
  const statementId = mapping["Statement ID *"];
  let openingBalance = toNumber(balance);

  const grouped: Record<string, MappedTransactionRow[]> = {};
  for (const row of renamed) {
    const d = row["Transaction Date"];
    if (!d || isNaN(d.getTime())) continue;
    const dateKey = d.toISOString().slice(0, 10);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(row);
  }

  const outputLines: string[] = [];

  for (const dateKey of Object.keys(grouped).sort()) {
    const group = grouped[dateKey];
    const totalDebit = group.reduce((s, r) => s + (r["Debit Amount *"] || 0), 0);
    const totalCredit = group.reduce((s, r) => s + (r["Credit Amount *"] || 0), 0);
    const closingBalance = openingBalance + totalCredit - totalDebit;

    const openingDir = openingBalance < 0 ? "D" : "C";
    const closingDir = closingBalance < 0 ? "D" : "C";
    const openingStr = fmtAmount(Math.abs(openingBalance));
    const closingStr = fmtAmount(Math.abs(closingBalance));
    const dateStr = dateKey.replace(/-/g, "");

    outputLines.push(
      `1;${accountNumber};${dateStr};${openingDir};${openingStr};${dateStr};${closingDir};${closingStr};${currency};${statementId};`
    );

    for (const row of group) {
      const d = row["Transaction Date"];
      if (!d || isNaN(d.getTime())) continue;

      const tStr = d.toISOString().slice(0, 10).replace(/-/g, "");
      let direction = "";
      let amount = "";
      if (row["Debit Amount *"]) {
        direction = "D";
        amount = fmtAmount(Math.abs(row["Debit Amount *"]));
      } else if (row["Credit Amount *"]) {
        direction = "C";
        amount = fmtAmount(Math.abs(row["Credit Amount *"]));
      }

      const description = (row["Description"] || "").toString().replace(/;/g, ".");
      const reference = (row["Reference"] || "").toString();

      outputLines.push(
        `2;NTRF;;${tStr};${tStr};${direction};${amount};${currency};${description};${reference};;;`
      );
    }

    openingBalance = closingBalance;
  }

  const blob = new Blob([outputLines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name.replace(/\.\w+$/, "_converted.txt");
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
