import { ChevronDown } from "lucide-react";
import type { LandingTheme } from "./types";

interface FaqSectionProps {
  theme: LandingTheme;
  activeFaq: number | null;
  onToggleFaq: (index: number) => void;
}

const faqs = [
  {
    q: "Do I need to be good with computers?",
    a: "Not at all. Hive is built for everyday people, not techies. If you can send an email, you'll feel right at home — and most folks are up and running on their first day.",
  },
  {
    q: "Can I bring my existing customer list?",
    a: "Yes. You can import your customers and products straight from a spreadsheet in just a few clicks, so you don't have to start from scratch.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "Nothing scary. We'll let you know before it ends, and you can choose a paid plan or keep using the free version. We never charge you by surprise.",
  },
  {
    q: "Is my business information safe?",
    a: "Absolutely. Your data is private to your business and protected, and you decide who on your team can see what. We take keeping it safe seriously.",
  },
  {
    q: "Can my whole team use it?",
    a: "Yes. Invite your team and everyone works from the same up-to-date information, so you're all on the same page.",
  },
  {
    q: "What if I get stuck?",
    a: "We're here to help. Reach out any time and a real person will walk you through it — no confusing tech-speak.",
  },
];

export function FaqSection({ theme, activeFaq, onToggleFaq }: FaqSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-16 lg:py-24 border-t ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
      <div className="max-w-3xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Questions? We've got answers
          </h2>
          <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Everything you might be wondering before you give Hive a try.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
            >
              <button
                onClick={() => onToggleFaq(i)}
                className={`w-full flex items-center justify-between gap-4 p-5 text-left transition-colors ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                  }`}
              >
                <span className={`text-base sm:text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform ${activeFaq === i ? "rotate-180" : ""} ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
              </button>
              {activeFaq === i && (
                <div className={`px-5 pb-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  <p className="text-base leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
