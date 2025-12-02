"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const prisma = globalThis.prisma ?? new client_1.PrismaClient();
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
//# sourceMappingURL=prisma.js.map