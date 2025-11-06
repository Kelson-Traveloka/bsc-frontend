"use client"; 

export default function UploadArea({
    isDragging,
    isLoading,
    onFileInputChange,
    onDrop,
    onDragOver,
    onDragLeave,
}: {
    isDragging: boolean;
    isLoading: boolean;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
}) {

    const handleDivClick = () => {
        const input = document.getElementById("file-upload") as HTMLInputElement;
        if (input && !isLoading) input.click();
    };

    return (
        <div className={`rounded-2xl shadow-md border border-gray-200 p-4 transition-all duration-300 ${isDragging && "scale-105"}`}>
            <div
                className={`group border border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragging
                    ? "border-gray-600/70 bg-gradient-to-br from-white to-white via-gray-600/10"
                    : "border-gray-600/50 hover:border-gray-600/70 bg-gradient-to-br from-white via-white to-white hover:via-gray-600/10"
                    } ${isLoading ? "opacity-50" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={handleDivClick}
            >
                {isLoading ? (
                    <div className="animate-spin mx-auto w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full mb-4"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-upload-icon lucide-upload mx-auto w-16 h-16 text-gray-900 mb-4 overflow-visible">
                        <path d="M12 3v12"
                            className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:opacity-80" />
                        <path d="m17 8-5-5-5 5"
                            className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:opacity-80" />
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    </svg>
                )}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {isLoading ? "Processing file..." : "Drop your file here"}
                </h3>
                <p className="text-gray-600 mb-2">or click to browse your files</p>
                <p className="text-sm text-gray-500">
                    Supported formats: CSV, XLSX, XLS (Max 10MB)
                </p>
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={onFileInputChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                />
            </div>
        </div>
    );
}
