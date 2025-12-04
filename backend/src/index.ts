import { env } from './config/env';
import app from './app';

const bootstrap = () => {
  const port = env.PORT;

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API server listening on http://localhost:${port}`);
  });
};

bootstrap();



