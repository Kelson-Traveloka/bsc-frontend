"use client";
import { CheckCircle, ChevronDown, ChevronRight, Download } from "lucide-react";
import ExcelTablePreview from "./excel-review";
import { formatFileSize } from "@/utils/file-helper";
import { FileData } from "@/types/file-data";
import { convertFile } from "@/services/convert-service";
import { downloadBlob } from "@/utils/download-blob";
import { useEffect, useState } from "react";

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

    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [fieldInfo, setFieldInfo] = useState<
        { value: string; col: string | null; row: number | null }[]
    >(
        Array(headerLabels.length + transactionLabels.length).fill({
            value: "",
            col: "",
            row: null,
        })
    );

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

    const fmt = (field: { value: string, col: string | null, row: number | null }) => {
        if (!field?.col || field.col === "" || field.row == null)
            return ";";
        return `[${field.col}${Number(field.row) + 1}];`;
    };
    
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

    const [activeField, setActiveField] = useState<number | null>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeField !== null && activeField >= headerLabels.length) {
            setIsTransactionOpen(true);
        }
    }, [activeField]);

    const handleConvert = async () => {
        if (!file.file) return alert("No file available for conversion");
        setLoading(true);

        const allLabels = [...headerLabels, ...transactionLabels];
        const mappedData: Record<string, string | null> = {};

        allLabels.forEach((label, i) => {
            const info = fieldInfo[i];
            const displaysValue =
                !(label.toLowerCase().includes("date") || transactionLabels.includes(label));

            if (displaysValue) {
                mappedData[label] = info.value || "";
            } else if (info.col && info.row !== null) {
                mappedData[label] = `[${info.col}${Number(info.row) + 1}]`;
            } else {
                mappedData[label] = "";
            }
        });

        console.log("🧾 Collected field mapping (matched frontend display):", mappedData);

        try {
            const blob = await convertFile(file.file, mappedData);
            // downloadBlob(blob, "converted_output.txt");
        } catch (err) {
            console.error(err);
            alert("Failed to convert file");
        }
        setLoading(false);
    };

    const handleCellClick = (rowIndex: number, colLabel: string, cellValue: string) => {
        if (activeField === null) return;

        const newInfo = [...fieldInfo];
        newInfo[activeField] = { value: cellValue, row: rowIndex, col: colLabel };
        setFieldInfo(newInfo);

        if (activeField < fieldInfo.length) {
            setActiveField(activeField + 1);
        }
    };

    const renderFieldInputs = (
        labels: string[],
        startIndex: number,
        title: string
    ) => (
        <div className="w-full space-y-4">
            <div className="flex justify-end items-center w-full">
                <h3 className="font-semibold text-2xl text-gray-400">{title}</h3>
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
                                <label className="gray-700 text-sm mb-1">{label}</label>
                                <div className="relative flex justify-center items-center">
                                    <input
                                        type="text"
                                        // value={(title == "Transactions" || label.toLowerCase().includes("date")) ? ("[" + fieldInfo[index].col + (fieldInfo[index].row ? (Number(fieldInfo[index].row + 1)) : null) + "]") : fieldInfo[index].value}
                                        value={(title == "Transactions" || label.toLowerCase().includes("date")) ? ("[" + fieldInfo[index].col + (fieldInfo[index].row !== null ? (Number(fieldInfo[index].row) + 1) : "") + "]") : fieldInfo[index].value}
                                        readOnly={title == "Transactions" || label.toLowerCase().includes("date")}
                                        onChange={(e) => {
                                            const newInfo = [...fieldInfo];
                                            newInfo[index] = {
                                                ...newInfo[index],
                                                value: e.target.value,
                                            };
                                            setFieldInfo(newInfo);
                                        }}
                                        onFocus={() => setActiveField(index)}
                                        placeholder={`Click cell to fill ${label}`}
                                        className={`w-full px-4 py-2 rounded-sm border-b text-black focus:outline-none 
                                            ${activeField === index
                                                ? "border-gray-600"
                                                : "border-gray-300"
                                            }
                                            ${(title == "Transactions" || label.toLowerCase().includes("date")) && "cursor-pointer"}`}
                                    />
                                    <label className="absolute right-3 text-gray-500">
                                        {(i == 2 && title != "Transactions" &&
                                            fieldInfo[index].value !== "" &&
                                            fieldInfo[index].value !== null
                                            ? Number(fieldInfo[index].value) < 0
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
    );


    return (
        <div className="space-y-6">
            <div className="bg-transparent rounded-2xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 animate-pulse rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black">{file.name}</h3>
                            <p className="text-sm text-gray-600">
                                {formatFileSize(file.size)} •{" "}
                                {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-gray-500 hover:text-black hover:bg-gray-300/30 rounded-lg transition-colors"
                    >
                        Upload Different File
                    </button>
                </div>
            </div>

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
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Convert File
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
