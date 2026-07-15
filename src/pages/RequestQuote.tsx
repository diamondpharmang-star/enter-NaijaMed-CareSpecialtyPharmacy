import { useState } from "react";
import { Loader2, MessageCircle, Upload, X, Pill, Camera, Send, ShieldCheck, Clock, Sparkles } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/lib/pharmacy";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUOTE_PHOTO_BUCKET = "quote-photos";
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

const STEPS = [
  {
    icon: Pill,
    title: "Tell us the medication",
    desc: "Enter the drug name and strength you're looking for.",
  },
  {
    icon: Camera,
    title: "Add a photo (optional)",
    desc: "A picture of the pack or prescription helps us quote accurately.",
  },
  {
    icon: Send,
    title: "Get your quote on WhatsApp",
    desc: "Our pharmacist team replies with pricing and availability.",
  },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Sourced from licensed distributors" },
  { icon: Clock, text: "Replies within a few hours" },
  { icon: Sparkles, text: "No obligation to purchase" },
];

const RequestQuote = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    drug_name: "",
    strength: "",
    whatsapp_number: "",
  });

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validateAndSetFile = (file: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
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
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="container relative z-10 flex flex-col items-start gap-4 py-16 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1 text-sm font-medium backdrop-blur">
            <MessageCircle className="h-3.5 w-3.5" /> Personalized sourcing service
          </span>
          <h1 className="max-w-xl text-3xl font-bold leading-tight md:text-4xl">
            Can't find your medication? Request a quote.
          </h1>
          <p className="max-w-lg text-primary-foreground/85">
            Tell us the drug name and strength — with a photo if you have one — and our pharmacist
            team will reply on WhatsApp with pricing and availability.
          </p>
        </div>
      </section>

      <div className="container -mt-10 pb-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left info panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <h2 className="text-base font-semibold text-foreground">How it works</h2>
              <ol className="mt-5 space-y-5">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <step.icon className="h-4.5 w-4.5" />
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-6">
              <ul className="space-y-3">
                {TRUST_POINTS.map((point) => (
                  <li key={point.text} className="flex items-center gap-3 text-sm text-foreground">
                    <point.icon className="h-4 w-4 shrink-0 text-accent" />
                    {point.text}
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-sm text-muted-foreground">Prefer to chat directly?</p>
                <Button asChild variant="secondary" className="mt-3 w-full">
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp: {WHATSAPP_NUMBER}
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">Request details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fields marked with an asterisk are required.
              </p>

              <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="drug_name">Drug name *</Label>
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="photo">Photo of the drug or prescription (optional)</Label>
                  {photoPreview ? (
                    <div className="relative w-full max-w-xs overflow-hidden rounded-xl border border-border">
                      <img src={photoPreview} alt="Selected drug" className="h-48 w-full object-cover" />
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background backdrop-blur transition-colors hover:bg-destructive"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "flex h-40 w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors",
                        isDragging
                          ? "border-primary bg-secondary/60 text-primary"
                          : "border-input hover:border-primary hover:bg-secondary/30 hover:text-primary"
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <Upload className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-sm font-medium">Click or drag a photo here</span>
                      <span className="text-xs">JPG, PNG, WEBP up to {MAX_FILE_SIZE_MB}MB</span>
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
                  <Label htmlFor="whatsapp_number">Your WhatsApp number *</Label>
                  <Input
                    id="whatsapp_number"
                    required
                    value={form.whatsapp_number}
                    onChange={(e) => updateField("whatsapp_number", e.target.value)}
                    placeholder="e.g. 08012345678"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send your quote to this number — no spam, ever.
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? "Uploading photo..." : "Submit request"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default RequestQuote;
