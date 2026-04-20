import { useState, useRef, useEffect } from "react"
import { useUser } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { Camera, Save, Info, Loader2, Mail, Shield, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import { DetailSkeleton } from "@/components/ui/skeletons"

export function ProfilePage() {
  const { user, isLoaded } = useUser()

  // Parse name from Supabase user_metadata
  const fullName = user?.user_metadata?.full_name ?? ""
  const nameParts = fullName.split(" ")
  const [firstName, setFirstName] = useState(nameParts[0] ?? "")
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") ?? "")
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Re-sync form when user data changes
  useEffect(() => {
    const parts = (user?.user_metadata?.full_name ?? "").split(" ")
    setFirstName(parts[0] ?? "")
    setLastName(parts.slice(1).join(" ") ?? "")
  }, [user?.user_metadata?.full_name])

  const isDirty = firstName.trim() !== (nameParts[0] ?? "")
    || lastName.trim() !== (nameParts.slice(1).join(" ") ?? "")

  const handleSaveName = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await (supabase.auth as any).updateUser({
        data: {
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        },
      })
      if (error) throw error
      toast.success('Profile updated', {
        description: 'Your name has been saved.'
      })
    } catch (err: unknown) {
      toast.error('Update failed', {
        description: (err as Error).message
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      const { error: updateError } = await (supabase.auth as any).updateUser({
        data: { avatar_url: publicUrl },
      })
      if (updateError) throw updateError

      toast.success('Avatar updated', {
        description: 'Your profile photo has been changed.'
      })
    } catch (err: unknown) {
      toast.error('Upload failed', {
        description: (err as Error).message
      })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase()

  if (!isLoaded) return <DetailSkeleton />

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1400px] animate-content-in space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1">
              Personal Settings
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
              Profile
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
              Manage your personal information and profile visibility.
            </p>
          </div>
        </div>

        {/* content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN — Avatar Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Banner Area */}
              <div className="h-24 bg-gradient-to-r from-teal-500 to-blue-600 relative" />
              
              <div className="px-6 pb-8 -mt-12 flex flex-col items-center">
                {/* Avatar */}
                <div className="relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-md object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl font-bold ring-4 ring-white dark:ring-slate-900 shadow-lg">
                      {initials}
                    </div>
                  )}
                  
                  {/* Overlay Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    disabled={uploadingAvatar}
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <div className="mt-4 text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit">
                    {firstName} {lastName}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  {uploadingAvatar ? 'Uploading...' : 'Update Photo'}
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-slate-800/50" />

              {/* User Metadata */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    Member Since
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    Last Activity
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Personal Info & Email Cards */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1 — Personal Information */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white font-outfit">
                  Basic Information
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full h-11 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full h-11 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveName}
                    disabled={!isDirty || saving}
                    className="bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white rounded-md h-10 px-6 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-slate-200 dark:shadow-teal-900/20"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2 — Email Address */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white font-outfit">
                  Email Configuration
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Verified Email Address
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={user?.email ?? '—'}
                      disabled
                      className="w-full h-11 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-500 text-sm font-medium cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[9px] font-bold uppercase text-green-600 dark:text-green-500">Verified</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-md">
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed font-medium">
                      Your email address is linked to your authentication account. To change your login email, please visit the <strong>Security</strong> tab or contact support.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
