import { format, formatDistance, formatRelative, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy HH:mm');
};

/**
 * Format time only
 */
export const formatTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Format date with smart formatting
 * - Today: "Today at 3:45 PM"
 * - Yesterday: "Yesterday at 3:45 PM"
 * - This week: "Monday at 3:45 PM"
 * - Older: "Jan 15, 2024"
 */
export const formatSmartDate = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (isToday(dateObj)) {
        return `Today at ${format(dateObj, 'h:mm a')}`;
    }

    if (isYesterday(dateObj)) {
        return `Yesterday at ${format(dateObj, 'h:mm a')}`;
    }

    const daysDiff = Math.floor((new Date() - dateObj) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
        return format(dateObj, 'EEEE \'at\' h:mm a');
    }

    return format(dateObj, 'MMM dd, yyyy');
};
