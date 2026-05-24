import { useState, useRef, useEffect } from "react"
import { useUser } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { Camera, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { Button } from "@/components/ui/button"
import { SettingsHeader } from "@/components/reusables/SettingsHeader"

export function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name ?? "")
      setUsername(user.user_metadata?.user_name ?? "")
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, user_name: username }
      })
      if (error) throw error
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user?.id}_${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError
      toast.success("Avatar updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
      if (e.target) e.target.value = ""
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase()

  if (!isLoaded) return <DetailSkeleton />

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <SettingsHeader 
        category="Account Settings"
        title="Personal Profile"
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-accent to-blue-600 relative" />

            <div className="px-6 pb-8 -mt-12 flex flex-col items-center">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-md object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 ring-4 ring-white dark:ring-slate-900 shadow-lg">
                    {initials}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1.5 bg-accent hover:bg-accent-dim text-white rounded-md shadow-md cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{fullName || "User"}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Profile Details</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-11 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="brand" type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
