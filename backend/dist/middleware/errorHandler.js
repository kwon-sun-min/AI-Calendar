"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const zod_1 = require("zod");
const httpError_1 = require("../lib/httpError");
const notFoundHandler = (_req, res, _next) => {
    res.status(404).json({ message: 'Route not found' });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: 'Validation failed',
            issues: err.flatten(),
        });
    }
    if (err instanceof httpError_1.HttpError) {
        return res.status(err.status).json({ message: err.message });
    }
    // eslint-disable-next-line no-console
    console.error('Unexpected error', err);
    return res.status(500).json({ message: 'Internal server error' });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map