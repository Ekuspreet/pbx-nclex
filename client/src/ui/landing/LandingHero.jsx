import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { heroIntro } from '../../motion/landingPresets.js'
import { getButtonClass } from './buttonClass.js'

function LandingHero({ hero }) {
  const videoRef = useRef(null)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const videos = hero.media.videos
  const activeVideo = videos[activeVideoIndex]

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncMotionPreference = () => {
      const video = videoRef.current

      if (!video) {
        return
      }

      if (mediaQuery.matches) {
        video.pause()
        video.removeAttribute('autoplay')
        return
      }

      video.play().catch(() => { })
    }

    syncMotionPreference()
    mediaQuery.addEventListener('change', syncMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', syncMotionPreference)
    }
  }, [activeVideoIndex])

  const handleVideoEnded = () => {
    setActiveVideoIndex((currentIndex) => (currentIndex + 1) % videos.length)
  }

  return (
    <section
      className="hero surface-dark relative min-h-screen overflow-hidden"
      id={hero.id}
    >
      <video
        key={activeVideo.src}
        ref={videoRef}
        className="media-fill motion-reduce:hidden"
        aria-label={hero.media.ariaLabel}
        autoPlay
        muted
        onEnded={handleVideoEnded}
        playsInline
        poster={hero.media.posterSrc}
      >
        <source src={activeVideo.src} type={activeVideo.type} />
      </video>
      <div
        className="overlay-fill surface-overlay"
        aria-hidden="true"
      />

      <div className="hero-content container-page relative z-10 justify-start p-0">
        <div className="grid w-full items-center gap-10 py-24 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <motion.div className="container-readable grid gap-5" {...heroIntro}>
            <p className="text-kicker text-inverse-muted">{hero.eyebrow}</p>
            <h1 className="text-h1 text-inverse">{hero.title}</h1>
            <dl className="grid gap-3 pt-4 text-neutral-content sm:grid-cols-3">
              {hero.metrics.map((metric, index) => (
                <motion.div
                  className="border-l border-neutral-content/30 pl-3"
                  key={metric.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 + index * 0.08, ease: 'easeOut' }}
                >
                  <dt className="text-2xl font-black">{metric.value}</dt>
                  <dd className="text-sm text-neutral-content/75">{metric.label}</dd>
                </motion.div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <motion.a
                className={`${getButtonClass(hero.primaryCta.variant)} motion-safe:transition motion-safe:hover:-translate-y-0.5`}
                href={hero.primaryCta.href}
                aria-label={hero.primaryCta.ariaLabel}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              >
                {hero.primaryCta.label}
              </motion.a>
              <motion.a
                className={`${getButtonClass(hero.secondaryCta.variant)} motion-safe:transition motion-safe:hover:-translate-y-0.5`}
                href={hero.secondaryCta.href}
                aria-label={hero.secondaryCta.ariaLabel}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              >
                {hero.secondaryCta.label}
              </motion.a>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default LandingHero
