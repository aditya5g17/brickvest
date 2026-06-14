function PageHeader({ eyebrow, title, description, action }) {
  return (
    <section className="border-b border-[var(--border)] bg-white">
      <div className="page-container flex flex-col gap-4 py-10 md:flex-row md:items-end md:justify-between md:py-12">
        <div>
          {eyebrow && (
            <span className="badge badge-gold mb-3 inline-flex">{eyebrow}</span>
          )}
          <div className="divider-gold mb-4" />
          <h1 className="heading-section">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
    </section>
  );
}

export default PageHeader;
