"use client";
import { File } from "lucide-react";

interface ExcelTablePreviewProps {
    content: string[][];
}

export default function ExcelTablePreview({ content }: ExcelTablePreviewProps) {
    // Convert index number to Excel-style column letters (A, B, C... AA, AB...)
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
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                    <File className="w-5 h-5 mr-2 text-gray-300" />
                    File Preview
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-900">
                        <tr>
                            {/* Empty top-left corner cell */}
                            <th className="px-4 py-2 text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-900 border-r border-b border-gray-700"></th>
                            {content[0]?.map((_, index) => (
                                <th
                                    key={index}
                                    className="px-4 py-2 text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-700"
                                >
                                    {getColumnLabel(index)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {content.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-700">
                                {/* Row index */}
                                <td className="px-4 py-2 text-sm text-gray-400 text-center bg-gray-900 border-r border-gray-700 w-12">
                                    {rowIndex + 1}
                                </td>
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-200 border-r border-gray-700"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {content.length > 10 && (
                <div className="px-6 py-4 bg-gray-900 text-sm text-gray-400">
                    Showing first 10 rows of {content.length} total rows
                </div>
            )}
        </div>
    );
}
