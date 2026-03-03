import PhotoGallery from "./PhotoGallery";

interface GalleryImage {
  src: string;
  alt: string;
  captionJa?: string;
  captionEn?: string;
}

interface PhotoGalleryWrapperProps {
  images: GalleryImage[];
}

export default function PhotoGalleryWrapper({
  images,
}: PhotoGalleryWrapperProps) {
  if (!images.length) return null;
  return <PhotoGallery images={images} />;
}
