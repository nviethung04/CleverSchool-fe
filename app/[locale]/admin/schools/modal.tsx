"use client"

import React, { useEffect, useState, useCallback, useMemo, useRef, startTransition } from "react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GetProvinceList } from "@/lib/api/provinces"
import { GetWardList } from "@/lib/api/wards"
import { UploadLogo } from "@/lib/api/picture"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"
import { sortAlphabetGeneric } from "@/lib/utils"

// Định nghĩa kiểu dữ liệu
interface Province {
    code: string
    name: string
    full_name: string
}

interface Ward {
    code: string
    name: string
    province_code: string
}

interface SchoolFormData {
    id: string
    name: string
    short_name: string
    parent_school: string
    type: string
    ward_code: string // Changed from district_code
    ward_name: string // Changed from district_name
    province_name: string
    address_en: string
    address_vn: string
    contact_mail: string
    contact_name: string
    contact_phone: string
    programs_of_course: boolean
    close_status: boolean
    is_seamless_school: boolean
    created_at: string
    updated_at: string
    status: boolean
    province_code: string
    logo?: string
}

interface SchoolFormProps {
    show: boolean
    onClose: () => void
    onSubmit: () => void
    formData: SchoolFormData
    setFormData: React.Dispatch<React.SetStateAction<SchoolFormData>>
    selectedSchool: any
}

const SCHOOL_TYPES = ["Mầm non", "Tiểu học", "THCS", "THPT"]

// Validation errors state
interface ValidationErrors {
    province_code?: string
    ward_code?: string // Changed from district_code
    type?: string
}

// Data cache with TTL
class DataPreloader {
    private static instance: DataPreloader
    private cache = new Map()
    private loading = new Set()
    private ttl = 1000 * 60 * 5 // 5 minutes

    static getInstance() {
        if (!DataPreloader.instance) {
            DataPreloader.instance = new DataPreloader()
        }
        return DataPreloader.instance
    }

    async preload(key: string, fetcher: () => Promise<any>) {
        if (this.cache.has(key)) {
            return this.cache.get(key)
        }

        if (this.loading.has(key)) {
            return new Promise((resolve) => {
                const checkCache = () => {
                    if (this.cache.has(key)) {
                        resolve(this.cache.get(key))
                    } else {
                        setTimeout(checkCache, 10)
                    }
                }
                checkCache()
            })
        }

        this.loading.add(key)
        try {
            const data = await fetcher()
            this.cache.set(key, data)
            setTimeout(() => this.cache.delete(key), this.ttl)
            return data
        } finally {
            this.loading.delete(key)
        }
    }

    clearCache() {
        this.cache.clear()
    }
}

const dataPreloader = DataPreloader.getInstance()

// Update scheduler for batch updates
class UpdateScheduler {
    private pendingUpdates = new Map()
    private rafId: number | null = null

    schedule(key: string, update: () => void) {
        this.pendingUpdates.set(key, update)
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.flush()
            })
        }
    }

    private flush() {
        startTransition(() => {
            this.pendingUpdates.forEach((update) => update())
            this.pendingUpdates.clear()
            this.rafId = null
        })
    }
}

const updateScheduler = new UpdateScheduler()

