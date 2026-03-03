import { getSiteData, getEnrichedNavigation } from "@/lib/data";

export default function SiteNav() {
  const { globalResources } = getSiteData();
  const nav = getEnrichedNavigation();

  // Nihongo handbook resource links
  const handbook = (globalResources.resourceBoxes || []).find(
    (rb) => rb.id === "nihongo-handbook"
  );
  const handbookLinks = handbook
    ? handbook.links.filter((l) => l.url)
    : [];

  return (
    <nav className="site-nav">
      <div className="site-nav__inner">
        <a href="/" className="site-nav__home">
          HOME
        </a>
        {nav.categories.map((cat) => (
          <div className="site-nav__group" key={cat.id}>
            <button className="site-nav__group-label">
              {cat.labelJa}{" "}
              <span className="site-nav__group-en">{cat.labelEn}</span>
            </button>
            <div className="site-nav__dropdown">
              {cat.items.map((it) => (
                <a className="nav-item" href={it.url} key={it.id}>
                  <span className="nav-item__title">{it.titleJa}</span>
                  <span className="nav-item__en">{it.titleEn}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
        {handbookLinks.length > 0 && handbook && (
          <div className="site-nav__group">
            <button className="site-nav__group-label">
              {handbook.titleJa}{" "}
              <span className="site-nav__group-en">
                Japanese Study &amp; Living Handbook
              </span>
            </button>
            <div className="site-nav__dropdown">
              {handbookLinks.map((l, i) => (
                <a
                  className="nav-item"
                  href={l.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={i}
                >
                  <span className="nav-item__title">{l.label}</span>
                  {l.subtitle && (
                    <span className="nav-item__en">{l.subtitle}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
