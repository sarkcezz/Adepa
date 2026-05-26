import { useEffect, useState } from 'react'
import { Plus, Pencil, Power } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatGhs, formatWeight } from '@/lib/formatters'
import { toast } from 'sonner'

const empty = {
  name: '', product_line: 'RAW', variant: 'PLAIN', weight_grams: 500, price_kobo: 0,
  description: '', ingredients: '', storage_instructions: '', heat_level: 0,
  image_url: '', stock_qty: 0, is_active: true,
}

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<any>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.get('/admin/products').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function save() {
    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, edit)
        toast.success('Product updated.')
      } else {
        await api.post('/admin/products', edit)
        toast.success('Product created.')
      }
      setOpen(false)
      setEdit(empty)
      setEditingId(null)
      load()
    } catch { /* */ }
  }

  async function toggle(id: string) {
    await api.patch(`/admin/products/${id}/toggle`)
    load()
  }

  function startEdit(p: Product) {
    setEdit({ ...p, price_kobo: p.price_kobo })
    setEditingId(p.id)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold">Products</h1>
        <Button onClick={() => { setEdit(empty); setEditingId(null); setOpen(true) }}>
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th>Line</th>
                <th>Variant</th>
                <th>Size</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td>{p.product_line}</td>
                  <td>{p.variant}</td>
                  <td>{formatWeight(p.weight_grams)}</td>
                  <td className="font-semibold">{formatGhs(p.price_kobo)}</td>
                  <td>{p.stock_qty}</td>
                  <td>
                    <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-night-100 text-night-500'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-2">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(p)} className="rounded p-1.5 hover:bg-night-100"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => toggle(p.id)} className="rounded p-1.5 hover:bg-night-100"><Power className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit product' : 'New product'} size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
          <Select label="Line" value={edit.product_line} onChange={(e) => setEdit({ ...edit, product_line: e.target.value })}>
            <option value="RAW">Raw</option>
            <option value="SPICED">Spiced</option>
            <option value="READY_TO_EAT">Ready-to-Eat</option>
          </Select>
          <Select label="Variant" value={edit.variant} onChange={(e) => setEdit({ ...edit, variant: e.target.value })}>
            <option value="NONE">None</option>
            <option value="PLAIN">Plain</option>
            <option value="MILD">Mild</option>
            <option value="SPICY">Spicy</option>
          </Select>
          <Input label="Weight (g)" type="number" value={edit.weight_grams || ''} onChange={(e) => setEdit({ ...edit, weight_grams: Number(e.target.value) || null })} />
          <Input label="Price (kobo)" type="number" hint="In pesewas: GHS 5 = 500" value={edit.price_kobo} onChange={(e) => setEdit({ ...edit, price_kobo: Number(e.target.value) })} />
          <Input label="Heat (0-5)" type="number" min={0} max={5} value={edit.heat_level} onChange={(e) => setEdit({ ...edit, heat_level: Number(e.target.value) })} />
          <Input label="Stock" type="number" value={edit.stock_qty} onChange={(e) => setEdit({ ...edit, stock_qty: Number(e.target.value) })} />
          <Input label="Image URL" value={edit.image_url || ''} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} />
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          </div>
        </div>
        <Button onClick={save} className="mt-5 w-full">{editingId ? 'Save changes' : 'Create product'}</Button>
      </Modal>
    </div>
  )
}
