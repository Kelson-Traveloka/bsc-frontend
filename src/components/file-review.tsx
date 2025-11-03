"use client";
import { ChevronDown, ChevronRight, Download, RefreshCw } from "lucide-react";
import ExcelTablePreview from "./excel-review";
import { FileData } from "@/types/file-data";
import { convertFileInFrontend } from "@/services/convert-service";
import { useEffect, useRef, useState } from "react";
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

    const [convertedFileResult, setConvertedFileResult] = useState<{ url: string, summary: { totalRows: number, validTransactions: number, invalidTransactions: number } } | null>(null);
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [invalidFields, setInvalidFields] = useState<number[]>([]);
    const [activeField, setActiveField] = useState<number | null>(0);
    const [loading, setLoading] = useState(false);

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

            if (displaysValue) {
                mappedData[label] = info.value || "";
            } else if (info.col && info.row !== null) {
                mappedData[label] = `[${info.col}${Number(info.row)}]`;
            } else {
                mappedData[label] = "";
            }
        });

        try {
            console.log(mappedData)
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

        const newInfo = [...fieldInfo];

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
            } else {
                const { col, row } = safeParse(ref);
                newInfo[i].col = col;
                newInfo[i].row = row;
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
                            {isTransactionOpen ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
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
                                            value={(title == "Transactions" || label.toLowerCase().includes("date")) ? ("[" + fieldInfo[index].col + (fieldInfo[index].row !== null ? (Number(fieldInfo[index].row)) : "") + "]") : label === "Opening balance amount *"
                                                ? toFixedCurrencyNumber(fieldInfo[index].value)
                                                : fieldInfo[index].value}
                                            readOnly={title == "Transactions" || label.toLowerCase().includes("date")}
                                            onChange={(e) => {
                                                const newInfo = [...fieldInfo];
                                                let val = e.target.value;
                                                if (label.trim() === "Opening balance amount *") {
                                                    val = val.replace(/,/g, "");
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

            <ExcelTablePreview content={file.content} onCellClick={handleCellClick}
                activeLabel={activeField !== null ? (activeField < headerLabels.length ? headerLabels[activeField] : transactionLabels[activeField - headerLabels.length]) : ""}
            />

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                {!loading && convertedFileResult ? (
                    <div className="text-center relative">
                        <div className="absolute top-1 right-1" title="Convert Again" onClick={handleConvert}>
                            <RefreshCw className="group-hover:rotate-180 transition-all duration-300 w-5 h-5 mr-2 text-gray-300 hover:text-gray-500 cursor-pointer" />
                        </div>
                        <h3 className="text-lg font-semibold text-black mb-2">
                            Conversion Complete 🎉
                        </h3>
                        <p className="gray-700 mb-5">
                            Your file has been successfully converted and is ready for download.
                        </p>
                        <a
                            href={convertedFileResult.url}
                            download={`${file.name.replace(/\.\w+$/, "")}_converted.txt`}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Download Converted File
                        </a>
                        <div className="flex gap-5 justify-center items-center mt-6">
                            <label className="text-gray-700 text-sm border-r pr-5">Total Transaction: {convertedFileResult.summary.totalRows} Transaction(s)</label>
                            <label className="text-green-600 text-sm border-r pr-5">Valid Transaction: {convertedFileResult.summary.validTransactions} Transaction(s)</label>
                            <label className="text-red-600 text-sm pr-6">Invalid Transaction: {convertedFileResult.summary.invalidTransactions} Transaction(s)</label>
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
                                <RefreshCw className="group-hover:rotate-180 transition-all duration-300 w-5 h-5 mr-2" />
                                Convert File
                            </button>
                        )}
                    </div>

                )}
            </div>
        </div >
    );
}
