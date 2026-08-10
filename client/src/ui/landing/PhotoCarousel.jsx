import { useEffect, useRef, useState } from 'react'

const imageModules = import.meta.glob('../../assets/images/photo_*.png', {
  eager: true,
  import: 'default',
  query: '?url',
})

const images = Object.entries(imageModules)
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([, source]) => source)

const DISPLAY_TIME = 3000

function wrap(index) {
  return (index + images.length) % images.length
}

function relativeDistance(index, centre) {
  let distance = index - centre
  const half = images.length / 2

  if (distance > half) distance -= images.length
  if (distance < -half) distance += images.length

  return distance
}

function getPositionClass(distance) {
  if (distance === 0) return 'is-active'
  if (distance === -1) return 'is-left'
  if (distance === 1) return 'is-right'
  if (distance === -2) return 'is-far-left'
  if (distance === 2) return 'is-far-right'
  return ''
}

function PhotoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef(0)

  const moveTo = (index) => setCurrentIndex(wrap(index))

  useEffect(() => {
    if (isPaused || images.length < 2) return undefined

    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => wrap(index + 1))
    }, DISPLAY_TIME)

    return () => window.clearTimeout(timer)
  }, [currentIndex, isPaused])

  return (
    <section
      className="photo-carousel"
      aria-roledescription="carousel"
      aria-label="PBX Nursing question bank previews"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') moveTo(currentIndex - 1)
        if (event.key === 'ArrowRight') moveTo(currentIndex + 1)
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
      }}
    >
      <div
        className="photo-carousel__viewport"
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0].clientX
        }}
        onTouchEnd={(event) => {
          const distance = event.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(distance) > 45) moveTo(currentIndex + (distance < 0 ? 1 : -1))
        }}
      >
        {images.map((source, index) => {
          const distance = relativeDistance(index, currentIndex)

          return (
            <button
              className={`photo-carousel__card ${getPositionClass(distance)}`}
              type="button"
              key={source}
              aria-label={distance === 0 ? `Current preview, image ${index + 1} of ${images.length}` : `Show preview ${index + 1}`}
              aria-hidden={Math.abs(distance) > 1}
              tabIndex={Math.abs(distance) <= 1 ? 0 : -1}
              onClick={() => {
                if (distance < 0) moveTo(currentIndex - 1)
                if (distance > 0) moveTo(currentIndex + 1)
              }}
            >
              <img
                src={source}
                alt={`PBX Nursing question bank preview ${index + 1}`}
                draggable="false"
                decoding="async"
                loading={index < 3 ? 'eager' : 'lazy'}
              />
            </button>
          )
        })}
      </div>

      <button className="photo-carousel__arrow is-previous" type="button" aria-label="Previous image" onClick={() => moveTo(currentIndex - 1)}>
        <span aria-hidden="true">‹</span>
      </button>
      <button className="photo-carousel__arrow is-next" type="button" aria-label="Next image" onClick={() => moveTo(currentIndex + 1)}>
        <span aria-hidden="true">›</span>
      </button>

      <div className="photo-carousel__dots" aria-label="Image navigation">
        {images.map((source, index) => (
          <button
            className={`photo-carousel__dot ${index === currentIndex ? 'is-active' : ''}`}
            type="button"
            key={source}
            aria-label={`Show image ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : undefined}
            onClick={() => moveTo(index)}
          />
        ))}
      </div>
    </section>
  )
}

export default PhotoCarousel
