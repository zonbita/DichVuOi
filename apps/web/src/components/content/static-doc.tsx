import { Link } from 'react-router-dom';

export type DocSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
};

export type DocContent = {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  sections: DocSection[];
};

type Props = {
  doc: DocContent;
};

export function StaticDoc({ doc }: Props) {
  return (
    <div className="space-y-6 pb-6">
      <nav className="text-sm text-[var(--color-muted)]">
        <Link to="/" className="hover:text-[var(--color-brand-deep)]">
          Trang chủ
        </Link>{' '}
        / <span className="text-[var(--color-ink)]">{doc.title}</span>
      </nav>

      <header className="border border-[var(--color-line)] bg-white px-6 py-7 shadow-sm sm:px-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{doc.title}</h1>
        {doc.subtitle ? (
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--color-muted)] sm:text-base">
            {doc.subtitle}
          </p>
        ) : null}
        {doc.updatedAt ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">Cập nhật: {doc.updatedAt}</p>
        ) : null}
      </header>

      <div className="space-y-4">
        {doc.sections.map((section) => (
          <section
            key={section.heading}
            className="border border-[var(--color-line)] bg-white px-6 py-5 shadow-sm sm:px-8"
          >
            <h2 className="text-lg font-extrabold sm:text-xl">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink)]">
                {p}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[var(--color-ink)]">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.steps && section.steps.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {section.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand-deep)]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
