import { useEffect } from 'react';
import { loadingDone } from '../loading';
import { buildings } from '../world/config';
import { isOpen, mediaUrl, place, site } from '../content';
import StationBody from './RichText';

/** Version texte du portfolio, générée depuis le même contenu que la ville 3D. */
export default function ReadableVersion() {
  // Version texte : pas de 3D à construire, la page de chargement s'efface tout de suite.
  useEffect(() => loadingDone(), []);
  const { contact } = site;
  const contacts = [
    contact.email && { label: contact.email, href: `mailto:${contact.email}` },
    contact.linkedin && { label: 'LinkedIn', href: contact.linkedin },
    contact.github && { label: 'GitHub', href: contact.github },
  ].filter(Boolean) as { label: string; href: string }[];
  return (
    <main className='readable'>
      <header className='readable-header'>
        <p className='readable-role'>{site.role}</p>
        <h1>{site.nom}</h1>
        <p>{site.accroche}</p>
        <nav className='readable-actions'>
          <a href='./'>Visiter la ville en 3D</a>
          {site.cv && <a href={mediaUrl(site.cv)}>Télécharger mon CV</a>}
          {contacts.map((c) => (
            <a key={c.href} href={c.href}>
              {c.label}
            </a>
          ))}
        </nav>
      </header>
      {buildings.map((b) => {
        const content = place(b.id);
        return (
          <section key={b.id} className='readable-place' aria-labelledby={`lieu-${b.id}`}>
            <h2 id={`lieu-${b.id}`}>{content.titre}</h2>
            <p className='readable-subtitle'>{content.sous_titre}</p>
            {!isOpen(b.id) ? (
              <p className='empty-state'>Bientôt.</p>
            ) : (
              <>
                {content.resume && <p>{content.resume}</p>}
                {content.stations.map((station, i) => (
                  <article key={i}>
                    <h3>{station.titre}</h3>
                    <StationBody station={station} />
                  </article>
                ))}
              </>
            )}
          </section>
        );
      })}
    </main>
  );
}
