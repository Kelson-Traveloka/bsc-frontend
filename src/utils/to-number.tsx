export const toNumber = (value: any): number => {
    if (value == null) return 0;
    const clean = String(value).replace(/,/g, "").trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

export const toFixedCurrencyNumber = (value: string | number): string => {
    if (value === "" || value === null) return "";

    const str = String(value);
    if (str.endsWith(".")) {
        const [intPart] = str.split(".");
        const formattedInt = Number(intPart).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        });
        return formattedInt + ".";
    }

    if (isNaN(Number(value))) return "";

    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });
};
