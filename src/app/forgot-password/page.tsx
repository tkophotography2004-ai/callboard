import ForgotPasswordForm from "./ui";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">Account</p>
      <h1 className="display mt-3 text-5xl">Forgot password</h1>
      <p className="mt-4 text-mist">
        Enter the email on your account. We will send a reset link if it matches.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
