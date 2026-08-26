import { z } from "zod";
import { isValidCasCheckDigit, isValidCasFormat, normalizeCas } from "../pubchem/cas";

export const postCategorySchema = z.enum([
  "HAZARD",
  "IMPROVEMENT",
  "NEAR_MISS",
  "CHEMICAL",
  "PPE",
  "FACILITY",
  "PROCEDURE",
  "OTHER",
]);

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const postStatusSchema = z.enum(["RECEIVED", "REVIEWING", "ACTION", "DONE"]);

export const postCreateSchema = z.object({
  category: postCategorySchema,
  title: z
    .string()
    .trim()
    .min(2, "제목은 최소 2자 이상 입력해 주세요.")
    .max(100, "제목은 최대 100자까지 입력 가능합니다."),
  content: z
    .string()
    .trim()
    .min(5, "내용은 최소 5자 이상 상세히 입력해 주세요.")
    .max(5000, "내용은 최대 5000자까지 입력 가능합니다."),
  location: z
    .string()
    .trim()
    .max(100, "위치는 최대 100자까지 입력 가능합니다.")
    .optional()
    .nullable(),
  risk_level: riskLevelSchema.optional().nullable(),
});

export const postUpdateSchema = z.object({
  category: postCategorySchema.optional(),
  title: z
    .string()
    .trim()
    .min(2, "제목은 최소 2자 이상 입력해 주세요.")
    .max(100, "제목은 최대 100자까지 입력 가능합니다.")
    .optional(),
  content: z
    .string()
    .trim()
    .min(5, "내용은 최소 5자 이상 상세히 입력해 주세요.")
    .max(5000, "내용은 최대 5000자까지 입력 가능합니다.")
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, "위치는 최대 100자까지 입력 가능합니다.")
    .optional()
    .nullable(),
  risk_level: riskLevelSchema.optional().nullable(),
});

export const adminPostUpdateSchema = z.object({
  status: postStatusSchema.optional(),
  admin_response: z.string().trim().max(5000).optional().nullable(),
  is_hidden: z.boolean().optional(),
});

export const sdsCreateSchema = z.object({
  chemical_name: z.string().trim().min(1, "물질명을 입력해 주세요.").max(200),
  cas_number: z
    .string()
    .trim()
    .refine((val) => !val || isValidCasFormat(val), "CAS 형식이 올바르지 않습니다.")
    .refine((val) => !val || isValidCasCheckDigit(val), "CAS 체크 디지트가 일치하지 않습니다.")
    .optional()
    .nullable(),
  manufacturer: z.string().trim().max(100).optional().nullable(),
  product_number: z.string().trim().max(100).optional().nullable(),
  revision_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 여야 합니다.").optional().nullable(),
  language: z.string().default("ko").optional(),
  external_url: z.string().url("올바른 URL 형식이어야 합니다.").optional().nullable(),
  pubchem_cid: z.number().int().positive().optional().nullable(),
  verified_cas: z.boolean().default(false),
});
