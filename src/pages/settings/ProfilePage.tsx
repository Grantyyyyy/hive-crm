import { useState, useRef } from "react"
import { useUser } from "@clerk/clerk-react"
import { Camera, Save, Info } from "lucide-react"
import { toast } from "sonner"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { getUserInitials } from "@/lib/helpers"

export function ProfilePage() {
  const { user, isLoaded } = useUser()

  // Initialize form state from user data
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dirty check for save button
  const isDirty = firstName.trim() !== (user?.firstName ?? '')
    || lastName.trim() !== (user?.lastName ?? '')

  const handleSaveName = async () => {
    if (!user) return
    setSaving(true)
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
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
      await user.setProfileImage({ file })
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

  const initials = getUserInitials(user)

  if (!isLoaded) return <DetailSkeleton />

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
              Settings
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Profile
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage your personal information.
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN — Avatar Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden p-6">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                {user && user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
                    {initials}
                  </div>
                )}

                {/* Change Avatar Button */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {uploadingAvatar ? 'Uploading...' : 'Change photo'}
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                  JPG, PNG or GIF · max 10MB
                </p>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-6 w-full" />

                {/* User Metadata */}
                <div className="w-full space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Member Since
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.createdAt?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Last Sign In
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.lastSignInAt?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Personal Info & Email Cards */}
          <div className="lg:col-span-2 space-y-6">

            {/* CARD 1 — Personal Information */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 block">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveName}
                  disabled={!isDirty || saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>

            {/* CARD 2 — Email Address */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 block">
                Email Address
              </h2>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Primary Email
                </label>
                <input
                  type="text"
                  value={user?.primaryEmailAddress?.emailAddress ?? '—'}
                  disabled
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Email changes are managed through your account security settings. Contact your administrator to update.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
