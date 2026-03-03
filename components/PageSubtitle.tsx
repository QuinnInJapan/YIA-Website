interface PageSubtitleProps {
  ja: string;
  en?: string;
}

export default function PageSubtitle({ ja, en }: PageSubtitleProps) {
  return (
    <p className="page-subtitle">
      {ja}
      {en && <span className="page-subtitle__en"> {en}</span>}
    </p>
  );
}
