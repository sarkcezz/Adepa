import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

interface Props {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
}

/**
 * Image picker + uploader.
 * - Click/drag to select a local file
 * - POSTs to /admin/upload/image (multipart/form-data)
 * - On success, calls onChange with the returned Cloudinary URL
 * - Shows a thumbnail with remove button when an image is set
 */
export function ImageUpload({ value, onChange, label = 'Image', hint }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/admin/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.url)
      toast.success('Image uploaded.')
    } catch {
      // handled by global axios interceptor
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="sm:col-span-2">
      <label className="label">{label}</label>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded preview"
            className="h-40 w-40 rounded-xl object-cover ring-1 ring-night-200"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-flame text-white shadow-flame cursor-pointer hover:bg-flame-600"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-colors ${
            dragOver ? 'border-flame bg-flame-50' : 'border-night-200 bg-night-50 hover:border-flame hover:bg-flame-50/50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click() }}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-flame" />
              <p className="text-sm font-medium text-night-700">Uploading…</p>
            </>
          ) : (
            <>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-flame/10 text-flame">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-night-800">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-night-500">JPG, PNG, WEBP · max 5MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {hint && <p className="mt-1 text-xs text-night-500">{hint}</p>}

      {/* Optional URL fallback for legacy / external images */}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-night-500 hover:text-flame">
          Or paste an external image URL
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-night-400" />
          <input
            type="url"
            placeholder="https://…/image.jpg"
            defaultValue={value || ''}
            onBlur={(e) => onChange(e.target.value || null)}
            className="input flex-1"
          />
        </div>
      </details>
    </div>
  )
}
