export default function BrandMark({
  className = "",
  markClassName = "ml-0.5 text-[0.55em] font-sans font-normal tracking-normal align-super",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={className}>
      Scroll Call
      <sup className={markClassName}>®</sup>
    </span>
  );
}
