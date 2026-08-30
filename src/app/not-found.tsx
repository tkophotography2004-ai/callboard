import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-5xl">Not on the board</h1>
      <Link href="/" className="btn-copper mt-8">
        Home
      </Link>
    </div>
  );
}
