"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Translate,
  Plus,
  MagnifyingGlass,
  Check,
  X,
  Globe,
  Trash,
  DotsThreeOutline,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

export default function AdminSettingsLanguagesPage() {
  const [addLanguageModalOpen, setAddLanguageModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Master World Languages Catalog (from GET /api/v1/settings/languages/available)
  const masterWorldLanguages = [
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
    { code: "sq", name: "Albanian", nativeName: "Shqip" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "bn", name: "Bangla", nativeName: "বাংলা" },
    { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "ur", name: "Urdu", nativeName: "اردو" },
  ]

  // Store Active Languages State
  const [storeLanguages, setStoreLanguages] = useState([
    {
      id: 1,
      code: "en",
      name: "English",
      nativeName: "English",
      isDefault: true,
      status: "Published",
      domain: "eligoleather.com",
    },
    {
      id: 2,
      code: "ur",
      name: "Urdu",
      nativeName: "اردو",
      isDefault: false,
      status: "Published",
      domain: "eligoleather.com/ur",
    },
    {
      id: 3,
      code: "ar",
      name: "Arabic",
      nativeName: "العربية",
      isDefault: false,
      status: "Published",
      domain: "eligoleather.com/ar",
    },
    {
      id: 4,
      code: "es",
      name: "Spanish",
      nativeName: "Español",
      isDefault: false,
      status: "Unpublished",
      domain: "eligoleather.com/es",
    },
  ])

  // Selected Language in Modal
  const [selectedLangCode, setSelectedLangCode] = useState("fr")

  const filteredMasterLanguages = masterWorldLanguages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault()
    const matched = masterWorldLanguages.find((l) => l.code === selectedLangCode)
    if (!matched) return

    if (storeLanguages.some((l) => l.code === matched.code)) {
      toast.error(`Language "${matched.name}" is already added to your store.`)
      return
    }

    const newLang = {
      id: Date.now(),
      code: matched.code,
      name: matched.name,
      nativeName: matched.nativeName,
      isDefault: false,
      status: "Published",
      domain: `eligoleather.com/${matched.code}`,
    }

    setStoreLanguages([...storeLanguages, newLang])
    setAddLanguageModalOpen(false)
    toast.success(`Language "${matched.name}" (${matched.code.toUpperCase()}) added and published successfully!`)
  }

  const handleToggleStatus = (id: number) => {
    setStoreLanguages(
      storeLanguages.map((l) => {
        if (l.id === id) {
          if (l.isDefault) {
            toast.error("Cannot unpublish the default store language.")
            return l
          }
          const nextStatus = l.status === "Published" ? "Unpublished" : "Published"
          toast.success(`Language "${l.name}" status updated to ${nextStatus}!`)
          return { ...l, status: nextStatus }
        }
        return l
      })
    )
  }

  const handleSetDefault = (id: number) => {
    setStoreLanguages(
      storeLanguages.map((l) => ({
        ...l,
        isDefault: l.id === id,
        status: "Published",
      }))
    )
    toast.success("Primary store default language updated!")
  }

  const handleDeleteLanguage = (id: number) => {
    const target = storeLanguages.find((l) => l.id === id)
    if (target?.isDefault) {
      toast.error("Cannot delete the default store language.")
      return
    }
    setStoreLanguages(storeLanguages.filter((l) => l.id !== id))
    toast.info(`Language "${target?.name}" removed from store.`)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Languages"
        icon={<Translate className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setAddLanguageModalOpen(true)}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add language</span>
          </button>
        }
      />

      {/* Published Languages Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden text-xs">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Active Storefront Languages</h2>
            <p className="text-xs text-gray-500">Customers can switch between these languages on the storefront header.</p>
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Language</th>
                <th className="eligo-th">ISO Code</th>
                <th className="eligo-th">Subdirectory / Domain Mapping</th>
                <th className="eligo-th">Status</th>
                <th className="eligo-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {storeLanguages.map((lang) => (
                <tr key={lang.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <Translate className="w-4 h-4 text-amber-800" />
                      <span>{lang.name}</span>
                      <span className="text-gray-400 font-normal">({lang.nativeName})</span>
                      {lang.isDefault && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-600 font-bold uppercase">{lang.code}</td>
                  <td className="px-6 py-4 font-mono text-gray-600 text-[11px]">{lang.domain}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        lang.status === "Published"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lang.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!lang.isDefault && (
                        <>
                          <button
                            onClick={() => handleSetDefault(lang.id)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-semibold"
                          >
                            Make Default
                          </button>
                          <button
                            onClick={() => handleToggleStatus(lang.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                              lang.status === "Published" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {lang.status === "Published" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => handleDeleteLanguage(lang.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Language Modal Component */}
      {addLanguageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-800" />
                <h3 className="text-base font-bold text-gray-900">Add Language</h3>
              </div>
              <button onClick={() => setAddLanguageModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLanguage} className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Search &amp; Select World Language</label>
                <div className="relative mb-2">
                  <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search languages by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-hidden"
                  />
                </div>

                <select
                  value={selectedLangCode}
                  onChange={(e) => setSelectedLangCode(e.target.value)}
                  size={5}
                  className="w-full p-2 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900 focus:outline-hidden"
                >
                  {filteredMasterLanguages.map((l) => (
                    <option key={l.code} value={l.code} className="p-1.5 hover:bg-amber-100 rounded">
                      {l.name} ({l.nativeName}) &mdash; [{l.code.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddLanguageModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                >
                  Add Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
