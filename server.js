// server.js
import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from '@remix-run/dev/server-build';

const app = express();

// handle asset requests
app.use(express.static('public', { maxAge: '1y' }));

// handle SSR requests
app.all(
  '*',
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
