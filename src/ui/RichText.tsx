import type { Block, Inline, Media, StationContent } from '../content';
import { mediaUrl } from '../content';

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((item, i) =>
        item.t === 'strong' ? (
          <strong key={i}>{item.v}</strong>
        ) : item.t === 'em' ? (
          <em key={i}>{item.v}</em>
        ) : item.t === 'link' ? (
          <a key={i} href={mediaUrl(item.href ?? '')} target='_blank' rel='noreferrer'>
            {item.v}
          </a>
        ) : (
          <span key={i}>{item.v}</span>
        ),
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) =>
        block.type === 'p' ? (
          <p key={i}>
            <Inlines items={block.inline} />
          </p>
        ) : (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>
                <Inlines items={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

function MediaItem({ media }: { media: Media }) {
  if (media.type === 'image')
    return (
      <figure className='media'>
        <img src={mediaUrl(media.src)} alt={media.alt} loading='lazy' />
        {media.legende && <figcaption>{media.legende}</figcaption>}
      </figure>
    );
  if (media.type === 'video')
    return (
      <figure className='media'>
        <video src={mediaUrl(media.src)} controls preload='metadata' title={media.titre} />
        <figcaption>{media.titre}</figcaption>
      </figure>
    );
  return (
    <a className='media-link' href={mediaUrl(media.url)} target='_blank' rel='noreferrer'>
      {media.texte}
    </a>
  );
}

/** Texte et médias d'une station, tels qu'écrits dans src/content/batiments/*.md. */
export default function StationBody({ station }: { station: StationContent }) {
  return (
    <div className='rich-text'>
      <Blocks blocks={station.texte} />
      {station.medias.map((media, i) => (
        <MediaItem key={i} media={media} />
      ))}
    </div>
  );
}
