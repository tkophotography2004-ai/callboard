/**
 * Reusable "you agree to the Terms" line for any payment / subscription flow.
 * Place it directly above the button that sends the user to Stripe.
 */
export default function TermsNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-mist ${className}`}>
      By continuing you agree to the{" "}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-copper-300 underline underline-offset-2 hover:text-copper-200"
      >
        Terms
      </a>
      .
    </p>
  );
}

export { TermsNotice };
