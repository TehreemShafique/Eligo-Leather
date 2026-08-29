"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ImageUploadNote } from "@/components/ui/image-upload-note"
import {
  FolderOpen,
  Plus,
  MagnifyingGlass,
  Sparkle,
  Crop,
  ArrowsOut,
  PencilSimple,
  Palette,
  Eye,
  Trash,
  X,
  Sliders,
  Check,
  CheckCircle,
  FileImage,
  Lightning,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminFilesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [altText, setAltText] = useState("Person working with handcrafted leather items on a wooden table...")
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 })
  const [convertingWebp, setConvertingWebp] = useState(false)

  const [files, setFiles] = useState([
    {
      id: 1,
      name: "Slice_3_2.webp",
      originalName: "Slice_3_2.png",
      src: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000",
      alt: "Person working with handcrafted leather items on a wooden table",
      size: "460 KB (Optimized .webp -75%)",
      dimensions: "1920 x 700",
      format: "WEBP (Converted)",
      references: "Themes (1)",
      dateAdded: "Feb 8, 2026",
      updated: "Feb 8, 2026",
    },
    {
      id: 2,
      name: "Hero_Leather_Banner.webp",
      originalName: "Hero_Leather_Banner.jpg",
      src: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000",
      alt: "Eligo Leather handcrafted collection showcase",
      size: "520 KB (Optimized .webp -78%)",
      dimensions: "2400 x 1200",
      format: "WEBP (Converted)",
      references: "Online Store (2)",
      dateAdded: "Feb 5, 2026",
      updated: "Feb 6, 2026",
    },
    {
      id: 3,
      name: "CardHolder_Ardor_Detail.webp",
      originalName: "CardHolder_Ardor_Detail.jpg",
      src: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1000",
      alt: "ARDOR Leather Card Holder Close Up",
      size: "210 KB (Optimized .webp -76%)",
      dimensions: "1200 x 1200",
      format: "WEBP (Converted)",
      references: "Products (4)",
      dateAdded: "Jan 28, 2026",
      updated: "Feb 1, 2026",
    },
  ])

  useFormDirty({ altText, focalPoint, files })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    setConvertingWebp(true)
    toast.info("Uploading image & executing backend WebP Pillow conversion hook...")

    setTimeout(() => {
      const newFileObj = Array.from(uploadedFiles).map((file, idx) => {
        const rawName = file.name
        const parts = rawName.split(".")
        const baseName = parts.length > 1 ? parts.slice(0, -1).join(".") : rawName
        const webpName = `${baseName}.webp`
        const objectUrl = URL.createObjectURL(file)

        return {
          id: Date.now() + idx,
          name: webpName,
          originalName: rawName,
          src: objectUrl,
          alt: `Auto-generated alt text for ${webpName}`,
          size: `${Math.round(file.size / 4000)} KB (Optimized .webp -74%)`,
          dimensions: "1600 x 1200",
          format: "WEBP (Converted)",
          references: "Unassigned",
          dateAdded: "Today",
          updated: "Just now",
        }
      })

      setFiles(prev => [...newFileObj, ...prev])
      setConvertingWebp(false)
      toast.success(`Backend hook successfully converted ${uploadedFiles.length} image(s) to WebP format!`)
    }, 750)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setFocalPoint({ x, y })
    toast.success(`Focal point updated to ${x}%, ${y}%`)
  }

  return (
    <div className="space-y-5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      <PageHeader
        title="Files & Media Assets"
        icon={<Lightning className="w-5 h-5" />}
        actions={
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={convertingWebp}
            className="eligo-btn-primary disabled:opacity-50"
          >
            {convertingWebp ? (
              <span>Converting to .webp...</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Upload &amp; Convert to WebP</span>
              </>
            )}
          </button>
        }
      />

      <ImageUploadNote />

      {/* Backend WebP Conversion Active Banner */}
      <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-amber-800 text-white rounded-xl">
            <FileImage className="w-5 h-5" />
          </span>
          <div>
            <span className="font-bold text-amber-900 block">Backend WebP Image Processing Hook Active</span>
            <span className="text-gray-600 block text-[11px]">
              Any image file uploaded in PNG, JPG, JPEG, GIF, or BMP is intercepted by PIL (Pillow) and saved as lossy/lossless WebP.
            </span>
          </div>
        </div>
        <span className="px-3 py-1 bg-white border border-amber-300 text-amber-900 font-mono font-bold text-[10px] rounded-full">
          Quality: 85% WebP
        </span>
      </div>

      {/* Files Table Container */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-600">Sort by:</span>
            <select className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-semibold text-gray-800">
              <option>Date added (newest first)</option>
              <option>File size (largest first)</option>
              <option>File name (A-Z)</option>
            </select>
          </div>
          <span className="font-bold text-amber-900">{files.length} WebP Files Stored</span>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[12%]">File Preview</th>
                <th className="eligo-th">WebP File Name</th>
                <th className="eligo-th">Original Source Format</th>
                <th className="eligo-th w-[18%]">Optimized Size</th>
                <th className="eligo-th w-[14%]">References</th>
                <th className="eligo-th w-[14%] text-right">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.id}
                  onClick={() => {
                    setSelectedFile(file)
                    setAltText(file.alt)
                  }}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                >
                  <td className="eligo-td">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 relative overflow-hidden border border-gray-200">
                      <Image src={file.src} alt={file.alt} fill unoptimized className="object-cover" />
                    </div>
                  </td>
                  <td className="eligo-td">
                    <span className="font-bold text-amber-900 block hover:underline truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">image/webp</span>
                  </td>
                  <td className="eligo-td">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span className="truncate">{file.originalName}</span>
                    </span>
                  </td>
                  <td className="eligo-td font-mono font-bold text-gray-800">{file.size}</td>
                  <td className="eligo-td">
                    <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 text-[11px] font-semibold rounded-full">
                      {file.references}
                    </span>
                  </td>
                  <td className="eligo-td text-right text-gray-500">{file.dateAdded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 text-xs">
              <div>
                <h2 className="text-base font-bold text-gray-900">{selectedFile.name}</h2>
                <p className="text-xs text-gray-500">Stored as WebP (converted from {selectedFile.originalName})</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
              <div className="lg:col-span-8 p-6 bg-stone-900 flex flex-col items-center justify-center relative">
                <div
                  onClick={handleImageClick}
                  className="relative max-w-full max-h-[450px] aspect-video rounded-xl overflow-hidden cursor-crosshair group shadow-xl"
                >
                  <Image src={selectedFile.src} alt={selectedFile.name} fill unoptimized className="object-contain" />
                  <div
                    className="absolute w-6 h-6 border-2 border-white rounded-full bg-amber-800/60 shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all"
                    style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-xs">
                    Click image to set focal point ({focalPoint.x}%, {focalPoint.y}%)
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 p-6 space-y-5 bg-gray-50 border-l border-gray-200 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">WebP Name</label>
                  <input
                    type="text"
                    defaultValue={selectedFile.name}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-gray-300 font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide">Alt Text</label>
                  <textarea
                    rows={3}
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-200 text-gray-700">
                  <h3 className="font-bold text-gray-900">File Details</h3>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-bold text-emerald-800">{selectedFile.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedFile.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File size:</span>
                    <span className="font-bold text-gray-900">{selectedFile.size}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
