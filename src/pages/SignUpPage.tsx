import { SignUp } from "@clerk/clerk-react";

export function SignUpPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/40 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <SignUp routing="hash" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard" />
      </div>
    </div>
  );
}
