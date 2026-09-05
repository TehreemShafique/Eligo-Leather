"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Gear,
  DotsThreeOutline,
  PencilSimple,
  Plus,
  CaretRight,
  Globe,
  MapPin,
  CurrencyCircleDollar,
  Clock,
  Tag,
  Palette,
  FileText,
  ClockCounterClockwise,
  UserCheck,
  ShieldCheck,
  X,
  UploadSimple,
  Check,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"
import { getStoredUser } from "@/lib/api"
import PermissionGuard from "@/components/auth/permission-guard"

export default function AdminSettingsGeneralPage() {
  const user = getStoredUser() as { email?: string; full_name?: string | null } | null
  const userFullName = user?.full_name || user?.email || "Admin"
  const userEmail = user?.email || ""
  const nameParts = userFullName.split(" ")

  // Modal states
  const [editEntityModalOpen, setEditEntityModalOpen] = useState(false)
  const [storeContactModalOpen, setStoreContactModalOpen] = useState(false)
  const [editStoreAddressModalOpen, setEditStoreAddressModalOpen] = useState(false)
  const [brandWorkspaceOpen, setBrandWorkspaceOpen] = useState(false)
  const [activityLogModalOpen, setActivityLogModalOpen] = useState(false)
  const [entityActionDropdownOpen, setEntityActionDropdownOpen] = useState(false)

  // Business Entity Fields
  const [businessType, setBusinessType] = useState("Individual")
  const [firstName, setFirstName] = useState(nameParts[0] || "")
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "")
  const [nickname, setNickname] = useState("Bilal")
  const [dobMonth, setDobMonth] = useState("08")
  const [dobDay, setDobDay] = useState("14")
  const [dobYear, setDobYear] = useState("1994")
  const [resAddress, setResAddress] = useState("Gulberg Greens, Executive Block")
  const [resCity, setResCity] = useState("Islamabad")
  const [resPostal, setResPostal] = useState("44000")

  // Store Identity Fields
  const [storeName, setStoreName] = useState("Eligo Leather")
  const [storeEmail, setStoreEmail] = useState(userEmail || "eligoleather9@gmail.com")
  const [storePhone, setStorePhone] = useState("0334-5399470")

  // Store Address Fields
  const [companyName, setCompanyName] = useState("Eligo Leather Goods")
  const [countryRegion, setCountryRegion] = useState("Pakistan")
  const [storeStreetAddress, setStoreStreetAddress] = useState("Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens")
  const [storeApartment, setStoreApartment] = useState("Office 407")
  const [storeCity, setStoreCity] = useState("Islamabad")
  const [storePostalCode, setStorePostalCode] = useState("44000")

  // Store Defaults Fields
  const [storeCurrency, setStoreCurrency] = useState("Pakistani Rupee (PKR Rs)")
  const [backupRegion, setBackupRegion] = useState("Pakistan")
  const [unitSystem, setUnitSystem] = useState("Metric system")
  const [weightUnit, setWeightUnit] = useState("Kilogram (kg)")
  const [timeZone, setTimeZone] = useState("(GMT+05:00) Islamabad, Karachi")

  // Order ID Format
  const [orderPrefix, setOrderPrefix] = useState("#")
  const [orderSuffix, setOrderSuffix] = useState("")
  const [orderProcessing, setOrderProcessing] = useState("Don't fulfill automatically")
  const [autoArchive, setAutoArchive] = useState(true)

  // Brand Asset Fields
  const [primaryColor, setPrimaryColor] = useState("#7A1C1C")
  const [secondaryColor, setSecondaryColor] = useState("#3E2723")
  const [slogan, setSlogan] = useState("Handcrafted Genuine Leather Accessories for Life")
  const [shortDesc, setShortDesc] = useState("Premium handcrafted leather wallets, belts, card holders, and accessories from Pakistan.")

  const { reset } = useFormDirty({
    businessType,
    firstName,
    lastName,
    nickname,
    dobMonth,
    dobDay,
    dobYear,
    resAddress,
    resCity,
    resPostal,
    storeName,
    storeEmail,
    storePhone,
    companyName,
    countryRegion,
    storeStreetAddress,
    storeApartment,
    storeCity,
    storePostalCode,
    storeCurrency,
    backupRegion,
    unitSystem,
    weightUnit,
    timeZone,
    orderPrefix,
    orderSuffix,
    orderProcessing,
    autoArchive,
    primaryColor,
    secondaryColor,
    slogan,
    shortDesc,
  })

  const countriesList = [
    "Pakistan",
    "United States",
    "United Kingdom",
    "United Arab Emirates",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Saudi Arabia",
    "Turkey",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Argentina",
    "Bahrain",
    "Bangladesh",
    "Brazil",
    "China",
    "Egypt",
    "India",
    "Indonesia",
    "Italy",
    "Japan",,
    "Malaysia",
    "Netherlands",,
    "New Zealand",
    "Qatar",
    "Singapore",
    "South Africa",
    "Spain",
    "Sweden",
    "Switzerland",
    "Vietnam",
    "Zimbabwe",
  ]

  const activityLogs = [
    { date: "Today, 6:45 PM", user: `${userFullName} (${userEmail})`, action: "User Login Successful", ip: "192.168.18.176" },
    { date: "Today, 2:15 PM", user: `${userFullName} (${userEmail})`, action: "Updated Store Address", ip: "192.168.18.176" },
    { date: "Yesterday, 11:30 AM", user: `${userFullName} (${userEmail})`, action: "Created Product Metafield Definition", ip: "192.168.18.176" },
  ]

  return (
    <PermissionGuard feature="settings_store">
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Administrative Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            General Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage legal business details, store contact info, physical address, currency localization, and brand assets.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* 1. Business Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Business Details</h2>
              <p className="text-xs text-gray-500">Business entity used for financial products, markets, apps, and taxes in this shop.</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setEntityActionDropdownOpen(!entityActionDropdownOpen)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <DotsThreeOutline className="w-4 h-4 text-gray-700" />
              </button>

              {entityActionDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-1 font-semibold text-gray-700">
                  <button
                    onClick={() => {
                      setEditEntityModalOpen(true)
                      setEntityActionDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg"
                  >
                    Edit Legal Entity
                  </button>
                  <button
                    onClick={() => {
                      toast.info("Add business entity modal opened...")
                      setEntityActionDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg"
                  >
                    Add Entity
                  </button>
                  <button
                    onClick={() => {
                      toast.info("Navigating to all business entities...")
                      setEntityActionDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg"
                  >
                    View All Entities
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇵🇰</span>
              <div>
                <span className="font-bold text-gray-900 text-sm block">{firstName} {lastName}</span>
                <span className="text-gray-500 text-xs">Individual &bull; {countryRegion}</span>
              </div>
            </div>
            <button
              onClick={() => setEditEntityModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-amber-800 hover:bg-gray-100 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* 2. Store Contact Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Store Contact Details</h2>

          {/* Store Identity Row (Triggers Centered Dialog Modal) */}
          <div
            onClick={() => setStoreContactModalOpen(true)}
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div>
              <div className="font-bold text-gray-900 text-sm">{storeName}</div>
              <div className="text-gray-500 text-xs mt-0.5">Email: {storeEmail} &bull; Phone: {storePhone}</div>
            </div>
            <CaretRight className="w-4 h-4 text-gray-400 group-hover:text-amber-800 transition-colors" />
          </div>

          {/* Store Address Row */}
          <div
            onClick={() => setEditStoreAddressModalOpen(true)}
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div>
              <div className="font-bold text-gray-900 text-xs uppercase tracking-wide">Storefront Physical Address</div>
              <div className="text-gray-700 text-xs font-semibold mt-1">
                {storeStreetAddress}, {storeApartment}, {storeCity}, {storePostalCode}, {countryRegion}
              </div>
            </div>
            <CaretRight className="w-4 h-4 text-gray-400 group-hover:text-amber-800 transition-colors" />
          </div>
        </div>

        {/* 3. Store Defaults & Localization Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Store Defaults & Localization</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Store Currency</label>
              <select
                value={storeCurrency}
                onChange={(e) => setStoreCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800"
              >
                <option value="Pakistani Rupee (PKR Rs)">Pakistani Rupee (PKR Rs)</option>
                <option value="US Dollar (USD $)">US Dollar (USD $)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Backup Region</label>
              <select
                value={backupRegion}
                onChange={(e) => setBackupRegion(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              >
                <option value="Pakistan">Pakistan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Unit System</label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              >
                <option value="Metric system">Metric system</option>
                <option value="Imperial system">Imperial system</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Default Weight Unit</label>
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              >
                <option value="Kilogram (kg)">Kilogram (kg)</option>
                <option value="Gram (g)">Gram (g)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Time Zone</label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              >
                <option value="(GMT+05:00) Islamabad, Karachi">(GMT+05:00) Islamabad, Karachi</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Order ID Format & Processing Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Order ID Format & Processing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Prefix</label>
              <input
                type="text"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Suffix</label>
              <input
                type="text"
                value={orderSuffix}
                onChange={(e) => setOrderSuffix(e.target.value)}
                placeholder="e.g. -EL"
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-900 uppercase tracking-wide block">Order processing</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="processing"
                checked={orderProcessing === "Automatically fulfill line items"}
                onChange={() => setOrderProcessing("Automatically fulfill line items")}
              />
              <span className="font-semibold text-gray-800">Automatically fulfill the order&apos;s line items</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="processing"
                checked={orderProcessing === "Don't fulfill automatically"}
                onChange={() => setOrderProcessing("Don't fulfill automatically")}
              />
              <span className="font-semibold text-gray-800">Don&apos;t fulfill any of the order&apos;s line items automatically</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={autoArchive}
                onChange={(e) => setAutoArchive(e.target.checked)}
                className="rounded border-gray-300 text-amber-800"
              />
              <span className="font-semibold text-gray-800">Automatically archive the order when completed</span>
            </label>
          </div>
        </div>

        {/* 5. Store Assets: Brand Workspace Button & Metafields */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-900">Store Assets: Brand & Metafields</h2>
            <button
              onClick={() => setBrandWorkspaceOpen(true)}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-semibold text-xs shadow-2xs"
            >
              Open Brand Workspace
            </button>
          </div>
          <p className="text-gray-500">Manage brand logos, colors, taglines, cover images, and shop-level custom metafields.</p>
        </div>

        {/* 6. Activity Log & Store Resources Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-900">System Activity Log & Resources</h2>
            <button
              onClick={() => setActivityLogModalOpen(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs border border-gray-300"
            >
              View Store Activity Log
            </button>
          </div>
          <p className="text-gray-500">Track staff login audit trails, exact dates, timestamps, and system credential actions.</p>
        </div>
      </div>

      {/* A. Edit Legal Entity Modal */}
      {editEntityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">About your business entity</h3>
              <button onClick={() => setEditEntityModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">What type of business do you have?</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                  <option value="Individual">Individual (Selling under your own name)</option>
                  <option value="Company">Company (Legally separate entity)</option>
                  <option value="Non-profit">Non-profit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">First name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Last name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Month</label>
                  <input type="text" value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-full h-9 px-2 rounded-lg bg-gray-50 border border-gray-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">DD</label>
                  <input type="text" value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-full h-9 px-2 rounded-lg bg-gray-50 border border-gray-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">YYYY</label>
                  <input type="text" value={dobYear} onChange={(e) => setDobYear(e.target.value)} className="w-full h-9 px-2 rounded-lg bg-gray-50 border border-gray-300 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Residential address</label>
                <input type="text" value={resAddress} onChange={(e) => setResAddress(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setEditEntityModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
              <button onClick={() => { toast.success("Business entity updated!"); setEditEntityModalOpen(false); reset(); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                Save Entity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. Centered Overlay Dialog Modal: Store Contact Details (Requested by User) */}
      {storeContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Store Contact Details</h3>
              <button onClick={() => setStoreContactModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Store name</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900" />
                <p className="text-[11px] text-gray-500 mt-1">Appears on your online store and emails.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Store email</label>
                <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900" />
                <p className="text-[11px] text-gray-500 mt-1">Receives messages about your store.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Store phone</label>
                <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setStoreContactModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
              <button onClick={() => { toast.success("Store contact details updated!"); setStoreContactModalOpen(false); reset(); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Edit Store Address Modal */}
      {editStoreAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit store address</h3>
              <button onClick={() => setEditStoreAddressModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-500">Your customers can see this information on receipts and checkout.</p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Company name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Country/region</label>
                <select value={countryRegion} onChange={(e) => setCountryRegion(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                  {countriesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Address</label>
                <input type="text" value={storeStreetAddress} onChange={(e) => setStoreStreetAddress(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Apartment, suite</label>
                  <input type="text" value={storeApartment} onChange={(e) => setStoreApartment(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">City</label>
                  <input type="text" value={storeCity} onChange={(e) => setStoreCity(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Postal code</label>
                <input type="text" value={storePostalCode} onChange={(e) => setStorePostalCode(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setEditStoreAddressModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
              <button onClick={() => { toast.success("Store address updated!"); setEditStoreAddressModalOpen(false); reset(); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                Submit Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. Brand Workspace Modal */}
      {brandWorkspaceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Brand Asset Workspace</h3>
              <button onClick={() => setBrandWorkspaceOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide mb-2">Essential Brand Colors</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border" />
                    <span className="font-bold text-gray-900">Primary: {primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border" />
                    <span className="font-bold text-gray-900">Secondary: {secondaryColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Slogan / Tagline</label>
                <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Short Description</label>
                <textarea rows={3} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setBrandWorkspaceOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
              <button onClick={() => { toast.success("Brand assets saved!"); setBrandWorkspaceOpen(false); reset(); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                Save Brand Assets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. Store Activity Log Modal */}
      {activityLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Store Activity & Audit Log</h3>
              <button onClick={() => setActivityLogModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto space-y-2">
              {activityLogs.map((log, idx) => (
                <div key={idx} className="pt-2 text-xs">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{log.action}</span>
                    <span className="text-gray-500 font-mono text-[11px]">{log.date}</span>
                  </div>
                  <div className="text-gray-600 text-[11px] mt-0.5">{log.user} &bull; IP: {log.ip}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button onClick={() => setActivityLogModalOpen(false)} className="px-4 py-2 bg-amber-800 text-white rounded-xl font-semibold">
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  )
}
