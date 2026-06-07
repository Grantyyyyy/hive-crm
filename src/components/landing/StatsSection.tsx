import type { LandingTheme } from "./types";

interface StatsSectionProps {
  theme: LandingTheme;
}

const steps = [
  {
    num: "1",
    title: "Sign up free",
    desc: "Create your account in under a minute. No credit card and no setup fees to get going.",
  },
  {
    num: "2",
    title: "Add your info",
    desc: "Pop in your customers and products — or import them straight from a spreadsheet in a few clicks.",
  },
  {
    num: "3",
    title: "You're organized",
    desc: "That's it. Run your whole day from one simple screen that everyone on your team understands.",
  },
];

export function StatsSection({ theme }: StatsSectionProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const subColor = isDark ? "text-slate-400" : "text-slate-600";

  return (
    <section className={`py-16 lg:py-24 border-t ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12 space-y-4">
          <p className="text-sm font-bold uppercase tracking-wide text-accent">Up and running fast</p>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${textColor}`}>
            Get started in 3 easy steps
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center text-xl font-extrabold">
                {step.num}
              </div>
              <h3 className={`text-xl font-bold ${textColor}`}>{step.title}</h3>
              <p className={`text-base leading-relaxed max-w-xs mx-auto ${subColor}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