// Enhanced Select with search functionality - Fixed version
const SearchableSelect = React.memo(
    ({
        options,
        value,
        onValueChange,
        placeholder,
        disabled,
        error,
        required = false,
        searchPlaceholder = "Tìm kiếm...",
        displayValue, // Thêm prop để hiển thị giá trị tùy chỉnh
    }: {
        options: Array<{ code: string; name: string }>
        value: string
        onValueChange: (value: string) => void
        placeholder: string
        disabled?: boolean
        error?: string
        required?: boolean
        searchPlaceholder?: string
        displayValue?: string // Thêm prop này
    }) => {
        const [searchTerm, setSearchTerm] = useState("")
        const [isOpen, setIsOpen] = useState(false)
        const searchInputRef = useRef<HTMLInputElement>(null)

        const filteredOptions = useMemo(() => {
            if (!searchTerm) return options.slice(0, 100)
            return options.filter((opt) => opt.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 100)
        }, [options, searchTerm])

        const selectedOption = useMemo(() => {
            const found = options.find((opt) => opt.code === value)
            if (!found && value) {
                console.log("Ward not found in options:", { value, optionsLength: options.length, options: options.slice(0, 5) })
            }
            return found
        }, [options, value])

        const handleOpenChange = useCallback((open: boolean) => {
            setIsOpen(open)
            if (open) {
                // Focus vào search input khi mở dropdown
                setTimeout(() => {
                    searchInputRef.current?.focus()
                }, 100)
            } else {
                setSearchTerm("")
            }
        }, [])

        // Xử lý search input change
        const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation() // Ngăn event bubbling
            setSearchTerm(e.target.value)
        }, [])

        // Xử lý key events để tránh đóng dropdown
        const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            e.stopPropagation() // Ngăn Select component xử lý key events

            // Cho phép các phím điều hướng cơ bản
            if (e.key === "Escape") {
                setIsOpen(false)
            }
        }, [])

        // Ngăn click trên search input đóng dropdown
        const handleSearchClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation()
        }, [])

        return (
            <div>
                <Select
                    value={value}
                    onValueChange={onValueChange}
                    disabled={disabled}
                    open={isOpen}
                    onOpenChange={handleOpenChange}
                >
                    <SelectTrigger className={error ? "border-red-500" : ""}>
                        <SelectValue placeholder={placeholder}>
                            {selectedOption ? selectedOption.name : (displayValue || placeholder)}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                        onCloseAutoFocus={(e) => e.preventDefault()} // Ngăn auto focus khi đóng
                        onEscapeKeyDown={() => setIsOpen(false)}
                    >
                        <div className="flex items-center px-3 pb-2 sticky top-0 bg-white border-b">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                                onClick={handleSearchClick}
                                className="h-8 w-full border-0 p-0 focus:outline-none focus:ring-0 bg-transparent"
                                autoComplete="off"
                            />
                        </div>
                        <div className="max-h-60 overflow-auto">
                            {filteredOptions.length > 0 ? (
                                sortAlphabetGeneric(filteredOptions, item => item.name, true).map((option) => (
                                    <SelectItem
                                        key={option.code}
                                        value={option.code}
                                        onSelect={() => {
                                            onValueChange(option.code)
                                            setIsOpen(false)
                                            setSearchTerm("")
                                        }}
                                    >
                                        {option.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</div>
                            )}
                        </div>
                    </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
        )
    },
)

// Smart Input with debouncing and validation
const SmartInput = React.memo(
    ({
        value,
        onChange,
        validation,
        label,
        t,
        ...props
    }: {
        value: string
        onChange: (value: string) => void
        validation?: (value: string) => boolean
        label: string
        t?: any
        [key: string]: any
    }) => {
        const [localValue, setLocalValue] = useState(value)
        const [isValid, setIsValid] = useState(true)
        const [errorMessage, setErrorMessage] = useState<string | null>(null)
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        useEffect(() => {
            if (value !== localValue && !document.activeElement?.matches('input[name="' + props.name + '"]')) {
                setLocalValue(value)
            }
            if (validation && value) {
                const valid = validation(value)
                setIsValid(valid)
                setErrorMessage(
                    valid ? null : `${t?.("pleaseEnter") || "Please enter"} ${label} ${t?.("invalidFormat") || "valid format"}`,
                )
            }
        }, [value, validation, label, t, localValue, props.name])

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const newValue = e.target.value
                setLocalValue(newValue)

                if (validation) {
                    const valid = validation(newValue)
                    setIsValid(valid)
                    setErrorMessage(
                        valid ? null : `${t?.("pleaseEnter") || "Please enter"} ${label} ${t?.("invalidFormat") || "valid format"}`,
                    )
                }

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }

                timeoutRef.current = setTimeout(() => {
                    updateScheduler.schedule(`input-${props.name}`, () => {
                        onChange(newValue)
                    })
                }, 150)
            },
            [onChange, validation, props.name, label],
        )

        return (
            <div>
                <Input
                    {...props}
                    value={localValue}
                    onChange={handleChange}
                    className={`${props.className || ""} ${!isValid ? "border-red-500" : ""}`}
                    aria-describedby={`${props.name}-error`}
                />
                {errorMessage && (
                    <p id={`${props.name}-error`} className="text-red-500 text-sm mt-1">
                        {errorMessage}
                    </p>
                )}
            </div>
        )
    },
)

