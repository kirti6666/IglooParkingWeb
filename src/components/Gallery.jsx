import { useSite } from '../ConfigContext'
import { mediaUrl } from '../api'

/**
 * Photos and video of real parking spaces.
 *
 * Every slot is optional. Empty slots stay out of the public page and appear
 * automatically as soon as an administrator adds a media URL.
 *
 * Mobile handling: fixed aspect-ratio boxes reserve space before the image
 * loads (no layout shift), images are lazy-loaded and served with `sizes` so
 * phones fetch a smaller file, and the video only loads its metadata until
 * someone presses play — a poster image covers the wait.
 */

export default function Gallery() {
  const { media } = useSite()
  const images = media.images ?? []
  const videos = Array.isArray(media.videos)
    ? media.videos
    : media.video
      ? [media.video]
      : []
  const visibleImages = images.filter((image) => image?.src?.trim())
  const visibleVideos = videos.filter((video) => video?.src?.trim())

  if (!visibleImages.length && !visibleVideos.length) return null

  return (
    <section className="fold gallery" id="spaces">
      <div className="shell">
        <div className="gallery__head reveal">
          <p className="eyebrow">The spaces</p>
          <h2 className="h-section gallery__title">{media.galleryTitle}</h2>
          <p className="lede gallery__sub">{media.gallerySubtitle}</p>
        </div>

        {visibleImages.length ? (
          <div className="gallery__grid" data-count={visibleImages.length}>
            {visibleImages.map((img, i) => (
              <figure className="shot reveal" key={`${img.src}-${i}`}>
                <div className="shot__frame">
                  <img
                    className="shot__img"
                    src={mediaUrl(img.src)}
                    alt={img.alt || ''}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw"
                  />
                </div>
                {img.caption ? (
                  <figcaption className="shot__caption">{img.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}

        {visibleVideos.map((video, i) => (
          <figure className="clip reveal" key={`${video.src}-${i}`}>
            <div className="clip__frame">
              <video
                className="clip__video"
                src={mediaUrl(video.src)}
                poster={mediaUrl(video.poster) || undefined}
                controls
                playsInline
                preload="metadata"
              />
            </div>
            {video.caption ? (
              <figcaption className="clip__caption">{video.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  )
}
