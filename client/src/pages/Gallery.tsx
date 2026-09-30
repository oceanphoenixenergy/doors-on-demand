import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImageIcon, Sparkles, Play, Star, MapPin, MessageSquareQuote } from "lucide-react";
import { useState, useRef } from "react";
import type { GalleryItem, Testimonial } from "@shared/schema";

function VideoPlayer({ src, label, testId }: { src: string; label: string; testId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function handleToggle() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div className="relative cursor-pointer" onClick={handleToggle}>
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-[3/4] object-cover"
        playsInline
        muted
        loop
        preload="metadata"
        data-testid={testId}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-white/90 rounded-full p-3">
            <Play className="h-6 w-6 text-[hsl(193,100%,35%)] fill-[hsl(193,100%,35%)]" />
          </div>
        </div>
      )}
      <span className={`absolute bottom-2 ${label === "Before" ? "left-2" : "right-2"} ${label === "Before" ? "bg-black/60" : "bg-[hsl(193,100%,35%)]/80"} text-white text-xs font-medium px-2 py-1 rounded-md`}>
        {label}
      </span>
    </div>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const isVideo = item.mediaType === "video";

  return (
    <Card
      className="overflow-visible"
      data-testid={`card-gallery-${item.id}`}
    >
      <CardContent className="p-0">
        <div className="flex rounded-t-xl overflow-hidden">
          <div className="w-1/2 relative">
            {isVideo ? (
              <VideoPlayer
                src={item.beforeImagePath}
                label="Before"
                testId={`video-before-${item.id}`}
              />
            ) : (
              <>
                <img
                  src={item.beforeImagePath}
                  alt={`Before - ${item.caption}`}
                  className="w-full aspect-[3/4] object-cover"
                  data-testid={`img-before-${item.id}`}
                />
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md">
                  Before
                </span>
              </>
            )}
          </div>
          <div className="w-1/2 relative">
            {isVideo ? (
              <VideoPlayer
                src={item.afterImagePath}
                label="After"
                testId={`video-after-${item.id}`}
              />
            ) : (
              <>
                <img
                  src={item.afterImagePath}
                  alt={`After - ${item.caption}`}
                  className="w-full aspect-[3/4] object-cover"
                  data-testid={`img-after-${item.id}`}
                />
                <span className="absolute bottom-2 right-2 bg-[hsl(193,100%,35%)]/80 text-white text-xs font-medium px-2 py-1 rounded-md">
                  After
                </span>
              </>
            )}
          </div>
        </div>
        <div className="p-4">
          <p
            className="font-medium text-foreground"
            data-testid={`text-caption-${item.id}`}
          >
            {item.caption}
          </p>
          {item.location && (
            <p
              className="text-sm text-muted-foreground mt-1"
              data-testid={`text-location-${item.id}`}
            >
              {item.location}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <Card
      className="bg-card border border-border"
      data-testid={`card-testimonial-${item.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= item.starRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
              data-testid={`star-${item.id}-${star}`}
            />
          ))}
        </div>
        <p
          className="text-foreground/80 leading-relaxed italic mb-4"
          data-testid={`text-testimonial-quote-${item.id}`}
        >
          "{item.text}"
        </p>
        <div>
          <p
            className="font-semibold text-foreground text-sm"
            data-testid={`text-testimonial-name-${item.id}`}
          >
            {item.customerName}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {item.location && (
              <p
                className="text-xs text-muted-foreground flex items-center gap-1"
                data-testid={`text-testimonial-location-${item.id}`}
              >
                <MapPin className="w-3 h-3" />
                {item.location}
              </p>
            )}
            {item.jobDate && (
              <p className="text-xs text-muted-foreground">{item.jobDate}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Gallery() {
  const { data: items, isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
  });

  const { data: testimonialItems, isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  const hasTestimonials = testimonialItems && testimonialItems.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[hsl(193,100%,35%)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-white/80 hover-elevate mb-4 -ml-2"
              data-testid="link-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center pb-6">
            <h1
              className="text-3xl md:text-4xl font-bold mb-3"
              data-testid="text-gallery-title"
            >
              Our Transformations
            </h1>
            <p
              className="text-white/80 text-lg max-w-2xl mx-auto"
              data-testid="text-gallery-subtitle"
            >
              See how we've transformed homes across the West Midlands with beautiful oak doors
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-1/2 aspect-[3/4] bg-muted" />
                    <div className="w-1/2 aspect-[3/4] bg-muted/70" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2
              className="text-xl font-semibold text-foreground mb-2"
              data-testid="text-gallery-empty"
            >
              Gallery Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Check back for our latest transformations! We're adding photos of our recent door fitting projects.
            </p>
          </div>
        )}

        {(hasTestimonials || testimonialsLoading) && (
          <div className="mt-16" data-testid="section-testimonials">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquareQuote className="h-5 w-5 text-[hsl(193,100%,35%)]" />
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-testimonials-title">
                What Our Customers Say
              </h2>
            </div>
            <p className="text-muted-foreground mb-8">
              Don't just take our word for it — here's what homeowners across the West Midlands have to say.
            </p>

            {testimonialsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => <div key={s} className="w-4 h-4 bg-muted rounded-full" />)}
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-4/5" />
                        <div className="h-3 bg-muted rounded w-3/5" />
                      </div>
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonialItems!.map((item) => (
                  <TestimonialCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-16 mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[hsl(193,100%,35%)]" />
            <p className="text-muted-foreground font-medium">
              Ready to transform your home?
            </p>
          </div>
          <Link href="/">
            <Button
              className="bg-[hsl(193,100%,35%)] text-white"
              data-testid="button-get-quote"
            >
              Get Your Free Quote
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
