import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';
import chatRouter from './routes/chat';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: '*',
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/events', eventsRouter);
app.use('/chat', chatRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

