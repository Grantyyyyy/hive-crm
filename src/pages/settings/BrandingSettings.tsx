import { useState, useEffect, useRef } from "react";
import { useCRMContext, updateRow } from "@/lib/CRMContext";
import { supabase } from "@/lib/supabaseClient";
import type { Organization } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Layout, Image as ImageIcon, Save, RefreshCcw, Upload, Loader2, Type } from "lucide-react";
import { logger } from "@/lib/logger";

export function BrandingSettings() {
  const ctx = useCRMContext();
  const { data: organizations, isLoaded } = ctx.getResource<Organization>("organizations");
  const org = organizations[0]; 

  const [appName, setAppName] = useState("");
  const [appLogoUrl, setAppLogoUrl] = useState("");
  const [appTagline, setAppTagline] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (org) {
      setAppName(org.appName || "Hive CRM");
      setAppLogoUrl(org.appLogoUrl || "/hub.svg");
      setAppTagline(org.appTagline || "Enterprise Suite");
    }
  }, [org]);

  const handleSave = async () => {
    if (!org) return;
    setIsSaving(true);
    try {
      await updateRow<Organization>(ctx, "organizations", org.id, {
        appName,
        appLogoUrl,
        appTagline,
      });
      toast.success("Branding settings updated successfully");
    } catch (error) {
      logger.error("Failed to update branding settings:", error);
      toast.error("Failed to update branding settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo_${org.id}_${Date.now()}.${fileExt}`;
      
      // We'll try to use a 'branding' bucket. 
      // Note: User may need to create this bucket in Supabase dashboard if it doesn't exist.
      const { data, error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes("bucket not found")) {
          throw new Error("The 'branding' storage bucket has not been created yet. Please run the SQL migration provided or create the bucket manually in the Supabase Dashboard.");
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("branding")
        .getPublicUrl(fileName);

      setAppLogoUrl(publicUrl);
      toast.success("Logo uploaded successfully. Don't forget to save changes!");
    } catch (error: any) {
      logger.error("Failed to upload logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    if (org) {
      setAppName(org.appName || "Hive CRM");
      setAppLogoUrl(org.appLogoUrl || "");
      setAppTagline(org.appTagline || "Enterprise Suite");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Region */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Branding & Identity</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Customize the platform's visual identity and brand presence.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleReset}
            className="h-10 rounded-md font-bold text-xs uppercase tracking-widest w-full sm:w-auto border-slate-200 dark:border-slate-800"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 rounded-md font-bold text-xs uppercase tracking-widest w-full sm:w-auto shadow-md shadow-accent/10 dark:shadow-none px-8"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Configuration Card */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 shadow-sm transition-all duration-500">
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
            <Layout className="size-32 rotate-12 text-accent" />
          </div>

          <div className="p-8 relative space-y-8">
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                <Layout className="w-5 h-5 text-accent" />
                App Configuration
              </h3>
              <p className="text-xs text-slate-400 font-medium">Set the name and tagline for your organization's instance.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application Name</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Acme CRM"
                  className="h-11 rounded-md border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appTagline" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Tagline</Label>
                <Input
                  id="appTagline"
                  value={appTagline}
                  onChange={(e) => setAppTagline(e.target.value)}
                  placeholder="e.g. Enterprise Suite"
                  className="h-11 rounded-md border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all bg-slate-50/50 dark:bg-slate-900/50"
                />
                <p className="text-[10px] text-slate-400 italic">Short descriptor appearing in the navigation sidebar.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Assets (Logo)</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      value={appLogoUrl}
                      onChange={(e) => setAppLogoUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      className="h-11 rounded-md border-slate-200 dark:border-slate-800 flex-1 bg-slate-50/50 dark:bg-slate-900/50"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="h-11 px-4 rounded-md font-bold text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors border-slate-200 dark:border-slate-700"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Support for SVG, PNG, and JPEG. High-resolution transparent background recommended.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="group relative overflow-hidden bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 transition-all duration-500 flex flex-col">
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" />
              Sidebar Preview
            </h3>
            <p className="text-xs text-slate-400 font-medium">Visual validation of your current branding configuration.</p>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100/50 via-transparent to-transparent dark:from-slate-800/20">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 w-full max-w-sm transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative group/logo">
                <img 
                  src={appLogoUrl || "/hub.svg"} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover/logo:scale-110 invert" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[18px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                  {appName || "Hive CRM"}
                </span>
                <span className="text-[10px] text-accent font-black truncate uppercase tracking-[0.2em] mt-0.5">
                  {appTagline || "Enterprise Suite"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
