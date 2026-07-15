import { useState } from "react";
import { Loader2, MessageCircle, Upload, X } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/lib/pharmacy";
import { toast } from "sonner";

const QUOTE_PHOTO_BUCKET = "quote-photos";
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

const RequestQuote = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    drug_name: "",
    strength: "",
    whatsapp_number: "",
  });

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Photo is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Unsupported file type. Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photo_url: string | null = null;

      if (photoFile) {
        setIsUploading(true);
        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `quotes/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(QUOTE_PHOTO_BUCKET)
          .upload(path, photoFile, { contentType: photoFile.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(QUOTE_PHOTO_BUCKET).getPublicUrl(path);
        photo_url = data.publicUrl;
        setIsUploading(false);
      }

      const { error } = await supabase.from("medication_quote_requests").insert({
        drug_name: form.drug_name,
        strength: form.strength || null,
        photo_url,
        whatsapp_number: form.whatsapp_number,
      });

      if (error) throw error;

      toast.success("Request submitted! Our pharmacist will reach out on WhatsApp with a quote.");
      setForm({ drug_name: "", strength: "", whatsapp_number: "" });
      clearPhoto();
    } catch (err) {
      toast.error("Failed to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <PharmacyLayout>
      <div className="container py-16">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Request a Price Quote</h1>
              <p className="text-sm text-muted-foreground">
                Can't find your medication in our catalog? Tell us what you need and we'll get back
                to you on WhatsApp with pricing and availability.
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="drug_name">Drug name</Label>
              <Input
                id="drug_name"
                required
                value={form.drug_name}
                onChange={(e) => updateField("drug_name", e.target.value)}
                placeholder="e.g. Keytruda"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="strength">Strength / dosage</Label>
              <Input
                id="strength"
                value={form.strength}
                onChange={(e) => updateField("strength", e.target.value)}
                placeholder="e.g. 100mg/4ml"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo">Upload a photo of the drug (optional)</Label>
              {photoPreview ? (
                <div className="relative w-32">
                  <img
                    src={photoPreview}
                    alt="Selected drug"
                    className="h-32 w-32 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo"
                  className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload photo</span>
                </label>
              )}
              <input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp_number">Your WhatsApp number</Label>
              <Input
                id="whatsapp_number"
                required
                value={form.whatsapp_number}
                onChange={(e) => updateField("whatsapp_number", e.target.value)}
                placeholder="e.g. 08012345678"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Uploading photo..." : "Submit request"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            You can also reach us directly on{" "}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              WhatsApp: {WHATSAPP_NUMBER}
            </a>
          </p>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default RequestQuote;
