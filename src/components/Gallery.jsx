import { useSite } from '../ConfigContext'

/**
 * Photos and video of real parking spaces.
 *
 * Every slot is optional: an empty URL renders a labelled placeholder rather
 * than a broken image, so the section looks intentional before any media
 * exists and fills in as the admin adds URLs.
 *
 * Mobile handling: fixed aspect-ratio boxes reserve space before the image
 * loads (no layout shift), images are lazy-loaded and served with `sizes` so
 * phones fetch a smaller file, and the video only loads its metadata until
 * someone presses play — a poster image covers the wait.
 */

function Placeholder({ label, kind = 'photo' }) {
  return (
    <div className="shot__placeholder">
      {kind === 'video' ? (
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            d="M4 6.5h11a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Zm12.5 4.2 4-2.4v7.4l-4-2.4Z"
          />
        </svg>
      ) : (
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="8.6" cy="10" r="1.5" fill="currentColor" />
          <path
            d="m4 17 4.6-4.4 3.2 3 3-2.6L20 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <p className="shot__placeholderLabel">{label}</p>
      <p className="shot__placeholderHint">Add a {kind} in the admin panel</p>
    </div>
  )
}

export default function Gallery() {
  const { media } = useSite()
  const images = media.images ?? []
  const video = media.video ?? {}

  return (
    <section className="fold gallery" id="spaces">
      <div className="shell">
        <div className="gallery__head reveal">
          <p className="eyebrow">The spaces</p>
          <h2 className="h-section gallery__title">{media.galleryTitle}</h2>
          <p className="lede gallery__sub">{media.gallerySubtitle}</p>
        </div>

        <div className="gallery__grid">
          {images.map((img, i) => (
            <figure className="shot reveal" key={i}>
              <div className="shot__frame">
                {img.src ? (
                  <img
                    className="shot__img"
                    src={img.src}
                    alt={img.alt || ''}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 25vw"
                  />
                ) : (
                  <Placeholder label={img.caption || `Photo ${i + 1}`} />
                )}
              </div>
              {img.caption ? (
                <figcaption className="shot__caption">{img.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>

        <figure className="clip reveal">
          <div className="clip__frame">
            {video.src ? (
              <video
                className="clip__video"
                src={video.src}
                poster={video.poster || undefined}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <Placeholder label={video.caption || 'Video'} kind="video" />
            )}
          </div>
          {video.caption ? (
            <figcaption className="clip__caption">{video.caption}</figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  )
}
