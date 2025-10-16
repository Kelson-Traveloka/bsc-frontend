import * as XLSX from "xlsx";

function safeParseDate(value: any): Date | null {
  if (!value) return null;

  // --- 1️⃣ Excel numeric serials ---
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = value * 86400000;
    const date = new Date(excelEpoch.getTime() + millis);
    date.setUTCHours(12, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  const str = String(value).trim();
  if (!str) return null;

  // --- 2️⃣ dd/mm/yyyy or dd-mm-yyyy ---
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let [_, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    const date = new Date(Date.UTC(+y, +m - 1, +d, 12, 0, 0));
    return isNaN(date.getTime()) ? null : date;
  }

  // --- 3️⃣ yyyy-mm-dd or yyyy/mm/dd ---
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const [_, y, m, d] = ymd;
    const date = new Date(Date.UTC(+y, +m - 1, +d, 12, 0, 0));
    return isNaN(date.getTime()) ? null : date;
  }

  // --- 4️⃣ dd-MMM-yyyy or dd MMM yyyy (e.g. 29-Aug-2025 or 5 Sep 2025) ---
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

  // --- 5️⃣ ISO / fallback ---
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso;

  // ❌ Unknown
  return null;
}

/** Convert Excel cell ref (e.g., "A1" → [col, row]) */
function parseCellRef(ref: string): [number | null, number | null] {
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

/** Convert string to number safely */
function toNumber(value: any): number {
  if (value == null) return 0;
  const clean = String(value).replace(/,/g, "").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function fmtAmount(x: number): string {
  return Number.isInteger(x) ? `${x}` : x.toFixed(2);
}

export async function convertFileInFrontend(
  file: File,
  mapping: Record<string, any>
): Promise<void> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, {
    type: "array", cellDates: false,
    raw: true
  });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  let df = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  console.log("📚 Sheets detected:", wb.SheetNames);
  console.log("📊 Raw sheet data (first 5 rows):", df.slice(0, 100));
  const [, headerRow] = parseCellRef(mapping["Date [Header] *"]);
  if (headerRow == null) throw new Error("Invalid mapping: missing Date [Header] *");

  const headerValues = df[headerRow];
  df = df.slice(headerRow + 1);

  console.log("🔹 Header row index from mapping:", headerRow);
  console.log("🔹 Header row index from mapping:", headerValues);
  console.log("📄 Data rows count:", df.length);
  const rows = df.map((row) => {
    const obj: Record<string, any> = {};
    headerValues.forEach((key: any, i: number) => (obj[key] = row[i]));
    return obj;
  });

  console.log("📦 First 3 mapped rows:", rows);
  // === Build column map ===
  const colMap: Record<string, string> = {};
  for (const [label, ref] of Object.entries(mapping)) {
    if (!ref || typeof ref !== "string" || !/\[/.test(ref)) continue;
    const [colIdx] = parseCellRef(ref);
    if (colIdx != null && headerValues[colIdx]) colMap[label] = headerValues[colIdx];
  }

  console.log(colMap)
  console.log(headerValues)
  // === Rename columns ===
  const renamed = rows.map((r) => {
    const newRow: Record<string, any> = {};
    for (const [label, origCol] of Object.entries(colMap)) {
      newRow[label] = r[origCol];
    }
    return newRow;
  });

  // === Convert date + amount ===
  for (const r of renamed) {
    const parsed = safeParseDate(r["Date [Header] *"]);
    if (!parsed) continue; // skip invalid
    r["Transaction Date"] = parsed;
    for (const key of ["Debit Amount *", "Credit Amount *"]) {
      if (r[key] != null) r[key] = toNumber(r[key]);
    }
  }

  // === Static values ===
  const accountNumber = mapping["Account ID *"];
  const currency = mapping["Account Currency *"];
  const balance = mapping["Opening balance amount *"];
  const statementId = mapping["Statement ID *"];
  let openingBalance = toNumber(balance);

  // === Group by valid dates only ===
  const grouped: Record<string, any[]> = {};
  for (const row of renamed) {
    const d = row["Transaction Date"];
    if (!d || isNaN(d.getTime())) continue; // ✅ skip invalid date rows
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

  // === Download automatically ===
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
