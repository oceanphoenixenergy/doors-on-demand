import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import type { GalleryItem, Testimonial } from "@shared/schema";
import { LogOut, Loader2, Trash2, Upload, ImageIcon, MapPin, Video, Image, Star, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, X, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" data-testid="input-star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          data-testid={`button-star-${star}`}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${star <= value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({ item, onDelete, onToggleVisible, onMoveUp, onMoveDown, isFirst, isLast }: {
  item: Testimonial;
  onDelete: () => void;
  onToggleVisible: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.customerName);
  const [editText, setEditText] = useState(item.text);
  const [editRating, setEditRating] = useState(item.starRating);
  const [editLocation, setEditLocation] = useState(item.location || "");
  const [editJobDate, setEditJobDate] = useState(item.jobDate || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/admin/testimonials/${item.id}`, {
        customerName: editName,
        text: editText,
        starRating: editRating,
        location: editLocation || null,
        jobDate: editJobDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setEditing(false);
    },
  });

  return (
    <Card data-testid={`card-testimonial-${item.id}`} className={!item.isVisible ? "opacity-60" : ""}>
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`edit-name-${item.id}`}>Customer Name</Label>
                <Input
                  id={`edit-name-${item.id}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  data-testid={`input-edit-name-${item.id}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`edit-location-${item.id}`}>Location</Label>
                <Input
                  id={`edit-location-${item.id}`}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  data-testid={`input-edit-location-${item.id}`}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Star Rating</Label>
              <StarRatingInput value={editRating} onChange={setEditRating} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`edit-text-${item.id}`}>Testimonial</Label>
              <Textarea
                id={`edit-text-${item.id}`}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                data-testid={`input-edit-text-${item.id}`}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`edit-date-${item.id}`}>Job Date (optional)</Label>
              <Input
                id={`edit-date-${item.id}`}
                value={editJobDate}
                onChange={(e) => setEditJobDate(e.target.value)}
                placeholder="e.g. March 2025"
                data-testid={`input-edit-date-${item.id}`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !editName.trim() || !editText.trim()}
                style={{ backgroundColor: "hsl(193 100% 45%)" }}
                data-testid={`button-save-${item.id}`}
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} data-testid={`button-cancel-edit-${item.id}`}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground" data-testid={`text-testimonial-name-${item.id}`}>{item.customerName}</span>
                  {!item.isVisible && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= item.starRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic line-clamp-2" data-testid={`text-testimonial-quote-${item.id}`}>"{item.text}"</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {item.location && <span data-testid={`text-testimonial-location-${item.id}`}><MapPin className="w-3 h-3 inline mr-1" />{item.location}</span>}
                  {item.jobDate && <span>{item.jobDate}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={isFirst} data-testid={`button-move-up-${item.id}`}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={isLast} data-testid={`button-move-down-${item.id}`}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleVisible} title={item.isVisible ? "Hide" : "Show"} data-testid={`button-toggle-visible-${item.id}`}>
                    {item.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)} data-testid={`button-edit-${item.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" data-testid={`button-delete-testimonial-${item.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this testimonial from {item.customerName}? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete-testimonial">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete-testimonial">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminGallery() {
  const [, setLocation] = useLocation();
  const [caption, setCaption] = useState("");
  const [location, setLocationVal] = useState("");
  const [beforePath, setBeforePath] = useState("");
  const [afterPath, setAfterPath] = useState("");
  const [beforePreview, setBeforePreview] = useState("");
  const [afterPreview, setAfterPreview] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const [tName, setTName] = useState("");
  const [tText, setTText] = useState("");
  const [tRating, setTRating] = useState(5);
  const [tLocation, setTLocation] = useState("");
  const [tJobDate, setTJobDate] = useState("");

  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: items, isLoading: itemsLoading } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
    enabled: auth?.authenticated === true,
  });

  const { data: testimonialItems, isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    enabled: auth?.authenticated === true,
  });

  const { uploadFile: uploadBefore, isUploading: isUploadingBefore } = useUpload();
  const { uploadFile: uploadAfter, isUploading: isUploadingAfter } = useUpload();

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/gallery", {
        caption,
        location: location || null,
        beforeImagePath: beforePath,
        afterImagePath: afterPath,
        mediaType,
        sortOrder: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setCaption("");
      setLocationVal("");
      setBeforePath("");
      setAfterPath("");
      setBeforePreview("");
      setAfterPreview("");
      setMediaType("image");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/testimonials", {
        customerName: tName,
        text: tText,
        starRating: tRating,
        location: tLocation || null,
        jobDate: tJobDate || null,
        isVisible: true,
        sortOrder: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setTName("");
      setTText("");
      setTRating(5);
      setTLocation("");
      setTJobDate("");
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/testimonials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] }),
  });

  const toggleVisibleMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      apiRequest("PATCH", `/api/admin/testimonials/${id}`, { isVisible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      apiRequest("PATCH", `/api/admin/testimonials/${id}`, { sortOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] }),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!auth?.authenticated) {
    setLocation("/admin");
    return null;
  }

  async function handleLogout() {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin");
  }

  async function handleBeforeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBeforePreview(URL.createObjectURL(file));
    const result = await uploadBefore(file);
    if (result) {
      setBeforePath(result.objectPath);
    }
  }

  async function handleAfterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAfterPreview(URL.createObjectURL(file));
    const result = await uploadAfter(file);
    if (result) {
      setAfterPath(result.objectPath);
    }
  }

  function handleMoveUp(index: number) {
    if (!testimonialItems || index === 0) return;
    const current = testimonialItems[index];
    const prev = testimonialItems[index - 1];
    reorderMutation.mutate({ id: current.id, sortOrder: prev.sortOrder });
    reorderMutation.mutate({ id: prev.id, sortOrder: current.sortOrder });
  }

  function handleMoveDown(index: number) {
    if (!testimonialItems || index === testimonialItems.length - 1) return;
    const current = testimonialItems[index];
    const next = testimonialItems[index + 1];
    reorderMutation.mutate({ id: current.id, sortOrder: next.sortOrder });
    reorderMutation.mutate({ id: next.id, sortOrder: current.sortOrder });
  }

  const acceptType = mediaType === "video" ? "video/*" : "image/*";
  const canSubmit = caption.trim() && beforePath && afterPath && !createMutation.isPending;
  const canSubmitTestimonial = tName.trim() && tText.trim() && !createTestimonialMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-semibold" style={{ color: "hsl(193 100% 45%)" }}>
            Doors On Demand Admin
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/pipeline">
              <Button variant="ghost" size="sm" data-testid="link-pipeline">Pipeline</Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-customers">Customers</Button>
            </Link>
            <Link href="/admin/calendar">
              <Button variant="ghost" size="sm" data-testid="link-calendar">Calendar</Button>
            </Link>
            <Link href="/admin/campaigns">
              <Button variant="ghost" size="sm" data-testid="link-campaigns">Campaigns</Button>
            </Link>
            <Link href="/admin/templates">
              <Button variant="ghost" size="sm" data-testid="link-templates">Templates</Button>
            </Link>
            <Link href="/admin/gallery">
              <Button variant="ghost" size="sm" data-testid="link-gallery">Gallery</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <h2 className="text-xl font-semibold" data-testid="text-gallery-heading">Gallery Management</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Gallery Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-2">
              <Button
                variant={mediaType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => { setMediaType("image"); setBeforePath(""); setAfterPath(""); setBeforePreview(""); setAfterPreview(""); }}
                className={mediaType === "image" ? "bg-[hsl(193,100%,35%)]" : ""}
                data-testid="button-type-image"
              >
                <Image className="w-4 h-4 mr-1" />
                Photos
              </Button>
              <Button
                variant={mediaType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => { setMediaType("video"); setBeforePath(""); setAfterPath(""); setBeforePreview(""); setAfterPreview(""); }}
                className={mediaType === "video" ? "bg-[hsl(193,100%,35%)]" : ""}
                data-testid="button-type-video"
              >
                <Video className="w-4 h-4 mr-1" />
                Videos
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption *</Label>
                <Input
                  id="caption"
                  placeholder="e.g. Oak door transformation"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  data-testid="input-caption"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Sutton Coldfield"
                  value={location}
                  onChange={(e) => setLocationVal(e.target.value)}
                  data-testid="input-location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Before {mediaType === "video" ? "Video" : "Image"} *</Label>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept={acceptType}
                  className="hidden"
                  onChange={handleBeforeFile}
                  data-testid="input-before-file"
                />
                {beforePreview ? (
                  <div
                    className="relative rounded-md overflow-hidden border cursor-pointer"
                    onClick={() => beforeInputRef.current?.click()}
                  >
                    {mediaType === "video" ? (
                      <video
                        src={beforePreview}
                        className="w-full aspect-[4/3] object-cover"
                        muted
                        playsInline
                        data-testid="preview-before-video"
                      />
                    ) : (
                      <img
                        src={beforePreview}
                        alt="Before preview"
                        className="w-full aspect-[4/3] object-cover"
                        data-testid="img-before-preview"
                      />
                    )}
                    {isUploadingBefore && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md">
                      Before
                    </span>
                  </div>
                ) : (
                  <div
                    className="border border-dashed rounded-md flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover-elevate"
                    onClick={() => beforeInputRef.current?.click()}
                    data-testid="button-upload-before"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Choose before {mediaType === "video" ? "video" : "image"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>After {mediaType === "video" ? "Video" : "Image"} *</Label>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept={acceptType}
                  className="hidden"
                  onChange={handleAfterFile}
                  data-testid="input-after-file"
                />
                {afterPreview ? (
                  <div
                    className="relative rounded-md overflow-hidden border cursor-pointer"
                    onClick={() => afterInputRef.current?.click()}
                  >
                    {mediaType === "video" ? (
                      <video
                        src={afterPreview}
                        className="w-full aspect-[4/3] object-cover"
                        muted
                        playsInline
                        data-testid="preview-after-video"
                      />
                    ) : (
                      <img
                        src={afterPreview}
                        alt="After preview"
                        className="w-full aspect-[4/3] object-cover"
                        data-testid="img-after-preview"
                      />
                    )}
                    {isUploadingAfter && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-[hsl(193,100%,35%)]/80 text-white text-xs font-medium px-2 py-1 rounded-md">
                      After
                    </span>
                  </div>
                ) : (
                  <div
                    className="border border-dashed rounded-md flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover-elevate"
                    onClick={() => afterInputRef.current?.click()}
                    data-testid="button-upload-after"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Choose after {mediaType === "video" ? "video" : "image"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              disabled={!canSubmit}
              onClick={() => createMutation.mutate()}
              style={{ backgroundColor: "hsl(193 100% 45%)" }}
              data-testid="button-submit-gallery"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Add Gallery Item
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold" data-testid="text-existing-items">Existing Items</h3>

          {itemsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-visible" data-testid={`card-gallery-item-${item.id}`}>
                  <CardContent className="p-0">
                    <div className="flex rounded-t-xl overflow-hidden">
                      <div className="w-1/2 relative">
                        {item.mediaType === "video" ? (
                          <video
                            src={item.beforeImagePath}
                            className="w-full aspect-[3/4] object-cover"
                            muted
                            playsInline
                            data-testid={`video-item-before-${item.id}`}
                          />
                        ) : (
                          <img
                            src={item.beforeImagePath}
                            alt={`Before - ${item.caption}`}
                            className="w-full aspect-[3/4] object-cover"
                            data-testid={`img-item-before-${item.id}`}
                          />
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md">
                          Before
                        </span>
                      </div>
                      <div className="w-1/2 relative">
                        {item.mediaType === "video" ? (
                          <video
                            src={item.afterImagePath}
                            className="w-full aspect-[3/4] object-cover"
                            muted
                            playsInline
                            data-testid={`video-item-after-${item.id}`}
                          />
                        ) : (
                          <img
                            src={item.afterImagePath}
                            alt={`After - ${item.caption}`}
                            className="w-full aspect-[3/4] object-cover"
                            data-testid={`img-item-after-${item.id}`}
                          />
                        )}
                        <span className="absolute bottom-2 right-2 bg-[hsl(193,100%,35%)]/80 text-white text-xs font-medium px-2 py-1 rounded-md">
                          After
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground" data-testid={`text-item-caption-${item.id}`}>
                            {item.caption}
                          </p>
                          {item.mediaType === "video" && (
                            <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        {item.location && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1" data-testid={`text-item-location-${item.id}`}>
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </p>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive shrink-0"
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Gallery Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.caption}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-testid="button-confirm-delete"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground" data-testid="text-no-items">No gallery items yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold" data-testid="text-testimonials-heading">Testimonials</h3>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Testimonial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="t-name">Customer Name *</Label>
                  <Input
                    id="t-name"
                    placeholder="e.g. Sarah M."
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    data-testid="input-testimonial-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-location">Location</Label>
                  <Input
                    id="t-location"
                    placeholder="e.g. Solihull"
                    value={tLocation}
                    onChange={(e) => setTLocation(e.target.value)}
                    data-testid="input-testimonial-location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Star Rating</Label>
                <StarRatingInput value={tRating} onChange={setTRating} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="t-text">Testimonial *</Label>
                <Textarea
                  id="t-text"
                  placeholder="What did the customer say?"
                  value={tText}
                  onChange={(e) => setTText(e.target.value)}
                  rows={3}
                  data-testid="input-testimonial-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="t-date">Job Date (optional)</Label>
                <Input
                  id="t-date"
                  placeholder="e.g. March 2025"
                  value={tJobDate}
                  onChange={(e) => setTJobDate(e.target.value)}
                  data-testid="input-testimonial-date"
                />
              </div>

              <Button
                disabled={!canSubmitTestimonial}
                onClick={() => createTestimonialMutation.mutate()}
                style={{ backgroundColor: "hsl(193 100% 45%)" }}
                data-testid="button-submit-testimonial"
              >
                {createTestimonialMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Add Testimonial
              </Button>
            </CardContent>
          </Card>

          {testimonialsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : testimonialItems && testimonialItems.length > 0 ? (
            <div className="space-y-3">
              {testimonialItems.map((item, index) => (
                <TestimonialCard
                  key={item.id}
                  item={item}
                  onDelete={() => deleteTestimonialMutation.mutate(item.id)}
                  onToggleVisible={() => toggleVisibleMutation.mutate({ id: item.id, isVisible: !item.isVisible })}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === testimonialItems.length - 1}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground" data-testid="text-no-testimonials">No testimonials yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
