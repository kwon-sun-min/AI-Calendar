"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMonthRange = void 0;
const buildMonthRange = (month) => {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
        throw new Error('Invalid month filter');
    }
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
    return { start, end };
};
exports.buildMonthRange = buildMonthRange;
//# sourceMappingURL=dateRange.js.map