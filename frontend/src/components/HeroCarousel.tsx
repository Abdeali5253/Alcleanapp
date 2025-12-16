import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const heroImages = [
  {
    url: "https://alclean.pk/cdn/shop/files/alcl_2.jpg?v=1747822069&width=1500",
    title: "Premium Cleaning Solutions",
    subtitle: "Professional-grade products for your home",
  },
  {
    url: "https://alclean.pk/cdn/shop/files/alcl_3.jpg?v=1747822122&width=1500",
    title: "Sparkling Clean Spaces",
    subtitle: "Transform your home with AlClean",
  },
  {
    url: "https://alclean.pk/cdn/shop/files/alcl_1.jpg?v=1747822200&width=1500",
    title: "Professional Quality",
    subtitle: "Trusted by cleaning professionals",
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev - 1 + heroImages.length) % heroImages.length,
    );
  };

  return (
    <div className="relative w-full h-[280px] overflow-hidden rounded-2xl">
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-2xl mb-2">
              {image.title}
            </h2>
            <p className="text-white/90">{image.subtitle}</p>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-6"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}