"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Truck,
  ArrowLeft,
  CheckCircle,
  Clock,
  X,
  FileText,
  ShieldCheck,
  DownloadSimple,
  MagnifyingGlass,
  ArrowClockwise,
  Gear,
  Key,
  Building,
  User,
  Barcode,
  Eye,
  Check,
  Sliders,
  Plus,
  DotsThreeVertical,
  Trash,
  Info,
} from "@phosphor-icons/react"
import { toast } from "sonner"

// Legacy orders pack "Name | Phone: 03xx | street, city" into shipping_address;
// the Leopards form needs the street address only.
function cleanConsigneeAddress(raw: string): string {
  const s = (raw || "").trim()
  if (!s.includes("|")) return s
  const parts = s.split("|").map((p) => p.trim()).filter(Boolean)
  const phoneIdx = parts.findIndex((p) => p.toLowerCase().startsWith("phone"))
  if (phoneIdx === -1) return s
  const address = parts.slice(phoneIdx + 1).join(", ").trim()
  return address || s
}

function LeopardsCourierFormContent() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [activeTab, setActiveTab] = useState("Orders")

  // API State for All Tabs (Initialized with full Leopards Courier API dataset)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [dispatchedList, setDispatchedList] = useState<any[]>([])
  const [loadSheetsList, setLoadSheetsList] = useState<any[]>([])
  const [logsList, setLogsList] = useState<any[]>([])
  const [settingsData, setSettingsData] = useState<any>({
    default_shipper: {
      name: "ELigo Leather",
      phone: "03345399470",
      email: "info@eligoleather.com",
      address: "Office # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad",
      city: "Islamabad",
    },
    additional_shippers: [
      {
        id: 1,
        enabled: true,
        name: "ELigo Leather",
        phone: "03345399470",
        email: "info@eligoleather.com",
        address: "Office # 407, 4th floor, Gulberg Greens",
        city: "Islamabad",
      },
    ],
    courier_settings: {
      api_key: "487F7B22F68312D2C1BBC93B1AEA445B17309685",
      password: "Eligo@407",
      shipper_city: "Islamabad",
      minimum_weight: "50",
      single_awb: true,
      add_shopify_notes: false,
      add_custom_notes: false,
      custom_notes: "",
    },
  })

  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([])

  // Search & Filter State
  const [fulfillmentFilter, setFulfillmentFilter] = useState("All")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("Any")
  const [logTypeFilter, setLogTypeFilter] = useState("All")
  const [logStatusFilter, setLogStatusFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [tagsFilter, setTagsFilter] = useState("")
  const [serviceTypeFilter, setServiceTypeFilter] = useState("Select Service Type")
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    "Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad"
  )

  // Manual Date Range Filters (From/To)
  const [fulfilledDateFrom, setFulfilledDateFrom] = useState("")
  const [fulfilledDateTo, setFulfilledDateTo] = useState("")
  const [dispatchedDateFrom, setDispatchedDateFrom] = useState("")
  const [dispatchedDateTo, setDispatchedDateTo] = useState("")
  const [logsDateFrom, setLogsDateFrom] = useState("")
  const [logsDateTo, setLogsDateTo] = useState("")

  // Fulfilled Tab - Payment Filter Options
  const [fulfilledPaymentFilter, setFulfilledPaymentFilter] = useState("All")
  const [fulfilledDeliveryFilter, setFulfilledDeliveryFilter] = useState("Any")

  // Dispatch Tab - Filter Options
  const [dispatchedPaymentFilter, setDispatchedPaymentFilter] = useState("All")
  const [dispatchedDeliveryFilter, setDispatchedDeliveryFilter] = useState("Any")

  // Action Dropdown State
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false)

  // Inline Search Filters
  const [searchOrderNo, setSearchOrderNo] = useState("")
  const [searchCustomer, setSearchCustomer] = useState("")
  const [searchCnNo, setSearchCnNo] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [searchAmount, setSearchAmount] = useState("")

  // Modals & Menu State
  const [selectedChallan, setSelectedChallan] = useState<any>(null)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncChallansInput, setSyncChallansInput] = useState("")

  // Single Order Manual Booking Form State (Picture 4 & Picture 5)
  const orderIdParam = searchParams ? searchParams.get("order_id") : null
  const [singleBookingOrderId, setSingleBookingOrderId] = useState<string | null>(orderIdParam)

  const [manualShipmentType, setManualShipmentType] = useState("Select Service Type")
  const [manualBookingDate, setManualBookingDate] = useState("08/12/2026")
  const [manualPieces, setManualPieces] = useState("1")
  const [manualWeightGrams, setManualWeightGrams] = useState("0")
  const [manualCodAmount, setManualCodAmount] = useState("")
  const [manualOrderId, setManualOrderId] = useState("")
  const [manualShipperAddr, setManualShipperAddr] = useState(
    "Office # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad"
  )
  const [manualConsigneeType, setManualConsigneeType] = useState("Other")
  const [manualDestinationCity, setManualDestinationCity] = useState("")
  const [manualConsigneeName, setManualConsigneeName] = useState("")
  const [manualConsigneeEmail, setManualConsigneeEmail] = useState("")
  const [manualConsigneePhone, setManualConsigneePhone] = useState("")
  const [manualConsigneePhone2, setManualConsigneePhone2] = useState("")
  const [manualConsigneePhone3, setManualConsigneePhone3] = useState("")
  const [manualConsigneeAddress, setManualConsigneeAddress] = useState("")
  const [manualSpecialInstructions, setManualSpecialInstructions] = useState("")

  // Fetch single order details when redirected with ?order_id=
  useEffect(() => {
    const qOrderId = searchParams ? searchParams.get("order_id") : null
    if (qOrderId) {
      setSingleBookingOrderId(qOrderId)
      setActiveTab("Orders")
      const cleanId = qOrderId.replace("#", "")
      fetch(`http://localhost:8000/api/v1/orders/detail/${cleanId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.order) {
            const o = data.order
            setManualOrderId(o.order_number || `#${cleanId}`)
            setManualCodAmount(o.total_price != null ? String(o.total_price) : "")
            setManualConsigneeName(o.customer_name || "")
            setManualConsigneePhone(o.customer_phone || "")
            setManualConsigneeEmail(
              o.customer_email && o.customer_email !== "No email provided" ? o.customer_email : ""
            )
            setManualConsigneeAddress(cleanConsigneeAddress(o.shipping_address || ""))
            setManualDestinationCity(o.city || "")
            if (o.items && Array.isArray(o.items) && o.items.length > 0) {
              const itemSummary = o.items
                .map((i: any) => `${i.product_name} - ${i.variant_title || ""} Qty=${i.quantity}`)
                .join(", ")
              setManualSpecialInstructions(itemSummary)
            }
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  const handlePerformManualBook = async () => {
    setLoading(true)
    const payload = {
      order_id: manualOrderId,
      cod_amount: manualCodAmount,
      consignee_name: manualConsigneeName,
      consignee_phone: manualConsigneePhone,
      consignee_email: manualConsigneeEmail,
      consignee_address: manualConsigneeAddress,
      destination_city: manualDestinationCity,
      special_instructions: manualSpecialInstructions,
      weight: manualWeightGrams || "500",
      weight_grams: parseInt(manualWeightGrams) || 500,
      pieces: parseInt(manualPieces) || 1,
      shipment_type: manualShipmentType,
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/book-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.status === "success") {
        toast.success(`Packet ${data.cn_number} booked successfully with Leopards API!`)
        if (data.cn_number) {
          handleDownloadCnPdf(data.cn_number)
        }
        fetchOrdersFromAPI()
        fetchDispatchedFromAPI()
      } else {
        const errMsg = data.message || data.detail || "Failed to book packet"
        toast.error(`Booking failed: ${errMsg}`)
      }
    } catch (e: any) {
      toast.error(`Network error: Could not reach backend server. ${e?.message || ""}`)
    } finally {
      setLoading(false)
    }
  }

  // 0. SYNC ALL FROM LEOPARDS API (auto-discovers all CNs via cnList)
  const [syncing, setSyncing] = useState(false)
  const handleSyncAll = async () => {
    setSyncing(true)
    toast.info("Connecting to Leopards API & syncing all CNs...")
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/sync-all", { cache: "no-store" })
      const data = await res.json()
      if (res.ok && data.status === "success") {
        const s = data.summary || {}
        toast.success(
          `Sync complete: ${s.total_tracked || 0} shipments tracked | ` +
          `Known: ${s.total_cns_known || 0} CNs | COD: Rs ${(s.total_cod || 0).toLocaleString()}`
        )
        if (data.orders && Array.isArray(data.orders)) setOrders(data.orders)
        if (data.dispatched && Array.isArray(data.dispatched)) setDispatchedList(data.dispatched)
        fetchLoadSheetsFromAPI()
        fetchLogsFromAPI()
      } else {
        toast.error(data.message || "Sync failed")
      }
    } catch (err: any) {
      toast.error(`Sync failed: ${err?.message || "Network error"}`)
    } finally {
      setSyncing(false)
    }
  }

  // 0b. HISTORICAL CSV IMPORT
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportCsvClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }

    setLoading(true)
    toast.info(`Importing historical data from ${file.name}...`)

    try {
      const csvContent = await file.text()
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_content: csvContent }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.imported > 0) {
          toast.success(data.message || `Imported ${data.imported} shipment(s) successfully!`)
        } else {
          const headers = data.debug_headers || []
          const sample = data.debug_sample_row || {}
          const headerList = headers.join(", ")
          toast.warning(
            `No shipments imported (0 CN found). CSV headers: ${headerList}`,
            { duration: 10000 }
          )
          console.log("CSV Debug - Headers:", headers)
          console.log("CSV Debug - Sample row (no CN):", sample)
        }
        fetchOrdersFromAPI()
        fetchLogsFromAPI()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || "Failed to import CSV")
      }
    } catch (err: any) {
      toast.error(`Import error: ${err?.message || "Network error"}`)
    } finally {
      setLoading(false)
    }
  }

  // Direct PDF download for any CN number (replaces printable modal)
  const handleDownloadCnPdf = async (cnNumber: string) => {
    if (!cnNumber) {
      toast.error("No CN number available for this order")
      return
    }
    toast.info(`Downloading airway bill PDF for CN #${cnNumber} from Leopards API...`)
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/leopard/cn/${cnNumber}/download-pdf`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      if (blob.size === 0) {
        throw new Error("Received empty PDF from Leopards API")
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `leopard_airway_bill_${cnNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Airway bill ${cnNumber}.pdf downloaded!`)
    } catch (err: any) {
      console.error("Failed to download airway bill PDF:", err)
      toast.error(`Failed to download PDF: ${err?.message || "Leopards API did not return a PDF. Try generating a load sheet first."}`)
    }
  }

  // 1. FETCH ALL ORDERS FROM LEOPARDS API (primary endpoint for Orders tab)
  const fetchOrdersFromAPI = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/all-orders", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders)
        }
        if (data.dispatched && Array.isArray(data.dispatched)) {
          setDispatchedList(data.dispatched)
        }
      } else {
        console.warn("Leopard all-orders API returned", res.status)
      }
    } catch (err) {
      console.error("Failed to fetch leopard orders:", err)
    } finally {
      setLoading(false)
    }
  }

  // 2. FETCH DISPATCHED PARCELS API
  const fetchDispatchedFromAPI = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/dispatched", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.dispatched && Array.isArray(data.dispatched)) {
          setDispatchedList(data.dispatched)
        }
      } else {
        console.warn("Leopard dispatched API returned", res.status)
      }
    } catch (err) {
      console.error("Failed to fetch dispatched parcels:", err)
    }
  }

  // 3. FETCH GENERATED LOAD SHEETS API
  const fetchLoadSheetsFromAPI = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/load-sheets", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.load_sheets && Array.isArray(data.load_sheets)) {
          setLoadSheetsList(data.load_sheets)
        }
      } else {
        console.warn("Leopard load-sheets API returned", res.status)
      }
    } catch (err) {
      console.error("Failed to fetch load sheets from API:", err)
    }
  }

  // 3b. DOWNLOAD REAL LOAD SHEET PDF FROM LEOPARDS API
  const handleDownloadLoadSheet = async (challanNo: string) => {
    try {
      toast.info(`Downloading Load Sheet Challan #${challanNo} from Leopards...`)
      const res = await fetch(`http://localhost:8000/api/v1/orders/leopard/load-sheets/${challanNo}/download`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bookedPacketSlip_${challanNo}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Challan #${challanNo}.pdf downloaded from Leopards!`)
      fetchLoadSheetsFromAPI()
    } catch (err: any) {
      console.error("Failed to download load sheet:", err)
      toast.error(`Failed to download load sheet #${challanNo}: ${err.message || err}`)
    }
  }

  // 3c. SYNC / REGISTER CHALLANS WITH LEOPARDS API
  const handleSyncChallans = async () => {
    const rawList = syncChallansInput.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    if (rawList.length === 0) {
      toast.error("Please enter at least one challan number to sync!")
      return
    }

    setLoading(true)
    toast.info(`Connecting to Leopards API & verifying ${rawList.length} challan(s)...`)

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/load-sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challan_numbers: rawList }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || `Successfully registered verified load sheet(s)!`)
        setSyncChallansInput("")
        setSyncModalOpen(false)
        fetchLoadSheetsFromAPI()
      } else {
        toast.error("Failed to sync load sheets")
      }
    } catch (err: any) {
      toast.error(`Error syncing challans: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  // 4. FETCH LOGS API
  const fetchLogsFromAPI = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/logs", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.logs && Array.isArray(data.logs)) {
          setLogsList(data.logs)
        }
      } else {
        console.warn("Leopard logs API returned", res.status)
      }
    } catch (err) {
      console.error("Failed to fetch leopard logs:", err)
    }
  }

  // 5. FETCH SETTINGS API
  const fetchSettingsFromAPI = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/settings", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettingsData(data.settings)
        }
      } else {
        console.warn("Leopard settings API returned", res.status)
      }
    } catch (err) {
      console.warn("Failed to fetch leopard settings (backend may be offline):", err)
    }
  }

  // Initial Data Load - Auto-sync all data from Leopards API on mount
  useEffect(() => {
    fetchOrdersFromAPI()
    fetchSettingsFromAPI()
    fetchLoadSheetsFromAPI()
    fetchLogsFromAPI()
  }, [])

  // BATCH CN GENERATION
  const handleGenerateCNBatch = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error("Please select at least one order to generate Leopards Consignment Number (CN)!")
      return
    }

    setLoading(true)
    toast.info(`Connecting to Leopards API & generating CN for ${selectedOrderIds.length} order(s)...`)

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/generate-cn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedOrderIds }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.results && Array.isArray(data.results)) {
          const successes = data.results.filter((r: any) => r.status === "CN_GENERATED_SUCCESSFULLY")
          const booked = data.results.filter((r: any) => r.status === "CN_GENERATED_SUCCESSFULLY" && r.cn_number)
          const failures = data.results.filter((r: any) => r.status === "NO_CN_AVAILABLE" || r.status === "CN_GENERATED_BOOK_FAILED" || r.status === "CN_GENERATED_NO_ORDER_DATA")
          if (successes.length > 0) {
            toast.success(`CN generated & booked successfully for ${successes.length} order(s)! Shipment is now live on Leopards.`)
          }
          if (failures.length > 0) {
            const noCn = failures.filter((r: any) => r.status === "NO_CN_AVAILABLE")
            const bookFail = failures.filter((r: any) => r.status === "CN_GENERATED_BOOK_FAILED")
            const noOrder = failures.filter((r: any) => r.status === "CN_GENERATED_NO_ORDER_DATA")
            if (noCn.length > 0) toast.warning(`${noCn.length} order(s) — no available CNs in pool`)
            if (bookFail.length > 0) toast.warning(`${bookFail.length} order(s) — CN assigned but Leopards booking failed (check logs)`)
            if (noOrder.length > 0) toast.warning(`${noOrder.length} order(s) — CN assigned but order not found in local DB`)
          }
          setOrders((prev) =>
            prev.map((o) => {
              const matched = successes.find((r: any) => r.order_id === o.id)
              if (matched) {
                return {
                  ...o,
                  cn_number: matched.cn_number,
                  fulfillment: "fulfilled",
                  tags: "Dispatched, leopards",
                }
              }
              return o
            })
          )
        } else {
          toast.success(data.message || "CN generation completed")
        }
        setSelectedOrderIds([])
        fetchOrdersFromAPI()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.detail || errData.message || "Failed to generate CN")
      }
    } catch (err: any) {
      toast.error(`Network error: Could not reach backend server. ${err?.message || ""}`)
    } finally {
      setLoading(false)
    }
  }

  // SAVE SETTINGS TO API & AUTO-SAVE TO DATABASE
  const autoSaveSettingsToAPI = async (newData: any) => {
    try {
      await fetch("http://localhost:8000/api/v1/orders/leopard/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })
    } catch (err) {
      console.warn("Auto-save settings sync:", err)
    }
  }

  const updateSettings = (newData: any) => {
    setSettingsData(newData)
    autoSaveSettingsToAPI(newData)
  }

  // Add Additional Shipper with BLANK / EMPTY FIELDS
  const handleAddShipper = () => {
    const newShipper = {
      id: Date.now(),
      enabled: true,
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
    }
    const updated = {
      ...settingsData,
      additional_shippers: [...(settingsData.additional_shippers || []), newShipper],
    }
    updateSettings(updated)
  }

  // Delete Additional Shipper
  const handleDeleteShipper = (id: number) => {
    const updated = {
      ...settingsData,
      additional_shippers: settingsData.additional_shippers.filter((s: any) => s.id !== id),
    }
    updateSettings(updated)
  }

  // Date Filtering Helper — manual From/To date range
  const matchDateFilter = (itemDateStr?: string) => {
    if (!dateFrom && !dateTo) return true
    if (!itemDateStr) return true

    let itemDate: Date | null = null
    try {
      if (itemDateStr.includes("/")) {
        const parts = itemDateStr.split(" ")[0].split("/")
        if (parts.length === 3) {
          const p1 = parseInt(parts[0], 10)
          const p2 = parseInt(parts[1], 10)
          const p3 = parseInt(parts[2], 10)
          if (p1 > 12) {
            itemDate = new Date(p3, p2 - 1, p1)
          } else if (p2 > 12) {
            itemDate = new Date(p3, p1 - 1, p2)
          } else {
            itemDate = new Date(p3, p2 - 1, p1)
          }
        }
      } else if (itemDateStr.includes("-")) {
        itemDate = new Date(itemDateStr.split(" ")[0])
      }
    } catch (e) {
      return true
    }

    if (!itemDate || isNaN(itemDate.getTime())) return true

    const itemStr = itemDate.toISOString().split("T")[0]
    if (dateFrom && itemStr < dateFrom) return false
    if (dateTo && itemStr > dateTo) return false
    return true
  }

  // Filtered Orders Logic — show ALL shipments from Leopard API, apply user filters
  const filteredOrders = orders.filter((o) => {
    if (fulfillmentFilter !== "All" && (o.fulfillment || "").toLowerCase() !== fulfillmentFilter.toLowerCase()) return false
    if (paymentFilter !== "All" && (o.payment || "").toLowerCase() !== paymentFilter.toLowerCase()) return false
    if (cityFilter.trim() && !(o.location || "").toLowerCase().includes(cityFilter.trim().toLowerCase()) && !(o.address || "").toLowerCase().includes(cityFilter.trim().toLowerCase())) return false
    if (serviceTypeFilter !== "Select Service Type" && !(o.service_type || o.tags || "Overnight").toLowerCase().includes(serviceTypeFilter.toLowerCase())) return false
    if (tagsFilter && !(o.tags || "").toLowerCase().includes(tagsFilter.toLowerCase())) return false
    if (searchOrderNo && !(o.order_number || "").toLowerCase().includes(searchOrderNo.toLowerCase())) return false
    if (searchCustomer && !(o.customer_name || "").toLowerCase().includes(searchCustomer.toLowerCase())) return false
    if (searchCnNo && !(o.cn_number || "").toLowerCase().includes(searchCnNo.toLowerCase())) return false
    if (searchPhone && !(o.phone || "").includes(searchPhone)) return false
    if (searchAmount && !String(o.amount || "").includes(searchAmount)) return false
    if (!matchDateFilter(o.date_time || o.booking_date)) return false
    return true
  })

  // Filtered Dispatched Logic
  const filteredDispatched = dispatchedList.filter((d) => {
    if (dispatchedPaymentFilter !== "All" && (d.payment || "").toLowerCase() !== dispatchedPaymentFilter.toLowerCase()) return false
    if (dispatchedDeliveryFilter !== "Any") {
      const cs = (d.courier_status || "").toLowerCase()
      if (dispatchedDeliveryFilter === "Not Available" && cs !== "" && cs !== "not_available" && cs !== "unknown") return false
      if (dispatchedDeliveryFilter === "Pickup Request Not Sent" && cs !== "" && !cs.includes("pickup")) return false
    }
    if (dispatchedDateFrom && d.date_time) {
      const itemDate = d.date_time.split(" ")[0]
      if (itemDate < dispatchedDateFrom) return false
    }
    if (dispatchedDateTo && d.date_time) {
      const itemDate = d.date_time.split(" ")[0]
      if (itemDate > dispatchedDateTo) return false
    }
    if (cityFilter.trim() && !(d.location || "").toLowerCase().includes(cityFilter.trim().toLowerCase())) return false
    if (searchOrderNo && !(d.order_number || "").toLowerCase().includes(searchOrderNo.toLowerCase())) return false
    if (searchCustomer && !(d.customer_name || "").toLowerCase().includes(searchCustomer.toLowerCase())) return false
    if (searchCnNo && !(d.cn_number || "").toLowerCase().includes(searchCnNo.toLowerCase())) return false
    if (searchPhone && !(d.phone || "").includes(searchPhone)) return false
    if (searchAmount && !String(d.cod || d.total || "").includes(searchAmount)) return false
    return true
  })

  // Filtered Fulfilled Logic
  const filteredFulfilled = orders.filter((o) => {
    // Payment filter
    if (fulfilledPaymentFilter !== "All") {
      if ((o.payment || "").toLowerCase() !== fulfilledPaymentFilter.toLowerCase()) return false
    }
    // Delivery status filter
    if (fulfilledDeliveryFilter !== "Any") {
      const cs = (o.courier_status || o.fulfillment || "").toLowerCase()
      if (fulfilledDeliveryFilter === "Not Available") {
        const isPending = cs.includes("pending") || cs.includes("booked")
        if (isPending) return false
      } else if (fulfilledDeliveryFilter === "Pickup Request Not Sent") {
        if (!(!cs || cs === "not_available" || cs === "unknown")) return false
      }
    }
    // Date range filter
    if (fulfilledDateFrom || fulfilledDateTo) {
      const d = o.date_time || o.booking_date || ""
      if (d) {
        if (fulfilledDateFrom && d < fulfilledDateFrom) return false
        if (fulfilledDateTo && d > fulfilledDateTo + "T23:59:59") return false
      }
    }
    // Tags filter
    if (tagsFilter.trim()) {
      if (!(o.tags || "").toLowerCase().includes(tagsFilter.trim().toLowerCase())) return false
    }
    // City filter
    if (cityFilter.trim()) {
      if (!(o.location || "").toLowerCase().includes(cityFilter.trim().toLowerCase())) return false
    }
    // Inline column search
    if (searchOrderNo && !(o.order_number || "").toLowerCase().includes(searchOrderNo.toLowerCase())) return false
    if (searchCustomer && !(o.customer_name || "").toLowerCase().includes(searchCustomer.toLowerCase())) return false
    if (searchCnNo && !(o.cn_number || "").toLowerCase().includes(searchCnNo.toLowerCase())) return false
    if (searchPhone && !(o.phone || "").includes(searchPhone)) return false
    return true
  })

  // Filtered Load Sheets Logic
  const filteredLoadSheets = loadSheetsList.filter((ls) => {
    if (searchCnNo && !(ls.challan_no || "").toLowerCase().includes(searchCnNo.toLowerCase())) return false
    if (!matchDateFilter(ls.challan_date || ls.created_at)) return false
    return true
  })

  // Filtered Logs Logic
  const filteredLogs = logsList.filter((l) => {
    if (logTypeFilter !== "All" && !(l.log_type || "").toLowerCase().includes(logTypeFilter.toLowerCase())) return false
    if (logStatusFilter !== "All" && (l.status || "").toLowerCase() !== logStatusFilter.toLowerCase()) return false
    if (logsDateFrom && l.date) {
      const itemDate = l.date.split(" ")[0]
      const normalizedItem = itemDate.replace(/\//g, "-")
      if (normalizedItem < logsDateFrom) return false
    }
    if (logsDateTo && l.date) {
      const itemDate = l.date.split(" ")[0]
      const normalizedItem = itemDate.replace(/\//g, "-")
      if (normalizedItem > logsDateTo) return false
    }
    if (searchOrderNo && !(l.order_number || "").toLowerCase().includes(searchOrderNo.toLowerCase())) return false
    return true
  })

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id))
    }
  }

  const toggleSelectOrder = (id: number) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((item) => item !== id))
    } else {
      setSelectedOrderIds([...selectedOrderIds, id])
    }
  }

  // Export Logs as CSV
  const handleExportLogsCSV = async () => {
    toast.info("Exporting logs as CSV...")
    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/leopard/logs/export-csv")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "leopard_logs_export.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Logs CSV exported successfully!")
    } catch (err) {
      toast.error("Failed to export logs CSV")
    }
  }

  if (!mounted) return null

  return (
    <main className="space-y-4 font-sans max-w-7xl mx-auto p-2 sm:p-4 bg-gray-50 min-h-screen text-xs">
      {/* Top Banner */}
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-400 rounded-md flex items-center justify-center font-bold text-black text-sm">
            {"🐆"}
          </div>
          <h1 className="text-base font-bold text-gray-900">Leopards Courier</h1>
        </div>
      </div>

      {/* Main Sub-Navigation Bar & Content Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 pb-2 font-semibold">
          <div className="flex flex-wrap gap-4 text-xs">
            {["Orders", "Fulfilled", "Dispatched", "Generated Load Sheets", "Logs", "Settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab
                    ? "border-amber-800 text-amber-800 font-bold"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === "Orders" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Single Order Manual Booking Form (Picture 4 & Picture 5) */}
            {singleBookingOrderId && (
              <div className="space-y-4 font-sans text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleBookingOrderId(null)}
                      className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>View All Orders List</span>
                    </button>
                    <h2 className="text-sm font-bold text-gray-900">Manual Leopard Shipment Booking for {manualOrderId}</h2>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">Leopard Merchant API v2</span>
                </div>

                {/* Basic Information Card (Picture 4) */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-2xs">
                  <h3 className="font-bold text-gray-900 text-xs">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Shipment Type*</label>
                      <select
                        value={manualShipmentType}
                        onChange={(e) => setManualShipmentType(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                      >
                        <option value="Select Service Type">Select Service Type ▾</option>
                        <option value="Overnight">Overnight</option>
                        <option value="Detain">Detain</option>
                        <option value="Overland">Overland</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Booking Date</label>
                      <input
                        type="text"
                        readOnly
                        value={manualBookingDate}
                        className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">No. of Pieces*</label>
                      <input
                        type="number"
                        value={manualPieces}
                        onChange={(e) => setManualPieces(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Net Weight* (grams)</label>
                      <input
                        type="number"
                        value={manualWeightGrams}
                        onChange={(e) => setManualWeightGrams(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">COD Amount*(PKR)</label>
                      <input
                        type="text"
                        value={manualCodAmount}
                        onChange={(e) => setManualCodAmount(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Order Id*</label>
                      <input
                        type="text"
                        value={manualOrderId}
                        onChange={(e) => setManualOrderId(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipper Information Card (Picture 4) */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-2xs">
                  <h3 className="font-bold text-gray-900 text-xs">Shipper Information</h3>
                  <div className="text-xs">
                    <label className="block font-medium text-gray-700 mb-1">Shipper Address*</label>
                    <select
                      value={manualShipperAddr}
                      onChange={(e) => setManualShipperAddr(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none"
                    >
                      <option value="Select Shipper Address">Select Shipper Address ▾</option>
                      <option value="Office # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad">
                        Office # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad
                      </option>
                    </select>
                  </div>
                </div>

                {/* Consignee Information Card (Picture 5) */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 shadow-2xs">
                  <h3 className="font-bold text-gray-900 text-xs">Consignee Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Consignee*</label>
                      <select
                        value={manualConsigneeType}
                        onChange={(e) => setManualConsigneeType(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none"
                      >
                        <option value="Other">Other ▾</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Destination City*</label>
                      <input
                        type="text"
                        value={manualDestinationCity}
                        onChange={(e) => setManualDestinationCity(e.target.value)}
                        placeholder="Lahore"
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Consignee Name*</label>
                      <input
                        type="text"
                        value={manualConsigneeName}
                        onChange={(e) => setManualConsigneeName(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Consignee Email*</label>
                      <input
                        type="email"
                        value={manualConsigneeEmail}
                        onChange={(e) => setManualConsigneeEmail(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Consignee Phone*</label>
                      <input
                        type="text"
                        value={manualConsigneePhone}
                        onChange={(e) => setManualConsigneePhone(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Consignee Phone 2(Optional)</label>
                      <input
                        type="text"
                        value={manualConsigneePhone2}
                        onChange={(e) => setManualConsigneePhone2(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-medium text-gray-700 mb-1">Consignee Phone 3(Optional)</label>
                      <input
                        type="text"
                        value={manualConsigneePhone3}
                        onChange={(e) => setManualConsigneePhone3(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block font-medium text-gray-700">Consignee Address*</label>
                    <textarea
                      rows={3}
                      value={manualConsigneeAddress}
                      onChange={(e) => setManualConsigneeAddress(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-900 font-normal focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block font-medium text-gray-700">Special Instructions*</label>
                    <textarea
                      rows={2}
                      value={manualSpecialInstructions}
                      onChange={(e) => setManualSpecialInstructions(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-900 font-normal focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handlePerformManualBook}
                      className="px-6 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <Truck className="w-4 h-4 text-amber-400" />
                      <span>{loading ? "Booking Packet..." : "Manual Book"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!singleBookingOrderId && (
              <div className="space-y-4 font-sans text-xs">
                {/* Filter Bar Row 1 */}
                <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Fulfillment Status:</span>
                <select
                  value={fulfillmentFilter}
                  onChange={(e) => setFulfillmentFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All ▾</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="partial">Partial</option>
                  <option value="unfulfilled">Un-Fulfilled</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Payment Status:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All ▾</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Un-Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="voided">Voided</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Date Range:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-medium text-gray-700 focus:outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-medium text-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Cities:</span>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Type city name..."
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none w-40"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => toast.info("Filters applied")}
                  className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs cursor-pointer"
                >
                  Filter
                </button>
                <button
                  onClick={() => {
                    setFulfillmentFilter("All")
                    setPaymentFilter("All")
                    setDateFrom("")
                    setDateTo("")
                    setCityFilter("")
                    setTagsFilter("")
                    setSearchOrderNo("")
                    setSearchCustomer("")
                    setSearchCnNo("")
                    setSearchPhone("")
                    setSearchAmount("")
                  }}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-indigo-600 font-bold border border-indigo-300 rounded cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filter Bar Row 2 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex items-center w-44">
                <input
                  type="text"
                  placeholder="Tags"
                  value={tagsFilter}
                  onChange={(e) => setTagsFilter(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 pr-6 text-xs text-gray-800 focus:outline-none"
                />
                <MagnifyingGlass className="w-3.5 h-3.5 absolute right-2 text-gray-400" />
              </div>

              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-1 font-medium text-gray-700 focus:outline-none"
              >
                <option value="Select Service Type">Select Service Type ▾</option>
                <option value="Overnight">Overnight</option>
                <option value="Detain">Detain</option>
                <option value="Overland">Overland</option>
              </select>

              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-1 font-medium text-gray-800 max-w-md truncate focus:outline-none"
              >
                <option value="Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad">
                  Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad ▾
                </option>
              </select>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCsvFile}
                className="hidden"
              />
              <button
                onClick={handleImportCsvClick}
                disabled={loading}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={() => { fetchOrdersFromAPI(); fetchLoadSheetsFromAPI(); fetchLogsFromAPI(); }}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-blue-600 font-bold border border-blue-400 rounded inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowClockwise className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                onClick={handleGenerateCNBatch}
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Generate CN</span>
              </button>

              <span className="text-gray-500 text-xs ml-2 font-mono">
                {filteredOrders.length} shipments loaded
              </span>
            </div>

            {/* Data Table */}
            <div className="eligo-table-wrap border border-gray-200 rounded-lg shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" style={{ minWidth: "1400px" }}>
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2 border-r border-gray-200 text-center w-8">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                        onChange={toggleSelectAll}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                    </th>

                    <th className="p-2 border-r border-gray-200 text-center w-12">Sr#</th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Order#</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchOrderNo}
                            onChange={(e) => setSearchOrderNo(e.target.value)}
                            placeholder="Order# "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Customer Name</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchCustomer}
                            onChange={(e) => setSearchCustomer(e.target.value)}
                            placeholder="Customer Name "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">Fulfillment</th>

                    <th className="p-2 border-r border-gray-200">Tags</th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>C.N #</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchCnNo}
                            onChange={(e) => setSearchCnNo(e.target.value)}
                            placeholder="C.N # "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Phone #</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)}
                            placeholder="Phone # "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">Location</th>

                    <th className="p-2 border-r border-gray-200 min-w-[200px]">Address</th>

                    <th className="p-2 border-r border-gray-200">Payment</th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Amount</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchAmount}
                            onChange={(e) => setSearchAmount(e.target.value)}
                            placeholder="Amount "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 text-center w-28">Download Invoice</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white font-normal text-gray-900">
                  {filteredOrders.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-2 border-r border-gray-200 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(o.id)}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200 text-center font-medium text-gray-600">
                        {o.sr || idx + 1}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-bold text-gray-900">{o.order_number}</td>

                      <td className="p-2 border-r border-gray-200 font-medium text-gray-800">{o.customer_name}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-700 capitalize">{o.fulfillment}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-700">{o.tags}</td>

                      <td className="p-2 border-r border-gray-200 font-mono font-bold text-indigo-950">
                        {o.cn_number}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-mono text-gray-800">{o.phone}</td>

                      <td className="p-2 border-r border-gray-200 font-medium text-gray-800">{o.location}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-700 text-[11px] leading-tight max-w-[220px]">
                        {o.address}
                      </td>

                      <td className="p-2 border-r border-gray-200 text-gray-800 capitalize">{o.payment}</td>

                      <td className="p-2 border-r border-gray-200 font-bold text-gray-900">{o.amount}</td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDownloadCnPdf(o.cn_number)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <DownloadSimple className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Row */}
            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 font-sans">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select className="border border-gray-300 rounded px-2 py-0.5 bg-white text-xs font-bold">
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 font-medium">
                <button className="px-2.5 py-1 text-gray-400 bg-gray-100 rounded border border-gray-200 cursor-not-allowed">
                  Previous
                </button>
                <button className="px-2.5 py-1 text-gray-400 bg-gray-100 rounded border border-gray-200 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {/* TAB 2: FULFILLED */}
        {activeTab === "Fulfilled" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Filter Bar Row */}
            <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Payment Status:</span>
                <select
                  value={fulfilledPaymentFilter}
                  onChange={(e) => setFulfilledPaymentFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All ▾</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Delivery Status:</span>
                <select
                  value={fulfilledDeliveryFilter}
                  onChange={(e) => setFulfilledDeliveryFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-3 py-1 text-gray-800 focus:outline-none"
                >
                  <option value="Any">Any ▾</option>
                  <option value="Not Available">Not Available</option>
                  <option value="Pickup Request Not Sent">Pickup Request Not Sent</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Date Range:</span>
                <input
                  type="date"
                  value={fulfilledDateFrom}
                  onChange={(e) => setFulfilledDateFrom(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={fulfilledDateTo}
                  onChange={(e) => setFulfilledDateTo(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Tags:</span>
                <input
                  type="text"
                  value={tagsFilter}
                  onChange={(e) => setTagsFilter(e.target.value)}
                  placeholder="Filter tags..."
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none w-28"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Cities:</span>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Filter city..."
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none w-28"
                />
              </div>

              <button
                onClick={() => toast.info("Filter applied")}
                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs cursor-pointer ml-auto"
              >
                Filter
              </button>

              <button
                onClick={() => {
                  setFulfilledPaymentFilter("All")
                  setFulfilledDeliveryFilter("Any")
                  setFulfilledDateFrom("")
                  setFulfilledDateTo("")
                  setTagsFilter("")
                  setCityFilter("")
                }}
                className="px-4 py-1 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-indigo-300 rounded cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { fetchOrdersFromAPI(); fetchLoadSheetsFromAPI(); fetchLogsFromAPI(); }}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-blue-600 font-bold border border-blue-400 rounded inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowClockwise className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                  className="px-2 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded inline-flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <DotsThreeVertical className="w-4 h-4" />
                </button>
                {actionDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActionDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-52 text-xs font-bold text-gray-800">
                      <button
                        onClick={() => { toast.info("Generate Load Sheets clicked"); setActionDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        Generate Load Sheets
                      </button>
                      <button
                        onClick={() => { toast.info("Bulk Download Invoice clicked"); setActionDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <DownloadSimple className="w-4 h-4 text-gray-500" />
                        Bulk Download Invoice
                      </button>
                      <button
                        onClick={() => { toast.info("Bulk Cancel clicked"); setActionDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                        Bulk Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSyncAll}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowClockwise className="w-3.5 h-3.5" />
                <span>Sync Status</span>
              </button>

              <span className="text-gray-500 text-xs ml-2 font-mono">
                {filteredFulfilled.length} fulfilled orders
              </span>
            </div>

            {/* Fulfilled Table */}
            <div className="eligo-table-wrap border border-gray-200 rounded-lg shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" style={{ minWidth: "1400px" }}>
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2 border-r border-gray-200 text-center w-8">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredFulfilled.length}
                        onChange={toggleSelectAll}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                    </th>

                    <th className="p-2 border-r border-gray-200 text-center w-12">Sr#</th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Order#</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchOrderNo}
                            onChange={(e) => setSearchOrderNo(e.target.value)}
                            placeholder="Order# "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Customer</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchCustomer}
                            onChange={(e) => setSearchCustomer(e.target.value)}
                            placeholder="Customer "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Phone No.</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)}
                            placeholder="Phone "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>CN No.</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchCnNo}
                            onChange={(e) => setSearchCnNo(e.target.value)}
                            placeholder="CN No. "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200 font-bold">Location</th>

                    <th className="p-2 border-r border-gray-200 font-bold min-w-[200px]">Address</th>

                    <th className="p-2 border-r border-gray-200 font-bold">Payment</th>

                    <th className="p-2 border-r border-gray-200 font-bold">Courier Status</th>

                    <th className="p-2 border-r border-gray-200 font-bold">Tags</th>

                    <th className="p-2 border-r border-gray-200 font-bold">Total</th>

                    <th className="p-2 border-r border-gray-200 font-bold">COD</th>

                    <th className="p-2 border-r border-gray-200 font-bold">Date &amp; Time</th>

                    <th className="p-2 text-center w-28">Download Invoice</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white font-normal text-gray-900">
                  {filteredFulfilled.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-2 border-r border-gray-200 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(o.id)}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200 text-center font-medium text-gray-600">
                        {o.sr || idx + 1}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-bold text-gray-900">{o.order_number}</td>

                      <td className="p-2 border-r border-gray-200 font-medium text-gray-800">{o.customer_name}</td>

                      <td className="p-2 border-r border-gray-200 font-mono text-gray-800">{o.phone}</td>

                      <td className="p-2 border-r border-gray-200 font-mono font-bold text-indigo-950">
                        {o.cn_number}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-medium text-gray-800">{o.location}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-700 text-[11px] leading-tight max-w-[220px]">
                        {o.address}
                      </td>

                      <td className="p-2 border-r border-gray-200 text-gray-800 capitalize">{o.payment}</td>

                      <td className="p-2 border-r border-gray-200">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border inline-flex items-center gap-1 ${
                          (o.courier_status || "").toLowerCase().includes("pending")
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : (o.courier_status || "").toLowerCase().includes("not available")
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{o.courier_status || "Not Available"}</span>
                        </span>
                      </td>

                      <td className="p-2 border-r border-gray-200 text-gray-700">{o.tags}</td>

                      <td className="p-2 border-r border-gray-200 font-bold text-gray-900">{o.total || o.amount}</td>

                      <td className="p-2 border-r border-gray-200 font-bold text-emerald-800">{o.cod}</td>

                      <td className="p-2 border-r border-gray-200 font-mono text-gray-700">{o.date_time}</td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDownloadCnPdf(o.cn_number)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <DownloadSimple className="w-3.5 h-3.5" />
                          <span>Download Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DISPATCHED */}
        {activeTab === "Dispatched" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Payment Status:</span>
                <select
                  value={dispatchedPaymentFilter}
                  onChange={(e) => setDispatchedPaymentFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All ▾</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Delivery Status:</span>
                <select
                  value={dispatchedDeliveryFilter}
                  onChange={(e) => setDispatchedDeliveryFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-3 py-1 text-gray-800 focus:outline-none"
                >
                  <option value="Any">Any ▾</option>
                  <option value="Not Available">Not Available</option>
                  <option value="Pickup Request Not Sent">Pickup Request Not Sent</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Date Range:</span>
                <input
                  type="date"
                  value={dispatchedDateFrom}
                  onChange={(e) => setDispatchedDateFrom(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dispatchedDateTo}
                  onChange={(e) => setDispatchedDateTo(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                />
              </div>

              <button
                onClick={() => toast.info("Filter applied")}
                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs cursor-pointer ml-auto"
              >
                Filter
              </button>

              <button
                onClick={fetchDispatchedFromAPI}
                disabled={loading}
                className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowClockwise className={`w-3.5 h-3.5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Dispatched Table */}
            <div className="eligo-table-wrap border border-gray-200 rounded-lg shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" style={{ minWidth: "1400px" }}>
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2 border-r border-gray-200 text-center w-8">
                      <input type="checkbox" className="rounded text-blue-600 cursor-pointer" />
                    </th>

                    <th className="p-2 border-r border-gray-200 text-center w-12">Sr#</th>

                    <th className="p-2 border-r border-gray-200">
                      <div className="space-y-1">
                        <div>Order#</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchOrderNo}
                            onChange={(e) => setSearchOrderNo(e.target.value)}
                            placeholder="Order# "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200 font-bold">CN No.</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Payment</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Total</th>
                    <th className="p-2 border-r border-gray-200 font-bold">COD</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Date &amp; Time</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Courier Status</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Location</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Invoice #</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Invoice Date</th>
                    <th className="p-2 font-bold">Dispatched Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white text-gray-900 font-normal">
                  {filteredDispatched.map((d, idx) => (
                    <tr key={d.id || d.order_number || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-2 border-r border-gray-200 text-center">
                        <input type="checkbox" className="rounded text-blue-600 cursor-pointer" />
                      </td>

                      <td className="p-2 border-r border-gray-200 text-center font-medium text-gray-600">
                        {d.sr || idx + 1}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-bold text-gray-900">{d.order_number}</td>

                      <td className="p-2 border-r border-gray-200 font-mono font-bold text-indigo-950">
                        {d.cn_number}
                      </td>

                      <td className="p-2 border-r border-gray-200 text-gray-800">{d.payment}</td>

                      <td className="p-2 border-r border-gray-200 font-bold">{d.total}</td>

                      <td className="p-2 border-r border-gray-200 font-bold text-emerald-800">{d.cod}</td>

                      <td className="p-2 border-r border-gray-200 font-mono text-gray-700">{d.date_time}</td>

                      <td className="p-2 border-r border-gray-200 font-semibold text-gray-800 capitalize">
                        {d.courier_status}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-medium text-gray-800">{d.location}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-500">{d.invoice_no}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-500">{d.invoice_date}</td>

                      <td className="p-2 text-gray-500">{d.dispatched_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 font-sans">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select className="border border-gray-300 rounded px-2 py-0.5 bg-white text-xs font-bold">
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 font-medium">
                <button className="px-3 py-1 text-gray-400 bg-gray-100 rounded border border-gray-200 cursor-not-allowed">
                  Previous
                </button>
                <button className="px-3 py-1 text-gray-400 bg-gray-100 rounded border border-gray-200 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GENERATED LOAD SHEETS (EXACT MATCHING USER SCREENSHOT 2) */}
        {activeTab === "Generated Load Sheets" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 text-xs">
                  Generated Load Sheets Challans ({filteredLoadSheets.length})
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-600 font-medium">Date Range:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-0.5 font-medium text-gray-700 focus:outline-none"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-0.5 font-medium text-gray-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSyncModalOpen(true)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded inline-flex items-center gap-1 cursor-pointer text-xs shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sync / Add Challans</span>
                </button>

                <button
                  onClick={fetchLoadSheetsFromAPI}
                  disabled={loading}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded inline-flex items-center gap-1 cursor-pointer text-xs"
                >
                  <ArrowClockwise className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh API</span>
                </button>
              </div>
            </div>

            {/* SYNC CHALLANS MODAL */}
            {syncModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-indigo-600" />
                      Sync Challans from Leopards API
                    </h3>
                    <button
                      onClick={() => setSyncModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600">
                    Enter or paste Challan Numbers generated on Shopify Leopards / Leopards Merchant portal (comma or line separated):
                  </p>

                  <textarea
                    rows={4}
                    value={syncChallansInput}
                    onChange={(e) => setSyncChallansInput(e.target.value)}
                    placeholder="e.g. 7683703, 7664041, 7590111, 7581833"
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setSyncModalOpen(false)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSyncChallans}
                      disabled={loading}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      {loading ? "Verifying..." : "Verify & Register"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Load Sheets Table (Exact Pixel Match of Screenshot 2) */}
            <div className="eligo-table-wrap border border-gray-200 rounded-lg shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3 border-r border-gray-200 text-center w-16">Sr#</th>
                    <th className="p-3 border-r border-gray-200 font-bold">Challan #</th>
                    <th className="p-3 border-r border-gray-200 font-bold">Challan Date</th>
                    <th className="p-3 font-bold text-center w-28">Download</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white font-normal text-gray-900">
                  {filteredLoadSheets.map((ls, idx) => (
                    <tr key={ls.sr || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3 border-r border-gray-200 text-center font-medium text-gray-700">
                        {ls.sr || idx + 1}
                      </td>

                      <td className="p-3 border-r border-gray-200 font-mono font-bold text-gray-900">
                        {ls.challan_no}
                      </td>

                      <td className="p-3 border-r border-gray-200 font-mono text-gray-700">{ls.challan_date}</td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDownloadLoadSheet(ls.challan_no)}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Download Challan PDF from Leopards"
                        >
                          <DownloadSimple className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LOGS */}
        {activeTab === "Logs" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Log Type:</span>
                <select
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All ▾</option>
                  <option value="CN Generated">CN Generated</option>
                  <option value="CN Cancelled">CN Cancelled</option>
                  <option value="Configuration Updated">Configuration Updated</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Status:</span>
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All ▾</option>
                  <option value="Success">Success</option>
                  <option value="Pending">Pending</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 font-medium">Date Range:</span>
                <input
                  type="date"
                  value={logsDateFrom}
                  onChange={(e) => setLogsDateFrom(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={logsDateTo}
                  onChange={(e) => setLogsDateTo(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none"
                />
              </div>

              <button
                onClick={() => toast.info("Filter applied")}
                className="px-3.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold border border-gray-300 rounded cursor-pointer"
              >
                Filter
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={fetchLogsFromAPI}
                  disabled={loading}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowClockwise className={`w-3.5 h-3.5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleExportLogsCSV}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded cursor-pointer"
                >
                  Export
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="eligo-table-wrap border border-gray-200 rounded-lg shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2 border-r border-gray-200 text-center w-8">
                      <input type="checkbox" className="rounded text-blue-600 cursor-pointer" />
                    </th>

                    <th className="p-2 border-r border-gray-200 text-center w-12">Sr#</th>

                    <th className="p-2 border-r border-gray-200 w-36">
                      <div className="space-y-1">
                        <div>Order#</div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={searchOrderNo}
                            onChange={(e) => setSearchOrderNo(e.target.value)}
                            placeholder="Order# "
                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-normal"
                          />
                          <MagnifyingGlass className="w-3 h-3 absolute right-1.5 text-gray-400" />
                        </div>
                      </div>
                    </th>

                    <th className="p-2 border-r border-gray-200 font-bold">Log Type</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Status</th>
                    <th className="p-2 border-r border-gray-200 font-bold">Detail</th>
                    <th className="p-2 font-bold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white font-normal text-gray-900">
                  {filteredLogs.map((l, idx) => (
                    <tr key={l.sr || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-2 border-r border-gray-200 text-center">
                        <input type="checkbox" className="rounded text-blue-600 cursor-pointer" />
                      </td>

                      <td className="p-2 border-r border-gray-200 text-center font-medium text-gray-600">
                        {l.sr || idx + 1}
                      </td>

                      <td className="p-2 border-r border-gray-200 font-bold text-gray-900">{l.order_number}</td>

                      <td className="p-2 border-r border-gray-200 text-gray-800">{l.log_type}</td>

                      <td className="p-2 border-r border-gray-200 font-bold text-emerald-700">{l.status}</td>

                      <td className="p-2 border-r border-gray-200 font-mono font-bold text-gray-900">{l.detail}</td>

                      <td className="p-2 font-mono text-gray-700">{l.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS (EXACT MATCHING USER SCREENSHOTS 4 & 5 WITH AUTO-SAVE & PLAIN TEXT SHIPPER CITY) */}
        {activeTab === "Settings" && (
          <div className="space-y-6 text-xs animate-in fade-in duration-150">

            {/* Section 1: Default Shipper Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-1 font-bold text-gray-900 text-sm">
                <span>Default Shipper Information</span>
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={settingsData.default_shipper.name}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        default_shipper: { ...settingsData.default_shipper, name: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-medium text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={settingsData.default_shipper.phone}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        default_shipper: { ...settingsData.default_shipper, phone: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-mono text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="text"
                    value={settingsData.default_shipper.email}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        default_shipper: { ...settingsData.default_shipper, email: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-medium text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contact Address</label>
                  <input
                    type="text"
                    value={settingsData.default_shipper.address}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        default_shipper: { ...settingsData.default_shipper, address: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none"
                  />
                </div>

                {/* SHIPPER CITY: PLAIN TEXT INPUT (NO DROPDOWN) */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Shipper City</label>
                  <input
                    type="text"
                    value={settingsData.default_shipper.city}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        default_shipper: { ...settingsData.default_shipper, city: e.target.value },
                      })
                    }
                    placeholder="Enter Shipper City"
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Additional Shipper Information */}
            <div className="space-y-3">
              <h2 className="font-bold text-gray-900 text-sm">Additional Shipper Information</h2>

              {settingsData.additional_shippers.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        additional_shippers: settingsData.additional_shippers.map((item: any) =>
                          item.id === s.id ? { ...item, enabled: e.target.checked } : item
                        ),
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
                  />

                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={s.name}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        additional_shippers: settingsData.additional_shippers.map((item: any) =>
                          item.id === s.id ? { ...item, name: e.target.value } : item
                        ),
                      })
                    }
                    className="flex-1 h-9 px-3 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={s.phone}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        additional_shippers: settingsData.additional_shippers.map((item: any) =>
                          item.id === s.id ? { ...item, phone: e.target.value } : item
                        ),
                      })
                    }
                    className="w-36 h-9 px-3 bg-white border border-gray-300 rounded font-mono text-gray-900 focus:outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Contact Email"
                    value={s.email}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        additional_shippers: settingsData.additional_shippers.map((item: any) =>
                          item.id === s.id ? { ...item, email: e.target.value } : item
                        ),
                      })
                    }
                    className="w-48 h-9 px-3 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Contact Address"
                    value={s.address}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        additional_shippers: settingsData.additional_shippers.map((item: any) =>
                          item.id === s.id ? { ...item, address: e.target.value } : item
                        ),
                      })
                    }
                    className="flex-1 h-9 px-3 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none"
                  />

                  {/* SHIPPER CITY: PLAIN TEXT INPUT FOR ADDITIONAL SHIPPERS */}
                  <input
                    type="text"
                    value={s.city}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        additional_shippers: settingsData.additional_shippers.map((item: any) =>
                          item.id === s.id ? { ...item, city: e.target.value } : item
                        ),
                      })
                    }
                    placeholder="Shipper City"
                    className="w-36 h-9 px-3 bg-white border border-gray-300 rounded font-bold text-gray-900 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleDeleteShipper(s.id)}
                    className="p-2 text-red-500 hover:text-red-700 bg-white border border-red-200 hover:border-red-400 rounded transition-colors cursor-pointer shrink-0"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddShipper}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-blue-600 font-bold border border-blue-400 rounded inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Shipper Information</span>
              </button>
            </div>

            {/* Section 3: Leopards Courier Setting */}
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 font-bold text-gray-900 text-sm">
                <span>Leopards Courier Setting</span>
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">API Key</label>
                  <input
                    type="text"
                    value={settingsData.courier_settings.api_key}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        courier_settings: { ...settingsData.courier_settings, api_key: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-mono font-bold text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={settingsData.courier_settings.password}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        courier_settings: { ...settingsData.courier_settings, password: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-mono text-gray-900 focus:outline-none"
                  />
                </div>

                {/* SHIPPER CITY: PLAIN TEXT INPUT IN COURIER SETTINGS */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Shipper City</label>
                  <input
                    type="text"
                    value={settingsData.courier_settings.shipper_city}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        courier_settings: { ...settingsData.courier_settings, shipper_city: e.target.value },
                      })
                    }
                    placeholder="Enter Shipper City"
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center pt-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Minimum Weight (Grams)</label>
                  <input
                    type="text"
                    value={settingsData.courier_settings.minimum_weight}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        courier_settings: { ...settingsData.courier_settings, minimum_weight: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded font-bold text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="col-span-3 space-y-1">
                  <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.courier_settings.single_awb}
                      onChange={(e) =>
                        updateSettings({
                          ...settingsData,
                          courier_settings: { ...settingsData.courier_settings, single_awb: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span>Single A.W.B (This option help sellers to limit number of AWBs for detain &amp; overland shipments.)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-8 pt-2">
                <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsData.courier_settings.add_custom_notes}
                    onChange={(e) =>
                      updateSettings({
                        ...settingsData,
                        courier_settings: { ...settingsData.courier_settings, add_custom_notes: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span>Add Custom Notes to AWB.</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Custom Notes</label>
                <textarea
                  rows={2}
                  placeholder={settingsData.courier_settings.add_custom_notes ? "Enter custom notes" : "Enable 'Add Custom Notes to AWB' to enter notes"}
                  disabled={!settingsData.courier_settings.add_custom_notes}
                  value={settingsData.courier_settings.custom_notes}
                  onChange={(e) =>
                    updateSettings({
                      ...settingsData,
                      courier_settings: { ...settingsData.courier_settings, custom_notes: e.target.value },
                    })
                  }
                  className={`w-full p-3 border border-gray-300 rounded text-gray-900 focus:outline-none ${
                    settingsData.courier_settings.add_custom_notes
                      ? "bg-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                ></textarea>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function LeopardsCourierPage() {
  return (
    <Suspense fallback={null}>
      <LeopardsCourierFormContent />
    </Suspense>
  )
}
