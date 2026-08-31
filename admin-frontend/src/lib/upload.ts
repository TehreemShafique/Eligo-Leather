import { API_BASE, getAuthToken } from "./api"

/**
 * Upload a single file to the backend /files/upload endpoint.
 * Returns the public URL (R2 or local disk) of the uploaded file.
 *
 * @param file   The File object to upload.
 * @param folder Logical folder for R2 key organisation (blogs, products, reviews, general).
 * @param altText Optional alt text for the image.
 */
export async function uploadImage(
  file: File,
  folder: string = "general",
  altText?: string,
): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  if (altText) {
    formData.append("alt_text", altText)
  }

  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(
    `${API_BASE}/api/v1/files/upload?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      headers,
      body: formData,
    },
  )

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail || `Upload failed (${res.status})`)
  }

  const data = await res.json()
  return data.url as string
}

/**
 * Upload multiple files in parallel, returning an array of public URLs.
 * Failed uploads are skipped (returns empty string in their slot).
 */
export async function uploadImages(
  files: File[],
  folder: string = "general",
): Promise<string[]> {
  return Promise.all(
    files.map((file) =>
      uploadImage(file, folder, file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")).catch(
        () => "",
      ),
    ),
  )
}
