import { Router } from 'express';
import {
  createEventSchema,
  eventIdParamSchema,
  eventQuerySchema,
  recurrenceQuerySchema,
  updateEventSchema,
} from '../schemas/eventSchemas';
import * as eventService from '../services/eventService';
import * as recurrenceService from '../services/recurrenceService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters = eventQuerySchema.parse(req.query);
    const events = await eventService.listEvents(filters);
    res.json({ events });
  }),
);

router.get(
  '/recurrence',
  asyncHandler(async (req, res) => {
    const filters = recurrenceQuerySchema.parse(req.query);
    const occurrences = await recurrenceService.listOccurrences(filters);
    res.json({ occurrences });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = eventIdParamSchema.parse(req.params);
    const event = await eventService.getEventById(id);
    res.json({ event });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createEventSchema.parse(req.body);
    const event = await eventService.createEvent(payload);
    res.status(201).json({ event });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = eventIdParamSchema.parse(req.params);
    const payload = updateEventSchema.parse(req.body);
    const event = await eventService.updateEvent(id, payload);
    res.json({ event });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = eventIdParamSchema.parse(req.params);
    await eventService.deleteEvent(id);
    res.status(204).end();
  }),
);

export default router;

