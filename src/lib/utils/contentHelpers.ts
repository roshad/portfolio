export const parseDate = (dateStr: string | number | Date): Date => {
    if (dateStr instanceof Date) return dateStr;

    if (typeof dateStr === 'string' || typeof dateStr === 'number') {
        const str = String(dateStr);
        // Handle YYMMDD format
        if (/^\d{6}$/.test(str)) {
            const year = parseInt("20" + str.substring(0, 2));
            const month = parseInt(str.substring(2, 4)) - 1; // Month is 0-indexed
            const day = parseInt(str.substring(4, 6));
            return new Date(year, month, day);
        }
    }

    return new Date(dateStr);
};

export const getPostDate = (data: any): Date => {
    if (data.date) return new Date(data.date);
    if (data["date created"]) return parseDate(data["date created"]);
    if (data["date modified"]) return parseDate(data["date modified"]);
    // Fallback to a default date or current date if absolutely nothing exists
    // For sorting, a very old date might be better if we want them at the end
    return new Date(0);
};

export const getPostTitle = (post: any): string => {
    if (post.data.title) return post.data.title;
    // Fallback to slug or id, removing extension
    return post.slug || post.id.replace(/\.[^/.]+$/, "");
};
