"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventSchemas_1 = require("../schemas/eventSchemas");
const eventService = __importStar(require("../services/eventService"));
const recurrenceService = __importStar(require("../services/recurrenceService"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filters = eventSchemas_1.eventQuerySchema.parse(req.query);
    const events = await eventService.listEvents(filters);
    res.json({ events });
}));
router.get('/recurrence', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filters = eventSchemas_1.recurrenceQuerySchema.parse(req.query);
    const occurrences = await recurrenceService.listOccurrences(filters);
    res.json({ occurrences });
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = eventSchemas_1.eventIdParamSchema.parse(req.params);
    const event = await eventService.getEventById(id);
    res.json({ event });
}));
router.post('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = eventSchemas_1.createEventSchema.parse(req.body);
    const event = await eventService.createEvent(payload);
    res.status(201).json({ event });
}));
router.put('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = eventSchemas_1.eventIdParamSchema.parse(req.params);
    const payload = eventSchemas_1.updateEventSchema.parse(req.body);
    const event = await eventService.updateEvent(id, payload);
    res.json({ event });
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = eventSchemas_1.eventIdParamSchema.parse(req.params);
    await eventService.deleteEvent(id);
    res.status(204).end();
}));
exports.default = router;
//# sourceMappingURL=events.js.map