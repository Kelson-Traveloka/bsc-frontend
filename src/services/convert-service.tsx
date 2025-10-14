export const convertFile = async (
  file: File,
  mapping: Record<string, any>
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapping", JSON.stringify(mapping));

  try {
    const res = await fetch("http://127.0.0.1:8000/convert", {
      method: "POST",
      body: formData,
    });
 
    if (!res.ok) { 
      let errorMsg = "";
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || JSON.stringify(errorData);
      } catch {
        errorMsg = await res.text();
      }

      throw new Error(`Convert failed (${res.status}): ${errorMsg}`);
    }
 
    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition");
    let filename = "converted_file.txt";
    if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/['"]/g, "");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    return { downloaded: true, filename };

  } catch (error) {
    console.error("❌ Error during file conversion:", error);
    throw error;
  }
};



// const res = await fetch("https://bsc-be-traveloka.vercel.app/convert", {