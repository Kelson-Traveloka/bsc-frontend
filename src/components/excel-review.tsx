"use client";
import { File } from "lucide-react";

interface ExcelTablePreviewProps {
    content: string[][];
}

export default function ExcelTablePreview({ content }: ExcelTablePreviewProps) {
    const maxCols = Math.max(...content.map(row => row.length));
    const normalizedContent = content.map(row => {
        const newRow = [...row];
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
    });

    const getColumnLabel = (index: number): string => {
        let label = "";
        let n = index;
        while (n >= 0) {
            label = String.fromCharCode((n % 26) + 65) + label;
            n = Math.floor(n / 26) - 1;
        }
        return label;
    };

    return (
        <div className="relative bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-auto max-h-[600px]">
            <table className="w-full border-collapse table-auto">
                <thead className="bg-gray-900 sticky top-0 z-10">
                    <tr>
                        {/* Top-left corner */}
                        <th className="px-4 py-2 text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-900 border-r border-b border-gray-700 sticky left-0 z-20"></th>
                        {Array.from({ length: maxCols }).map((_, index) => (
                            <th
                                key={index}
                                className="px-4 py-2 text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-700 text-center"
                            >
                                {getColumnLabel(index)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {normalizedContent.slice(0, 100).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {/* Row index column (sticky) */}
                            <td className="px-4 py-2 text-sm text-gray-400 text-center bg-gray-900 border-r border-gray-700 w-12 sticky left-0 z-10">
                                {rowIndex + 1}
                            </td>
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-200 border-r border-gray-700 hover:bg-gray-700 transition-colors"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {content.length > 100 && (
                <div className="px-6 py-4 bg-gray-900 text-sm text-gray-400">
                    Showing first 100 rows of {content.length} total rows
                </div>
            )}
        </div>
    );
}
