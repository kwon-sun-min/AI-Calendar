export const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

export const getEventsForDay = (date, events) => {
    if (!date) return [];
    return events.filter(event => {
        const eventDate = new Date(event.start);

        // FIX: Use local date string instead of ISO (UTC) to match excludedDates correctly
        // date is likely 00:00:00 local time from the calendar view loop
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const checkDateStr = `${year}-${month}-${day}`;

        // Check if date is excluded (specific dates)
        if (event.excludedDates && event.excludedDates.includes(checkDateStr)) {
            return false;
        }

        // Check if day of week is excluded (recurring pattern exception)
        // 0=Sun, 1=Mon, ..., 6=Sat
        if (event.excludedDays && event.excludedDays.includes(date.getDay())) {
            return false;
        }

        // Check recurrence end date
        if (event.recurrenceEnd) {
            const endDate = new Date(event.recurrenceEnd);
            // If current date is strictly after recurrence end date, don't show
            if (date > endDate && !isSameDay(date, endDate)) {
                return false;
            }
        }

        // Check for simple single day match
        if (isSameDay(eventDate, date)) return true;

        // Check for recurrence
        if (event.recurrence === 'custom' && event.recurrenceDays) {
            return date >= eventDate && event.recurrenceDays.includes(date.getDay());
        }
        if (event.recurrence === 'daily') {
            return date >= eventDate;
        }
        if (event.recurrence === 'weekday') {
            const day = date.getDay();
            return date >= eventDate && day !== 0 && day !== 6;
        }
        if (event.recurrence === 'weekend') {
            const day = date.getDay();
            return date >= eventDate && (day === 0 || day === 6);
        }
        if (event.recurrence === 'weekly') {
            return date >= eventDate && date.getDay() === eventDate.getDay();
        }
        if (event.recurrence === 'biweekly') {
            if (date < eventDate) return false;
            const diffTime = Math.abs(date - eventDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays % 14 === 0;
        }
        if (event.recurrence === 'monthly') {
            return date >= eventDate && date.getDate() === eventDate.getDate();
        }
        return false;
    }).sort((a, b) => new Date(a.start).getHours() - new Date(b.start).getHours());
};
