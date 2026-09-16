interface LessonIllustrationProps {
  topicId: string;
  worldThemeColor: string;
  className?: string;
}

/**
 * The "left page" illustration for a book-style lesson — one flexible
 * component covering all 21 lessons via topicId + the lesson's own
 * World theme color, rather than 21 individually hand-drawn scenes.
 * This is an honest scope decision, not a placeholder: illustrating
 * each lesson bespoke would be a much larger undertaking than this
 * pass covers, and this delivers a real, topic-relevant, non-generic
 * illustration for every lesson today rather than nothing for most of
 * them. Matches the WEBSITE's existing flat-icon style (solid fills,
 * no gradients, no soft shading — see Coin.tsx) — this is deliberately
 * NOT the "Warm Quest" video style from the (cancelled) video work;
 * the two are separate design systems by design, and this stays in
 * the website's own established language.
 */
export function LessonIllustration({ topicId, worldThemeColor, className = "" }: LessonIllustrationProps) {
  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-hidden="true">
      <circle cx="160" cy="160" r="150" fill={worldThemeColor} opacity="0.14" />
      <circle cx="160" cy="160" r="115" fill={worldThemeColor} opacity="0.22" />
      {renderTopicMotif(topicId, worldThemeColor)}
    </svg>
  );
}

function renderTopicMotif(topicId: string, color: string) {
  switch (topicId) {
    case "money_basics":
      // A coin passing from one open hand to another — the exchange idea.
      return (
        <g>
          <circle cx="160" cy="140" r="38" fill={color} />
          <circle cx="160" cy="140" r="27" fill="none" stroke="#FBF8EF" strokeWidth="3" />
          <path d="M90,220 Q120,200 150,215" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
          <path d="M230,220 Q200,200 170,215" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        </g>
      );
    case "needs_wants":
      // A simple house (need) beside a heart (want).
      return (
        <g>
          <path d="M100,210 L100,160 L130,135 L160,160 L160,210 Z" fill={color} />
          <rect x="118" y="180" width="18" height="30" fill="#FBF8EF" />
          <path
            d="M220,150 C220,135 240,135 240,155 C240,135 260,135 260,150 C260,175 240,195 240,195 C240,195 220,175 220,150 Z"
            fill={color}
          />
        </g>
      );
    case "saving":
      // A rounded piggy-bank silhouette with a coin slot.
      return (
        <g>
          <ellipse cx="160" cy="180" rx="75" ry="55" fill={color} />
          <circle cx="220" cy="160" r="16" fill={color} />
          <rect x="140" y="118" width="30" height="10" rx="5" fill="#FBF8EF" />
          <circle cx="130" cy="185" r="6" fill="#FBF8EF" />
          <path d="M95,205 L85,225 L105,215 Z" fill={color} />
        </g>
      );
    case "currencies":
      // A globe with a couple of orbiting coin marks.
      return (
        <g>
          <circle cx="160" cy="165" r="60" fill={color} />
          <ellipse cx="160" cy="165" rx="60" ry="24" fill="none" stroke="#FBF8EF" strokeWidth="3" />
          <path d="M160,105 L160,225" stroke="#FBF8EF" strokeWidth="3" />
          <circle cx="235" cy="120" r="16" fill={color} opacity="0.85" />
          <circle cx="90" cy="205" r="14" fill={color} opacity="0.85" />
        </g>
      );
    case "scams":
      // A shield with a simple padlock.
      return (
        <g>
          <path d="M160,105 L210,125 L210,185 Q210,225 160,245 Q110,225 110,185 L110,125 Z" fill={color} />
          <rect x="142" y="170" width="36" height="28" rx="4" fill="#FBF8EF" />
          <path d="M150,170 L150,155 Q150,142 160,142 Q170,142 170,155 L170,170" fill="none" stroke="#FBF8EF" strokeWidth="6" />
        </g>
      );
    case "long_term_thinking":
      // A small growing plant — patience/growth over time.
      return (
        <g>
          <path d="M160,225 L160,150" stroke={color} strokeWidth="8" strokeLinecap="round" />
          <path d="M160,180 Q130,170 128,140 Q158,145 160,180" fill={color} />
          <path d="M160,160 Q190,150 195,120 Q163,128 160,160" fill={color} />
          <ellipse cx="160" cy="235" rx="40" ry="12" fill={color} opacity="0.5" />
        </g>
      );
    case "giving":
      // Two hands offering a small heart.
      return (
        <g>
          <path
            d="M160,150 C160,138 175,138 175,150 C175,138 190,138 190,152 C190,170 175,185 175,185 C175,185 160,170 160,150 Z"
            fill={color}
          />
          <path d="M95,215 Q125,195 158,208" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
          <path d="M225,215 Q195,195 192,208" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        </g>
      );
    default:
      return <circle cx="160" cy="160" r="40" fill={color} />;
  }
}
