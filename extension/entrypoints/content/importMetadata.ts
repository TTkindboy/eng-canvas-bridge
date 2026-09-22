async function canvasMetadata(path: string): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${window.location.origin}/api/v1${path}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

export async function getImportMetadata(): Promise<Record<string, string>> {
  const courseId = window.location.pathname.match(/\/courses\/(\d+)/)?.[1];
  const fileId = window.location.pathname.match(/\/files\/(\d+)/)?.[1];
  const [user, course, file] = await Promise.all([
    canvasMetadata('/users/self/profile'),
    courseId ? canvasMetadata(`/courses/${courseId}`) : Promise.resolve<Record<string, unknown>>({}),
    fileId ? canvasMetadata(`/files/${fileId}`) : Promise.resolve<Record<string, unknown>>({}),
  ]);
  const values = {
    user_id: user.id,
    user_name: user.name,
    course_id: courseId,
    course_name: course.name,
    file_id: fileId,
    filename: file.display_name ?? file.filename,
  };
  return Object.fromEntries(Object.entries(values)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .map(([key, value]) => [key, String(value).slice(0, 256)]));
}