// Main component
function SchoolDialogModal({ show, onClose, onSubmit, formData, setFormData, selectedSchool }: SchoolFormProps) {
    const t = useTranslations("schools")
    const [provinces, setProvinces] = useState<Province[]>([])
    const [wards, setWards] = useState<Ward[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    // States for logo upload
    const [isLogoLoading, setIsLogoLoading] = useState(false)
    const [isLoadingWards, setIsLoadingWards] = useState(false) // Thêm state loading wards

    // Validation errors state
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

    const preloadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const provincesData = await dataPreloader.preload("provinces", () => GetProvinceList())

            if (!provincesData?.data?.provinces || !Array.isArray(provincesData.data.provinces)) {
                throw new Error(t("invalidApiData"))
            }

            const loadedProvinces = provincesData.data.provinces
            setProvinces(loadedProvinces)
            setWards([])

            // Load wards for existing school
            if (selectedSchool && formData.id && formData.province_code && formData.ward_code) {
                try {
                    setIsLoadingWards(true)
                    const wardsData = await GetWardList(formData.province_code) // Gọi trực tiếp

                    if (wardsData?.data) {
                        const loadedWards = wardsData.data.wards || []
                        setWards(loadedWards)

                        const currentWard = loadedWards.find((w: any) => w.code === formData.ward_code)
                        const currentProvince = loadedProvinces.find((p: any) => p.code === formData.province_code)

                        const updates: any = {}

                        if (currentProvince && !formData.province_name) {
                            updates.province_name = currentProvince.name
                        }

                        if (currentWard && !formData.ward_name) {
                            updates.ward_name = currentWard.name
                        }

                        if (Object.keys(updates).length > 0) {
                            setFormData((prev) => ({
                                ...prev,
                                ...updates,
                            }))
                        }
                    }
                } catch (err) {
                    console.error("Error loading wards for province:", err)
                } finally {
                    setIsLoadingWards(false)
                }
            }
        } catch (err) {
            console.error("Error loading province/ward data:", err)
            setError("Không thể tải dữ liệu tỉnh/xã. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }, [
        selectedSchool,
        formData.id,
        formData.province_code,
        formData.ward_code, // Changed from district_code
        formData.province_name,
        formData.ward_name, // Changed from district_name
        t,
        setFormData,
    ])

    // Validation function
    const validateForm = useCallback(() => {
        const errors: ValidationErrors = {}

        if (!formData.province_code) {
            errors.province_code = "Vui lòng chọn tỉnh/thành phố"
        }

        if (!formData.ward_code) {
            errors.ward_code = "Vui lòng chọn xã/phường" // Changed from district_code
        }

        if (!formData.type) {
            errors.type = "Vui lòng chọn loại trường"
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }, [formData.province_code, formData.ward_code, formData.type]) // Changed from district_code

    // Clear validation errors when values change
    useEffect(() => {
        if (formData.province_code && validationErrors.province_code) {
            setValidationErrors((prev) => ({ ...prev, province_code: undefined }))
        }
    }, [formData.province_code, validationErrors.province_code])

    useEffect(() => {
        if (formData.ward_code && validationErrors.ward_code) {
            setValidationErrors((prev) => ({ ...prev, ward_code: undefined })) // Changed from district_code
        }
    }, [formData.ward_code, validationErrors.ward_code]) // Changed from district_code

    useEffect(() => {
        if (formData.type && validationErrors.type) {
            setValidationErrors((prev) => ({ ...prev, type: undefined }))
        }
    }, [formData.type, validationErrors.type])

    // Load data when dialog opens
    useEffect(() => {
        if (show) {
            preloadData()
            // Delay focus để tránh conflict với dialog animation
            setTimeout(() => {
                if (firstInputRef.current) {
                    firstInputRef.current.focus()
                }
            }, 200)
            setValidationErrors({})
        }
    }, [show, preloadData])

    // Sync province from ward if needed
    useEffect(() => {
        if (show && selectedSchool && formData.id && formData.ward_code && !formData.province_code) {
            const ward = wards.find((w) => w.code === formData.ward_code)
            if (ward && ward.province_code) {
                const province = provinces.find((p) => p.code === ward.province_code)
                if (province) {
                    setFormData((prev) => ({
                        ...prev,
                        province_code: province.code,
                        province_name: province.name,
                    }))
                }
            }
        }
    }, [show, selectedSchool, formData.id, formData.ward_code, formData.province_code, wards, provinces, setFormData]) // Changed from district_code

    // Clean up cache when dialog closes
    useEffect(() => {
        return () => {
            dataPreloader.clearCache()
        }
    }, [])

    // Handle province change
    const handleProvinceChange = useCallback(
        async (value: string) => {
            const selectedProvince = provinces.find((p) => p.code === value)

            // Clear wards immediately khi đổi province
            setWards([])
            setIsLoadingWards(true)

            setFormData((prev) => ({
                ...prev,
                province_code: value,
                province_name: selectedProvince?.name || "",
                ward_code: "", // Reset ward khi đổi province
                ward_name: "",
            }))

            // Load wards for the selected province
            if (value) {
                try {
                    // Force reload bằng cách thêm timestamp để tránh cache conflict
                    const cacheKey = `wards_${value}_${Date.now()}`
                    const wardsData = await GetWardList(value) // Gọi trực tiếp không qua cache

                    if (wardsData?.data) {
                        const wardsList = wardsData.data.wards || []
                        console.log(`Loaded ${wardsList.length} wards for province ${value}:`, wardsList.slice(0, 3))
                        setWards(wardsList)
                    } else {
                        console.log(`No wards data for province ${value}`)
                        setWards([])
                    }
                } catch (err) {
                    console.error("Error loading wards for province:", err)
                    setWards([])
                }
            } else {
                setWards([])
            }

            setIsLoadingWards(false)
        },
        [provinces, setFormData],
    )

    // Handle ward change
    const handleWardChange = useCallback(
        (value: string) => {
            const selectedWard = wards.find((w) => w.code === value)
            if (selectedWard) {
                setFormData((prev) => ({
                    ...prev,
                    ward_code: value, // Changed from district_code
                    ward_name: selectedWard.name, // Changed from district_name
                }))
            }
        },
        [wards, setFormData],
    )

    // Validation functions
    const validateEmail = useCallback((email: string) => {
        return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
    }, [])

    const validatePhone = useCallback((phone: string) => {
        return /^0\d{9}$/.test(phone)
    }, [])

    // Handle logo upload
    const handleLogoChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setIsLogoLoading(true)

                try {
                    const uploadResponse = await UploadLogo(file)
                    const logoUrl = uploadResponse.data?.url || uploadResponse.url
                    if (!logoUrl) {
                        throw new Error(t("logoUploadNoUrl"))
                    }

                    setFormData((prev) => ({
                        ...prev,
                        logo: logoUrl,
                    }))

                    toast({
                        title: t("uploadSuccess"),
                        description: t("logoUploadSuccess"),
                    })
                } catch (error: any) {
                    toast({
                        title: t("error"),
                        description: error.message || t("logoUploadError"),
                        variant: "destructive",
                    })
                } finally {
                    setIsLogoLoading(false)
                }
            }
        },
        [setFormData, toast, t],
    )

    // Handle form submit
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()

            // Validate form
            const isFormValid = validateForm()

            // Validate input fields
            const inputErrors = []
            if (!formData.name?.trim()) inputErrors.push("Tên trường")
            if (!formData.short_name?.trim()) inputErrors.push("Tên viết tắt")
            if (!formData.address_vn?.trim()) inputErrors.push("Địa chỉ")

            if (inputErrors.length > 0) {
                toast({
                    title: "Thông tin chưa đầy đủ",
                    description: `Vui lòng nhập: ${inputErrors.join(", ")}`,
                    variant: "destructive",
                })
                return
            }

            if (!isFormValid) {
                return
            }

            if (formData.contact_mail && !validateEmail(formData.contact_mail)) {
                toast({
                    title: "Email không hợp lệ",
                    description: "Vui lòng nhập email đúng định dạng",
                    variant: "destructive",
                })
                return
            }

            if (formData.contact_phone && !validatePhone(formData.contact_phone)) {
                toast({
                    title: "Số điện thoại không hợp lệ",
                    description: "Vui lòng nhập số điện thoại đúng định dạng",
                    variant: "destructive",
                })
                return
            }

            try {
                await onSubmit()
                // Không đóng dialog ở đây - để page.tsx xử lý
                console.log("Modal: Submit thành công, đang chờ page xử lý...")
            } catch (error) {
                console.error("Error submitting form:", error)
                toast({
                    title: "Có lỗi xảy ra",
                    description: "Không thể lưu thông tin trường học. Vui lòng thử lại.",
                    variant: "destructive",
                })
            }
        },
        [formData, onSubmit, validateEmail, validatePhone, validateForm, toast, selectedSchool, onClose],
    )

    if (!show) return null

    return (
        <Dialog open={show} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{selectedSchool ? t("modalTitleEdit") : t("modalTitle")}</DialogTitle>
                    <DialogDescription>{t("modalDescription")}</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="text-gray-500">{t("loadingData")}</div>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Logo upload section */}
                        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 rounded-lg border">
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-2">{t("schoolLogo")}</Label>
                                <div className="flex flex-col items-center space-y-3">
                                    <Avatar className="h-16 w-16 border-2 border-gray-200 shadow-sm">
                                        <AvatarImage
                                            src={formData.logo || "/placeholder.svg?height=64&width=64"}
                                            alt={t("schoolLogo")}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                            {formData.name ? formData.name.charAt(0).toUpperCase() : "S"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex flex-col items-center space-y-2">
                                        <label
                                            htmlFor="logo-upload-modal"
                                            className={`cursor-pointer text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${isLogoLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                                                }`}
                                        >
                                            {isLogoLoading ? t("uploading") : t("chooseFile")}
                                        </label>
                                        <input
                                            id="logo-upload-modal"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoChange}
                                            disabled={isLogoLoading}
                                        />
                                        <p className="text-xs text-gray-500">{t("logoFormat")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* School name and short name */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("schoolName")} <span className="text-red-500">*</span>
                                </Label>
                                <SmartInput
                                    id="name"
                                    name="name"
                                    label={t("schoolName")}
                                    placeholder={t("schoolNamePlaceholder")}
                                    value={formData.name}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                                    required
                                    ref={firstInputRef}
                                    aria-required="true"
                                    t={t}
                                />
                            </div>
                            <div>
                                <Label htmlFor="short_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("schoolShortName")} <span className="text-red-500">*</span>
                                </Label>
                                <SmartInput
                                    id="short_name"
                                    name="short_name"
                                    label={t("schoolShortName")}
                                    placeholder={t("schoolShortNamePlaceholder")}
                                    value={formData.short_name}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, short_name: value }))}
                                    required
                                    aria-required="true"
                                    t={t}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <Label htmlFor="address_vn" className="block text-sm font-medium text-gray-700 mb-2">
                                {t("schoolAddress")} <span className="text-red-500">*</span>
                            </Label>
                            <SmartInput
                                id="address_vn"
                                name="address_vn"
                                label={t("schoolAddress")}
                                placeholder={t("schoolAddressPlaceholder")}
                                value={formData.address_vn}
                                onChange={(value) => setFormData((prev) => ({ ...prev, address_vn: value }))}
                                required
                                aria-required="true"
                                t={t}
                            />
                        </div>

                        {/* Province and Ward */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("schoolProvince")} <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={provinces.map((p) => ({ code: p.code, name: p.name }))}
                                    value={formData.province_code || ""}
                                    onValueChange={handleProvinceChange}
                                    placeholder={t("schoolProvincePlaceholder")}
                                    searchPlaceholder="Tìm kiếm tỉnh/thành phố..."
                                    error={validationErrors.province_code}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("ward")} <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={wards.map((w) => ({ code: w.code, name: w.name }))}
                                    value={formData.ward_code || ""}
                                    onValueChange={handleWardChange}
                                    placeholder={isLoadingWards ? "Đang tải xã/phường..." : t("selectWard")}
                                    searchPlaceholder="Tìm kiếm xã/phường..."
                                    disabled={!formData.province_code || isLoadingWards}
                                    error={validationErrors.ward_code}
                                    displayValue={formData.ward_name} // Hiển thị ward_name từ formData
                                    required
                                />
                            </div>
                        </div>

                        {/* School type and status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("schoolType")} <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={SCHOOL_TYPES.map((type) => ({
                                        code: type,
                                        name:
                                            type === "Mầm non"
                                                ? t("kindergarten")
                                                : type === "Tiểu học"
                                                    ? t("primary")
                                                    : type === "THCS"
                                                        ? t("secondary")
                                                        : type === "THPT"
                                                            ? t("highSchool")
                                                            : type,
                                    }))}
                                    value={formData.type}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                                    placeholder={t("schoolTypePlaceholder")}
                                    searchPlaceholder="Tìm kiếm loại trường..."
                                    error={validationErrors.type}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("schoolStatus")}
                                </Label>
                                <SearchableSelect
                                    options={[
                                        { code: "true", name: t("active") },
                                        { code: "false", name: t("inactive") },
                                    ]}
                                    value={formData.status ? "true" : "false"}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value === "true" }))}
                                    placeholder={t("schoolStatusPlaceholder")}
                                    searchPlaceholder="Tìm kiếm trạng thái..."
                                />
                            </div>
                        </div>

                        {/* Contact information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-800 border-b pb-2">{t("contactInfo")}</h4>

                            <div>
                                <Label htmlFor="parent_school" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("parentSchool")}
                                </Label>
                                <SmartInput
                                    id="parent_school"
                                    name="parent_school"
                                    label={t("parentSchool")}
                                    placeholder={t("parentSchoolPlaceholder")}
                                    value={formData.parent_school}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, parent_school: value }))}
                                    t={t}
                                />
                            </div>

                            <div>
                                <Label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("contactPerson")}
                                </Label>
                                <SmartInput
                                    id="contact_name"
                                    name="contact_name"
                                    label={t("contactPerson")}
                                    placeholder={t("contactPersonPlaceholder")}
                                    value={formData.contact_name}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, contact_name: value }))}
                                    t={t}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("contactPhone")}
                                    </Label>
                                    <SmartInput
                                        id="contact_phone"
                                        name="contact_phone"
                                        label={t("contactPhone")}
                                        placeholder={t("contactPhonePlaceholder")}
                                        value={formData.contact_phone}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, contact_phone: value }))}
                                        validation={validatePhone}
                                        t={t}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contact_mail" className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("contactMail")}
                                    </Label>
                                    <SmartInput
                                        id="contact_mail"
                                        name="contact_mail"
                                        label={t("contactMail")}
                                        placeholder={t("contactEmailPlaceholder")}
                                        type="email"
                                        value={formData.contact_mail}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, contact_mail: value }))}
                                        validation={validateEmail}
                                        t={t}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6 pt-4 border-t gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t("cancel")}
                            </Button>
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                                {selectedSchool ? t("update") : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default SchoolDialogModal
