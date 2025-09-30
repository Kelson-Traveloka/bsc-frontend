export const convertFile = async (file: File): Promise<Blob> => {
    const formData = new FormData();
    formData.append("file", file);

    // const res = await fetch("http://127.0.0.1:8000/convert", {
    const res = await fetch("https://bsc-be-traveloka.vercel.app/convert", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Conversion failed");

    return await res.blob();
};
