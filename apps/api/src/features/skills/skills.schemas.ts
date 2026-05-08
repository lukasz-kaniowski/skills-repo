import { createRoute, z } from "@hono/zod-openapi";
import { NAME_RE, VERSION_RE } from "./skills.validation.js";

export const ErrorSchema = z
  .object({ error: z.string() })
  .openapi("Error");

export const SkillSummarySchema = z
  .object({
    name: z.string(),
    version: z.string(),
    uploadedAt: z.string().datetime(),
  })
  .openapi("SkillSummary");

const SkillManifestSchema = z
  .object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
  })
  .openapi("SkillManifest");

export const SkillDetailSchema = SkillSummarySchema.extend({
  manifest: SkillManifestSchema,
  files: z.array(z.string()),
}).openapi("SkillDetail");

const NameParam = z.string().regex(NAME_RE).openapi({ example: "my-skill" });
const VersionParam = z.string().regex(VERSION_RE).openapi({ example: "1.0.0" });

export const listSkillsRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(SkillSummarySchema) } },
      description: "List all skills",
    },
  },
});

export const uploadSkillRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            skill: z.any().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SkillSummarySchema } },
      description: "Skill uploaded successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Bad request",
    },
    409: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Conflict — skill already exists",
    },
    413: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Tarball exceeds 5MB limit",
    },
  },
});

export const getSkillRoute = createRoute({
  method: "get",
  path: "/{name}/{version}",
  request: {
    params: z.object({ name: NameParam, version: VersionParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SkillDetailSchema } },
      description: "Skill details",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Skill not found",
    },
  },
});
