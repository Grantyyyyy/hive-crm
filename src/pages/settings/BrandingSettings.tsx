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
      setAppName(org.appName || "CRM Hub");
      setAppLogoUrl(org.appLogoUrl || "");
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
      console.error("Failed to update branding settings:", error);
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
      console.error("Failed to upload logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    if (org) {
      setAppName(org.appName || "CRM Hub");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branding</h2>
          <p className="text-text-muted">
            Customize the identity of your application.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent hover:bg-accent/90 text-white gap-2 px-8"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-bg-surface/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-accent" />
              App Configuration
            </CardTitle>
            <CardDescription>
              Set the name and tagline that appears in the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. My Company CRM"
                className="bg-bg-elevated/50 border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appTagline" className="flex items-center gap-2">
                <Type className="w-3.5 h-3.5" />
                Tagline
              </Label>
              <Input
                id="appTagline"
                value={appTagline}
                onChange={(e) => setAppTagline(e.target.value)}
                placeholder="e.g. Enterprise Suite"
                className="bg-bg-elevated/50 border-border/50"
              />
              <p className="text-[11px] text-text-muted italic">
                A short description that appears below the app name.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Application Logo</Label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    value={appLogoUrl}
                    onChange={(e) => setAppLogoUrl(e.target.value)}
                    placeholder="URL to logo image"
                    className="bg-bg-elevated/50 border-border/50"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2 shrink-0"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                  </Button>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Paste a URL or upload a file. Recommended: SVG or transparent PNG.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-bg-surface/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" />
              Preview
            </CardTitle>
            <CardDescription>
              How your branding will look in the sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-12 bg-bg-elevated/30 rounded-xl border border-dashed border-border/50">
            <div className="flex items-center gap-3 bg-bg-surface p-5 rounded-2xl shadow-2xl border border-border/50 w-full max-w-xs transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 overflow-hidden">
                {appLogoUrl ? (
                  <img src={appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-8 h-8 text-white font-bold flex items-center justify-center text-xl">
                    {appName.slice(0, 1).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] font-bold text-text-primary truncate leading-tight">
                  {appName || "CRM Hub"}
                </span>
                <span className="text-[11px] text-text-muted font-medium truncate uppercase tracking-wider">
                  {appTagline || "Enterprise Suite"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
