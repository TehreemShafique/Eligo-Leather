"use client"

import { useState, type FormEvent, useRef, type ChangeEvent } from "react"
import { Star, X, ImageSquare, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { submitReview, uploadReviewPhotos } from "@/modules/reviews/api"
import { getApiErrorMessage } from "@/lib/api-client"
import { resolveApiMediaUrl } from "@/lib/utils"

const INITIAL_REVIEW = {
  name: "",
  title: "",
  content: "",
  rating: 5,
}

const MAX_PHOTOS = 6

export function WriteReviewButton({
  productId,
}: {
  productId?: string | number | null
} = {}) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [newReview, setNewReview] = useState(INITIAL_REVIEW)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos.`)
      event.target.value = ""
      return
    }

    setUploadingPhotos(true)
    try {
      const urls = await uploadReviewPhotos(files)
      if (urls.length === 0) {
        toast.error("No valid images were uploaded.")
      } else {
        setPhotos((prev) => [...prev, ...urls].slice(0, MAX_PHOTOS))
        toast.success(`${urls.length} photo${urls.length === 1 ? "" : "s"} uploaded.`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setUploadingPhotos(false)
      if (fileInputRef.current) event.target.value = ""
    }
  }

  const handleRemovePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url))
  }

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting || uploadingPhotos) return

    setSubmitting(true)
    try {
      // Stored as a pending review; visible on the storefront only after an
      // admin approves it in Settings -> Apps -> Supabase Reviews.
      await submitReview({
        productId,
        name: newReview.name,
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        images: photos,
      })
      toast.success(
        "Thank you for your review! It will be posted after verification.",
      )
      setReviewModalOpen(false)
      setNewReview(INITIAL_REVIEW)
      setPhotos([])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setReviewModalOpen(true)}
        className="inline-flex items-center justify-center self-start rounded-[5px] bg-amber-800 px-7 py-2.5 text-sm font-semibold leading-5 text-white transition-colors hover:bg-amber-900 sm:self-auto lg:absolute lg:left-[85.677083cqw] lg:top-[6.25cqw] lg:h-[2.083333cqw] lg:w-[8.333333cqw] lg:rounded-[0.260417cqw] lg:px-[1.458333cqw] lg:py-[0.520833cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
      >
        Write a review
      </button>

      {reviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="write-review-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 text-left shadow-2xl sm:p-8">
            <button
              type="button"
              aria-label="Close review form"
              onClick={() => setReviewModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-gray-500 hover:text-black"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 id="write-review-title" className="mb-2 text-2xl font-bold text-black">
              Write a Review
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Share your experience with Eligo Leather products.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label
                  htmlFor="reviewer-name"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Your Name
                </label>
                <input
                  id="reviewer-name"
                  type="text"
                  required
                  value={newReview.name}
                  onChange={(event) =>
                    setNewReview({ ...newReview, name: event.target.value })
                  }
                  placeholder="e.g. Muhammad Usman"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-800 focus:outline-none"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-semibold text-gray-700">
                  Rating
                </span>
                <div className="flex items-center gap-2 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Give ${star} stars`}
                      onClick={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        weight={star <= newReview.rating ? "fill" : "regular"}
                        className="h-7 w-7"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-title"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Review Title
                </label>
                <input
                  id="review-title"
                  type="text"
                  required
                  value={newReview.title}
                  onChange={(event) =>
                    setNewReview({ ...newReview, title: event.target.value })
                  }
                  placeholder="e.g. Excellent Quality"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-800 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="review-content"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Review
                </label>
                <textarea
                  id="review-content"
                  required
                  rows={4}
                  value={newReview.content}
                  onChange={(event) =>
                    setNewReview({ ...newReview, content: event.target.value })
                  }
                  placeholder="Write your review here..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-800 focus:outline-none"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-semibold text-gray-700">
                  Add Photos (optional)
                </span>
                <p className="mb-2 text-xs text-gray-500">
                  Show the product right out of the box. Up to {MAX_PHOTOS}{" "}
                  photos.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadPhotos}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo}
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveApiMediaUrl(photo)}
                        alt="Uploaded review photo"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => handleRemovePhoto(photo)}
                        className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/60 text-white transition-colors hover:bg-black/80"
                      >
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      disabled={uploadingPhotos}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-amber-800 hover:text-amber-800 disabled:opacity-60"
                    >
                      {uploadingPhotos ? (
                        <Spinner className="h-6 w-6 animate-spin" />
                      ) : (
                        <ImageSquare className="h-6 w-6" />
                      )}
                      <span className="text-[10px] font-medium">
                        {uploadingPhotos ? "Uploading..." : "Add photo"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-amber-800 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:bg-amber-900 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}