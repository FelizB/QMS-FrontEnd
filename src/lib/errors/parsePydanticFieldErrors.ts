// src/lib/errors/parsePydanticFieldErrors.ts

type PydanticIssue = {
  loc?: (string | number)[];
  msg?: string;
  message?: string;
  type?: string;
};

/**
 * Converts FastAPI/Pydantic 422 validation errors:
 *
 * detail: [
 *   { loc: ["body", "email"], msg: "Invalid email", type: "value_error" }
 * ]
 *
 * Into:
 * {
 *   email: "Invalid email"
 * }
 */
export function parsePydanticFieldErrors(detail: unknown): Record<string, string> {
  const errs: Record<string, string> = {};

  if (!Array.isArray(detail)) return errs;

  for (const raw of detail as PydanticIssue[]) {
    const loc = Array.isArray(raw?.loc) ? raw.loc.map(String) : [];
    const field = loc[loc.length - 1]; // last token = field name
    const msg = raw?.msg || raw?.message || 'Invalid value';

    if (!field) continue;

    // Only store the first error per field
    if (!errs[field]) errs[field] = msg;
  }

  return errs;
}