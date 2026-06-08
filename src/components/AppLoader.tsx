import { useEffect, useState } from "react";

/**
 * Playful, on-brand phrases shown while the app loads. Cycled one at a time.
 */
const FUN_WORDS = [
  "Warming up the hive…",
  "Buzzing into action…",
  "Gathering the nectar…",
  "Wrangling the worker bees…",
  "Pollinating your data…",
  "Tidying the honeycomb…",
  "Making things sweet…",
];

/**
 * Branded full-screen / inline loading indicator built around the Hive hub mark.
 *
 * Two concentric hexagonal "hub" arcs rotate in opposite directions over a soft
 * pulsing glow, giving a spinner that is unmistakably part of the brand instead
 * of a generic ring. Colours come from the theme tokens (`--accent`, `--bg-base`)
 * so it adapts to light/dark and any custom brand accent automatically.
 */
export function AppLoader({
  fullScreen = true,
  label,
  funWords = true,
}: {
  /** Cover the viewport with the app background. Set false to center within a parent. */
  fullScreen?: boolean;
  /** Fixed caption to show beneath the mark. Overrides the rotating fun words. */
  label?: string;
  /** Cycle playful loading phrases when no fixed `label` is provided. */
  funWords?: boolean;
}) {
  const showWords = funWords && !label;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!showWords) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % FUN_WORDS.length), 1600);
    return () => clearInterval(id);
  }, [showWords]);

  const caption = label ?? (showWords ? FUN_WORDS[index] : null);

  return (
    <div className={`app-loader${fullScreen ? " app-loader--full" : ""}`} role="status" aria-live="polite">
      <div className="app-loader__mark">
        <span className="app-loader__glow" aria-hidden="true" />
        <svg viewBox="0 0 93 105" fill="none" aria-hidden="true">
          <path
            className="app-loader__ring app-loader__ring--outer"
            d="M90.5908 27.4393L68.9146 14.9837L52.3073 5.35001C49.2043 3.54998 45.3748 3.54998 42.2718 5.35L25.6646 14.9837L9.01793 24.5491C5.90755 26.3364 3.99282 29.6528 4.00018 33.2401L4.03955 52.4393L4.00018 71.6384C3.99282 75.2257 5.90755 78.5421 9.01793 80.3294L25.6646 89.8949L42.2718 99.5285C45.3748 101.329 49.2043 101.329 52.3073 99.5285L68.9146 89.8949L90.5908 77.4393"
          />
          <path
            className="app-loader__ring app-loader__ring--inner"
            d="M76.9883 34.9393L61.9705 26.2203L52.0448 20.4029C48.9222 18.5727 45.0544 18.5727 41.9318 20.4029L32.006 26.2203L21.9791 32.0417C18.8906 33.8348 16.9927 37.1389 17 40.7102L17.0238 52.4393L17 64.1683C16.9927 67.7396 18.8906 71.0437 21.9791 72.8368L32.006 78.6582L41.9318 84.4757C45.0544 86.3058 48.9222 86.3058 52.0448 84.4757L61.9705 78.6582L76.9883 69.9393"
          />
        </svg>
      </div>
      {caption ? (
        <p key={caption} className="app-loader__label">{caption}</p>
      ) : (
        <span className="sr-only">Loading…</span>
      )}
    </div>
  );
}

export default AppLoader;
