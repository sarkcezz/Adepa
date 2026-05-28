import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import type { Address } from '@/types'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [addresses, setAddresses] = useState<Address[]>([])
  const [open, setOpen] = useState(false)
  const [newAddress, setNewAddress] = useState({ label: 'Home', recipient: '', phone: '', area: '', district: '', landmark: '', is_default: false })

  useEffect(() => { api.get('/addresses').then((r) => setAddresses(r.data)) }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data } = await api.patch('/auth/profile', profile)
      // Server is the source of truth — use the returned user so we pick up
      // any normalization (trimmed whitespace, lowercased email, etc.).
      setUser(data.user)
      toast.success('Profile updated.')
    } catch {
      // axios interceptor surfaces validation toasts
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/auth/change-password', passwords)
      toast.success('Password changed.')
      setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch { /* handled */ }
  }

  async function addAddress() {
    try {
      const r = await api.post('/addresses', newAddress)
      setAddresses([...addresses, r.data])
      setOpen(false)
      toast.success('Address added.')
    } catch { /* handled */ }
  }

  async function delAddress(id: string) {
    await api.delete(`/addresses/${id}`)
    setAddresses(addresses.filter((a) => a.id !== id))
    toast.success('Address removed.')
  }

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4">
          <h2 className="text-lg font-semibold">Personal info</h2>
          <Input label="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Input label="Email" type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <Button type="submit">Save changes</Button>
        </form>

        <form onSubmit={savePassword} className="card space-y-4">
          <h2 className="text-lg font-semibold">Change password</h2>
          <Input label="Current password" type="password" required value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} />
          <Input label="New password" type="password" required value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
          <Input label="Confirm new password" type="password" required value={passwords.new_password_confirmation} onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })} />
          <Button type="submit">Update password</Button>
        </form>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Saved addresses ({addresses.length}/3)</h2>
          {addresses.length < 3 && (
            <Button variant="outline" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add address</Button>
          )}
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-night-500">No saved addresses yet.</p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 rounded-xl bg-cream p-4">
                <div>
                  <p className="font-semibold">{a.label} • {a.recipient}</p>
                  <p className="text-sm text-night-600">{a.area}, {a.district}</p>
                  <p className="text-xs text-night-500">{a.phone} {a.landmark && `• ${a.landmark}`}</p>
                  {a.is_default && <span className="badge bg-gold/20 text-gold-700 mt-2 inline-block">Default</span>}
                </div>
                <button onClick={() => delAddress(a.id)} className="rounded-md p-2 text-night-400 hover:bg-white hover:text-flame">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add address">
        <div className="space-y-3">
          <Input label="Label" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
          <Input label="Recipient name" value={newAddress.recipient} onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })} />
          <Input label="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
          <Input label="Area" value={newAddress.area} onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })} />
          <Input label="District" value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} />
          <Input label="Landmark (optional)" value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-flame" checked={newAddress.is_default} onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })} />
            Set as default
          </label>
          <Button onClick={addAddress} className="w-full">Save address</Button>
        </div>
      </Modal>
    </div>
  )
}
