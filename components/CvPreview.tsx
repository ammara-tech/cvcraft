import { bulletsOf, dateRange, hasContent, linkLabel, newestFirst, type Cv, type Item } from "@/lib/cv";

/*
  The live preview: the CV drawn as a sheet of A4 paper, with the same layout, fonts and sizes as
  the PDF (lib/pdf.ts), so what you see is what you download. Sizes use container units
  (cqw: 1% of the sheet's width), so it shrinks to fit a phone and stays in proportion.
  It's always white paper, in light and dark mode, like the real thing.
*/

const PT = 100 / 595.28; // one PDF point, as a percentage of the sheet's width

export default function CvPreview({ cv, size = 10.5 }: { cv: Cv; size?: number }) {
  const t = cv.template;
  const serif = t === "classic";
  const accent = t === "modern" ? cv.accent : "#1a1a1f";
  const margin = (t === "compact" ? 34 : 44) * PT;
  const pt = (n: number) => `${n * PT}cqw`;
  const p = cv.person;
  const contacts = [p.email, p.phone, p.location, ...p.links.map(linkLabel)].map((c) => c.trim()).filter(Boolean);
  const headFont = serif ? "Georgia, 'Times New Roman', serif" : "Helvetica, Arial, sans-serif";

  const Heading = ({ children }: { children: string }) => (
    <h3
      style={{ fontFamily: headFont, fontSize: pt(size + 1), color: accent, borderBottom: `${t === "modern" ? 1 : 0.6}px solid ${t === "modern" ? accent : "#cdd0d6"}`, marginTop: pt(size * 1.4), paddingBottom: pt(2), fontWeight: 700 }}
    >
      {t === "classic" ? children : children.toUpperCase()}
    </h3>
  );

  const Entry = ({ item }: { item: Item }) => (
    <div style={{ marginTop: pt(size * 0.6) }}>
      <p style={{ display: "flex", justifyContent: "space-between", gap: pt(12) }}>
        <strong>{[item.title, t === "compact" ? item.org : ""].filter((s) => s.trim()).join(" · ") || item.org}</strong>
        <span style={{ color: "#555861", whiteSpace: "nowrap", fontSize: pt(size - 0.5) }}>{dateRange(item)}</span>
      </p>
      {[t === "compact" ? "" : item.org, item.place].some((s) => s.trim()) && <p style={{ color: "#555861" }}>{[t === "compact" ? "" : item.org, item.place].filter((s) => s.trim()).join(", ")}</p>}
      <ul>
        {bulletsOf(item).map((b, i) => (
          <li key={i} style={{ display: "flex", gap: pt(6) }}>
            <span aria-hidden="true" style={{ color: t === "modern" ? accent : undefined }}>
              •
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const Section = ({ title, items }: { title: string; items: Item[] }) => {
    const list = newestFirst(items).filter(hasContent);
    if (!list.length) return null;
    return (
      <section>
        <Heading>{title}</Heading>
        {list.map((i) => (
          <Entry key={i.id} item={i} />
        ))}
      </section>
    );
  };

  const certs = cv.certifications.map((c) => c.trim()).filter(Boolean);

  return (
    <div className="paper w-full rounded-sm" style={{ containerType: "inline-size" }}>
      <div style={{ aspectRatio: "595.28 / 841.89", padding: `${margin}cqw`, fontFamily: "Helvetica, Arial, sans-serif", fontSize: pt(size), lineHeight: 1.35 }}>
        <div style={{ textAlign: serif ? "center" : "left" }}>
          <h2 style={{ fontFamily: headFont, fontSize: pt(t === "compact" ? 19 : 23), fontWeight: 700, color: t === "modern" ? accent : "#1a1a1f", lineHeight: 1.15 }}>{p.name.trim() || "Your name"}</h2>
          {p.headline.trim() && <p style={{ fontFamily: headFont, fontSize: pt(size + 1.5), color: "#555861", marginTop: pt(3) }}>{p.headline}</p>}
          {contacts.length > 0 && (
            <p style={{ fontSize: pt(size - 0.5), color: t === "modern" ? accent : "#555861", marginTop: pt(4) }}>
              {contacts.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: "#c9ccd2" }}> | </span>}
                  {c}
                </span>
              ))}
            </p>
          )}
        </div>
        {cv.summary.trim() && (
          <section>
            <Heading>Profile</Heading>
            <p style={{ marginTop: pt(4) }}>{cv.summary}</p>
          </section>
        )}
        <Section title="Experience" items={cv.experience} />
        <Section title="Projects" items={cv.projects} />
        <Section title="Education" items={cv.education} />
        {cv.skills.length > 0 && (
          <section>
            <Heading>Skills</Heading>
            {t === "compact" ? (
              <p style={{ marginTop: pt(4) }}>{cv.skills.join(" · ")}</p>
            ) : (
              <ul style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginTop: pt(4) }}>
                {cv.skills.map((s) => (
                  <li key={s} style={{ display: "flex", gap: pt(6) }}>
                    <span aria-hidden="true" style={{ color: t === "modern" ? accent : undefined }}>
                      •
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {certs.length > 0 && (
          <section>
            <Heading>Certifications</Heading>
            <ul style={{ marginTop: pt(4) }}>
              {certs.map((c, i) => (
                <li key={i} style={{ display: "flex", gap: pt(6) }}>
                  <span aria-hidden="true">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}
        {cv.references.trim() && (
          <section>
            <Heading>References</Heading>
            <p style={{ marginTop: pt(4) }}>{cv.references}</p>
          </section>
        )}
      </div>
    </div>
  );
}
