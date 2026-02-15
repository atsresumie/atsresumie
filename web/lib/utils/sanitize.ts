/**
 * Sanitize a filename for safe use in storage object paths.
 * - Removes unsafe characters
 * - Trims whitespace
 * - Truncates to max length (default 120 chars)
 */
export function sanitizeFilename(
  filename: string,
  maxLength: number = 120
): string {
  // Get the extension if present
  const lastDot = filename.lastIndexOf(".");
  const hasExtension = lastDot > 0;
  const extension = hasExtension ? filename.slice(lastDot) : "";
  const basename = hasExtension ? filename.slice(0, lastDot) : filename;

  // Remove unsafe characters: keep only alphanumeric, hyphen, underscore, space, dot
  const sanitizedBasename = basename
    .replace(/[^a-zA-Z0-9\-_\s.]/g, "")
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim();

  // Truncate basename to ensure total length (including extension) fits within maxLength
  const maxBasenameLength = maxLength - extension.length;
  const truncatedBasename = sanitizedBasename.slice(0, maxBasenameLength);

  return truncatedBasename + extension;
}
