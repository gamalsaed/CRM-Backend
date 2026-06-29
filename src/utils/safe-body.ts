export function safeBodyFields<T>(body: T, fields: string[]) {
  const filteredBody: Record<string, unknown> = {};

  Object.keys(body as Record<string, unknown>).forEach((key) => {
    if (fields.includes(key)) {
      filteredBody[key] = body[key as keyof T];
    }
  });
  return filteredBody;
}
