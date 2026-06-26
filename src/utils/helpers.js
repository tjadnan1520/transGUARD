export const normalizeText = (text = "") => {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
};

export const extractAmount = (text = "") => {
    const match = text.match(/\d+(\.\d+)?/);

    if (!match) {
        return null;
    }

    return Number(match[0]);
};

export const containsKeyword = (text = "", keywords = []) => {
    const normalized = normalizeText(text);

    return keywords.some(keyword => {
        const normalizedKeyword = normalizeText(keyword);
        return normalizedKeyword && normalized.includes(normalizedKeyword);
    });
};

export const calculateTimeDifference = (date1, date2) => {
    return Math.abs(new Date(date1) - new Date(date2));
};

export const isSameRecipient = (a, b) => {
    return String(a).trim() === String(b).trim();
};
