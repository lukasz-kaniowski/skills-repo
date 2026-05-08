import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Greeting } from "@repo/types";

const GreetingSchema = z
  .object({
    message: z.string(),
    at: z.string().datetime(),
  })
  .openapi("Greeting");

const greetingRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: GreetingSchema } },
      description: "Health check greeting",
    },
  },
});

export function greetingRoutes(): OpenAPIHono {
  const app = new OpenAPIHono();

  app.openapi(greetingRoute, (c) => {
    const greeting: Greeting = {
      message: "hello from api",
      at: new Date().toISOString(),
    };
    return c.json(greeting);
  });

  return app;
}
