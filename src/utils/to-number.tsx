export const toNumber = (value: any): number => {
    if (value == null) return 0;
    const clean = String(value).replace(/,/g, "").trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}