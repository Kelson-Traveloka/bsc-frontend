"use client";
import ExcelTablePreview from "./excel-review";
import { FileData } from "@/types/file-data";
import { convertFileInFrontend } from "@/services/convert-service";
import { useEffect, useState } from "react";
import { BANKS } from "@/constants/bank";
import { parseCell } from "@/utils/parse-cell";
import { toFixedCurrencyNumber, toNumber } from "@/utils/to-number";
import FileHeader from "./file-preview/file-header";
import { getCellValue } from "@/utils/cell-value";
import BankTemplateList from "./file-preview/bank-template-list";

export default function FilePreview({
    file,
    onReset,
}: {
    file: FileData;
    onReset: () => void;
}) {
    const headerLabels = [
        "Account ID *",
        "Date [Header] *",
        "Opening balance amount *",
        "Account Currency *",
        "Statement ID *",
    ];

    const transactionLabels = [
        "Internal Bank Transaction Code",
        "Debit Amount *",
        "Credit Amount *",
        "Description",
        "Reference",
        "Transaction Original Amount",
        "Transaction Original Amount Currency",
    ];

    const [fieldInfo, setFieldInfo] = useState<
        { value: string; col: string | null; row: number | null }[]
    >(
        Array.from(
            { length: headerLabels.length + transactionLabels.length },
            () => ({ value: "", col: "", row: null })
        )
    );

    const fmt = (field: { value: string, col: string | null, row: number | null }) => {
        if (!field?.col || field.col === "" || field.row == null)
            return ";";
        return `[${field.col}${Number(field.row) + 1}];`;
    };

    const previewHeader =
        "1;" +
        fieldInfo[0].value + ";" + // Account Id
        "[" + fieldInfo[1]?.col + (fieldInfo[1].col !== "" ? Number(fieldInfo[1]?.row) + 1 : "") + "];" + // Date [Header]
        ((fieldInfo[2].value !== null && fieldInfo[2].value !== "") ? (Number(fieldInfo[2].value) < 0 ? "D" : "C") : "") + ";" + // Opening Balance Direction
        fieldInfo[2].value + ";" + // Opening Balance Amount 
        "[" + fieldInfo[1]?.col + (fieldInfo[1].col !== "" ? Number(fieldInfo[1]?.row) + 1 : "") + "];" + // Date [Header]
        "[Closing Direction];" +
        "[Closing Amount];" +
        fieldInfo[3].value + ";" + // Account Currency 
        fieldInfo[4].value + ";"; // Statement ID

    const previewTransaction =
        "2;NTRF;" +
        fmt(fieldInfo[5]) + // Internal Bank Transaction Code
        fmt(fieldInfo[1]) + // Date [Header]
        fmt(fieldInfo[1]) + // Date [Header] (again)
        fmt(fieldInfo[6]) + // Debit Amount
        fmt(fieldInfo[7]) + // Credit Amount
        fmt(fieldInfo[8]) + // Description
        fmt(fieldInfo[9]) + // Reference
        fmt(fieldInfo[10]) + // Transaction Original Amount
        fmt(fieldInfo[11]);  // Transaction Original Amount Currency

    const [convertedFileResult, setConvertedFileResult] = useState<{ url: string, summary: { totalRows: number, validTransactions: number, invalidTransactions: number[] } } | null>(null);
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [invalidFields, setInvalidFields] = useState<number[]>([]);
    const [activeField, setActiveField] = useState<number | null>(0);
    const [loading, setLoading] = useState(false);
    const [viewExcelType, setViewExcelType] = useState<"All" | "Invalid">("All")

    useEffect(() => {
        if (!file?.name) return;

        const fileBankCode = file.name.slice(0, 3).toUpperCase();
        const matchedBank = BANKS.find((bank) => bank.code.toUpperCase() === fileBankCode);
        if (matchedBank) {
            handleBankSelect(matchedBank);
        } else {
            setSelectedBank(null);
        }
    }, [file]);

    useEffect(() => {
        if (activeField !== null && activeField >= headerLabels.length) {
            setIsTransactionOpen(true);
        }
    }, [activeField]);

    useEffect(() => {
        setConvertedFileResult(null)
    }, [fieldInfo]);

    const cleanIdValue = (val: string) => val.replace(/[-,\s]/g, "");

    const handleConvert = async () => {
        if (!file.file) return alert("No file available for conversion");
        setLoading(true);

        const allLabels = [...headerLabels, ...transactionLabels];

        const emptyIndexes = allLabels
            .map((label, i) => ({ label, i }))
            .filter(({ label, i }) => label.includes("*") && ((!fieldInfo[i].value || String(fieldInfo[i].value).trim() === "") && (String(fieldInfo[i].col)?.trim() === "" || !fieldInfo[i].col)))
            .map(({ i }) => i);

        if (emptyIndexes.length > 0) {
            setInvalidFields(emptyIndexes);

            const firstInvalid = document.querySelector(`[data-field-index="${emptyIndexes[0]}"]`);
            if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });

            setLoading(false);
            return;
        }

        setInvalidFields([]);

        const mappedData: Record<string, string> = {};

        allLabels.forEach((label, i) => {
            const info = fieldInfo[i];
            const displaysValue =
                !(label.toLowerCase().includes("date") || transactionLabels.includes(label));

            if (label === "Description" && info.value.startsWith("concat(")) {
                mappedData[label] = info.value || "";
            } else if (displaysValue) {
                mappedData[label] = info.value || "";
            } else if (info.col && info.row !== null) {
                mappedData[label] = `[${info.col}${Number(info.row)}]`;
            } else {
                mappedData[label] = "";
            }
        });

        try {
            const result = await convertFileInFrontend(file.file, mappedData);
            setConvertedFileResult(result);
        } catch (err) {
            console.error(err);
            alert("Failed to convert file");
        }
        setLoading(false);
    };

    const handleCellClick = (rowIndex: number, colLabel: string, cellValue: string) => {
        if (activeField === null) return;

        const newInfo = [...fieldInfo];
        newInfo[activeField] = { value: String(cellValue).trim(), row: rowIndex, col: colLabel };
        setFieldInfo(newInfo);

        if (activeField < fieldInfo.length) {
            setActiveField(activeField + 1);
        }
    };

    const handleBankSelect = (bank: typeof BANKS[number]) => {
        setSelectedBank(bank.code);

        const newInfo: { value: string; col: string; row: number | null }[] = Array.from(
            { length: headerLabels.length + transactionLabels.length },
            () => ({ value: "", col: "", row: null })
        );

        const safeParse = (ref?: string | number | null) => {
            if (!ref) return { col: "", row: null };
            const { col, row } = parseCell(String(ref));
            return {
                col: col !== null ? String(col) : "",
                row: row ?? null,
            };
        };

        const safeGetValue = (ref?: string | number | null) => {
            if (!ref) return "";
            const { col, row } = parseCell(String(ref));
            if (col == null || row == null) return "";

            let value = getCellValue(String(col), row, file.content) ?? "";

            if (typeof value === "string") {
                value = value.replace(/^Account\s*Number\s*[:\-]?\s*/i, "").trim();
            }

            return value;
        };

        const fieldMap = [
            { key: "Account ID *", type: "value" },
            { key: "Date [Header] *", type: "colrow" },
            { key: "Opening balance amount *", type: "value" },
            { key: "Account Currency *", type: "value" },
            { key: "Statement ID *", type: "value" },
            { key: "Internal Bank Transaction Code", type: "colrow" },
            { key: "Debit Amount *", type: "colrow" },
            { key: "Credit Amount *", type: "colrow" },
            { key: "Description", type: "colrow" },
            { key: "Reference", type: "colrow" },
            { key: "Transaction Original Amount", type: "colrow" },
            { key: "Transaction Original Amount Currency", type: "colrow" },
        ] as const;


        fieldMap.forEach((f, i) => {
            const ref = bank.value[f.key];
            if (f.type === "value") {
                if (ref.startsWith("calc(") && ref.endsWith(")")) {
                    const formula = ref.slice(5, -1);
                    const matches = formula.match(/\[[A-Z]+\d+\]/gi) || [];
                    let expr = formula;
                    matches.forEach((cellRef) => {
                        const value = Number(toNumber(safeGetValue(cellRef)))
                        expr = expr.replace(cellRef, value.toString());
                    });
                    try {
                        const result = eval(expr);
                        newInfo[i].value = result.toString();
                    } catch (e) {
                        newInfo[i].value = "";
                    }
                }
                else if (ref.startsWith("[") && ref.endsWith("]")) newInfo[i].value = safeGetValue(ref);
                else newInfo[i].value = ref;

                if (f.key === "Account ID *" || f.key === "Statement ID *") {
                    newInfo[i].value = cleanIdValue(newInfo[i].value);
                }
            } else {
                if (ref.startsWith("concat(") && ref.endsWith(")")) {
                    newInfo[i].value = ref
                } else {
                    const { col, row } = safeParse(ref);
                    newInfo[i].col = col;
                    newInfo[i].row = row;
                }
            }
        });

        setIsTransactionOpen(true);
        setFieldInfo(newInfo);
    };

    const renderFieldInputs = (
        labels: string[],
        startIndex: number,
        title: string
    ) => {
        const isHeaderGroup = title === "Header";
        const isActiveInThisGroup = activeField !== null
            ? isHeaderGroup
                ? activeField < headerLabels.length
                : activeField >= headerLabels.length
            : false;

        return (
            <div className="w-full space-y-4 scroll-mt-20">
                <div className="flex justify-end items-center w-full">
                    <h3
                        className={`font-semibold text-2xl ${isActiveInThisGroup ? "text-gray-700" : "text-gray-400"}`}
                    >
                        {title}
                    </h3>
                    {title === "Transactions" && (
                        <button
                            onClick={() => setIsTransactionOpen(!isTransactionOpen)}
                            className="flex w-fit justify-between items-center my-3 p-3 pt-3.5 text-left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={`lucide lucide-chevron-down-icon lucide-chevron-down w-5 h-5 text-gray-400 hover:text-gray-700 transition-all duration-300 ease-in-out ${isTransactionOpen ? "" : "-rotate-90"}`}><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                    )}
                </div>

                {(title !== "Transactions" || isTransactionOpen) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {labels.map((label, i) => {
                            const index = startIndex + i;
                            return (
                                <div key={index} className="flex flex-col">
                                    <label className={`text-sm mb-1 ${invalidFields.includes(index) ? "text-red-600 font-semibold" : "text-gray-700"}`}>{label}</label>
                                    <div className="relative flex justify-center items-center">
                                        <input
                                            type="text"
                                            data-field-index={index}
                                            value={
                                                ((title == "Transactions" && !fieldInfo[index].value.startsWith("concat(")) || label.toLowerCase().includes("date")) ? ("[" + fieldInfo[index].col + (fieldInfo[index].row !== null ? (Number(fieldInfo[index].row)) : "") + "]")
                                                    : label === "Opening balance amount *" ? toFixedCurrencyNumber(fieldInfo[index].value)
                                                        : fieldInfo[index].value}
                                            readOnly={title == "Transactions" || label.toLowerCase().includes("date")}
                                            onChange={(e) => {
                                                const newInfo = [...fieldInfo];
                                                let val = e.target.value;
                                                if (label.trim() === "Opening balance amount *") {
                                                    val = val.replace(/,/g, "");
                                                }
                                                if (label.trim() === "Account ID *" || label.trim() === "Statement ID *") {
                                                    val = val.replace(/[,\-\s]/g, "");
                                                }
                                                newInfo[index] = {
                                                    ...newInfo[index],
                                                    value: val,
                                                };
                                                setFieldInfo(newInfo);
                                            }}
                                            onFocus={() => setActiveField(index)}
                                            placeholder={`Click cell to fill ${label}`}
                                            className={`w-full px-4 py-2 rounded-sm border-b text-black focus:outline-none 
                                             ${invalidFields.includes(index)
                                                    ? "border-red-500 focus:border-red-600"
                                                    : activeField === index
                                                        ? "border-gray-600"
                                                        : "border-gray-300"
                                                }
                                            ${(title == "Transactions" || label.toLowerCase().includes("date")) && "cursor-pointer"}`}
                                        />
                                        <label className="absolute right-3 text-gray-500">
                                            {(i == 2 && title != "Transactions" &&
                                                fieldInfo[index].value !== "" &&
                                                fieldInfo[index].value !== null
                                                ? toNumber(fieldInfo[index].value) < 0
                                                    ? "(D)"
                                                    : "(C)"
                                                : "")}
                                        </label>

                                        {(title === "Transactions" || label.toLowerCase().includes("date")) &&
                                            (fieldInfo[index].col || fieldInfo[index].row) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newInfo = [...fieldInfo];
                                                        newInfo[index] = { ...newInfo[index], col: "", row: null, value: "" };
                                                        setFieldInfo(newInfo);
                                                    }}
                                                    className="absolute right-2 text-gray-400 hover:text-gray-700 text-sm p-1"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="space-y-6">
            <FileHeader file={file} onReset={onReset} />
            <BankTemplateList handleBankSelect={handleBankSelect} selectedBank={selectedBank} />

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col justify-center items-center gap-4">
                {renderFieldInputs(headerLabels, 0, "Header")}
                <div className="flex flex-col col-span-2 relative mt-5 w-full">
                    <label className="gray-700 text-sm mb-1 absolute right-3 -top-3 bg-white text-gray-600 px-2">Preview Output Header</label>
                    <input
                        type="text"
                        value={previewHeader}
                        readOnly
                        disabled
                        className="px-4 py-2 rounded-md border text-gray-600 focus:outline-none border-gray-600/50"
                    />
                </div>
                <div className="border-t border-gray-200 space-y-4 w-full">
                    {renderFieldInputs(transactionLabels, headerLabels.length, "Transactions")}

                    {isTransactionOpen && (
                        <div className="flex flex-col col-span-2 relative mt-5">
                            <label className="gray-700 text-sm mb-1 absolute right-3 -top-3 bg-white text-gray-600 px-2">
                                Preview Output Transactions
                            </label>
                            <input
                                type="text"
                                value={previewTransaction}
                                readOnly
                                disabled
                                className="px-4 py-2 rounded-md border text-gray-600 focus:outline-none border-gray-600/50"
                            />
                        </div>
                    )}
                </div>
            </div>

            <ExcelTablePreview content={file.content} onCellClick={handleCellClick} viewExcelType={viewExcelType} invalidTransactions={convertedFileResult?.summary.invalidTransactions ?? null}
                activeLabel={activeField !== null ? (activeField < headerLabels.length ? headerLabels[activeField] : transactionLabels[activeField - headerLabels.length]) : ""}
            />

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                {!loading && convertedFileResult ? (
                    <div className="text-center relative">
                        <div className="absolute top-1 right-1 flex flex-col justify-center items-center gap-5" title="Convert Again" onClick={handleConvert}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-refresh-cw-icon lucide-refresh-cw group-hover:rotate-180 transition-all duration-300 w-5 h-5 mr-2 text-blue-300 hover:text-blue-500 cursor-pointer hover:rotate-180"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                        </div>
                        {viewExcelType === "All" ? (
                            <div className="absolute top-10 right-1 flex flex-col justify-center items-center gap-5" title="Show Invalid Transactions" onClick={() => {
                                if (convertedFileResult.summary.invalidTransactions.length > 0) {
                                    setViewExcelType("Invalid");
                                }
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-triangle-alert-icon lucide-triangle-alert hover:scale-101 group transition-all duration-300 w-5 h-5 mr-2 text-red-300 hover:text-red-500 cursor-pointer">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" className="group-hover:animate-pulse" />
                                    <path d="M12 9v4" />
                                    <path d="M12 17h.01" />
                                </svg>
                            </div>
                        ) : (
                            <div className="absolute top-10 right-1 flex flex-col justify-center items-center gap-5" title="Show All Transactions" onClick={() => setViewExcelType("All")}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-list-icon lucide-list group-hover:rotate-180 transition-all duration-300 w-5 h-5 mr-2 text-purple-300 hover:text-purple-500 cursor-pointer"><path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" /><path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" /></svg>
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-black mb-2">
                            Conversion Complete 🎉
                        </h3>
                        <p className="gray-700 mb-5">
                            Your file has been successfully converted and is ready for download.
                        </p>
                        <a
                            href={convertedFileResult.url}
                            download={`${file.name.replace(/\.\w+$/, "")}_converted.txt`}
                            className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-download-icon lucide-download w-5 h-5 mr-2">
                                <path d="M12 15V3"
                                    className="transition-transform duration-300 group-hover:translate-y-1 group-hover:opacity-80" />
                                <path d="m7 10 5 5 5-5"
                                    className="transition-transform duration-300 group-hover:translate-y-1 group-hover:opacity-80" />
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            </svg>
                            Download Converted File
                        </a>
                        <div className="flex gap-5 justify-center items-center mt-6">
                            <label className="text-purple-700 text-sm border-r pr-5">Total Transaction: {convertedFileResult.summary.totalRows} Transaction(s)</label>
                            <label className="text-green-600 text-sm border-r pr-5">Valid Transaction: {convertedFileResult.summary.validTransactions} Transaction(s)</label>
                            <label className="text-red-600 text-sm pr-6">Invalid Transaction: {convertedFileResult.summary.invalidTransactions.length} Transaction(s)</label>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-black mb-2">
                            Ready to Convert
                        </h3>
                        <p className="gray-700 mb-6">
                            Your file has been successfully uploaded and is ready for conversion.
                        </p>
                        {loading ? (
                            <div className="animate-spin mx-auto size-10 border-4 border-gray-500 border-t-transparent rounded-full mb-4"></div>

                        ) : (
                            <button
                                onClick={handleConvert}
                                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-refresh-cw-icon lucide-refresh-cw group-hover:rotate-180 transition-all duration-300 w-5 h-5 mr-2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                Convert File
                            </button>
                        )}
                    </div>

                )}
            </div>
        </div >
    );
}
