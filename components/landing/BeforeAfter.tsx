import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const beforePoints = [
  'Generic objective statement',
  'Inconsistent formatting',
  'Missing keywords',
  'Dense paragraphs',
  'Irrelevant skills listed',
];

const afterPoints = [
  'Tailored professional summary',
  'ATS-compatible structure',
  'Job-matched keywords',
  'Clear bullet points',
  'Role-specific skills highlighted',
];

export const BeforeAfter = () => {
  const [showAfter, setShowAfter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

      <div ref={containerRef} className="container mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
            The transformation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how we optimize your resume for ATS success
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center p-1.5 bg-muted/50 rounded-xl border border-border/50">
            <button
              onClick={() => setShowAfter(false)}
              className={`relative px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                !showAfter ? 'text-secondary-foreground' : 'text-muted-foreground'
              }`}
            >
              {!showAfter && (
                <motion.div
                  layoutId="toggle-bg"
                  className="absolute inset-0 bg-secondary rounded-lg"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">Before</span>
            </button>
            <button
              onClick={() => setShowAfter(true)}
              className={`relative px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                showAfter ? 'text-secondary-foreground' : 'text-muted-foreground'
              }`}
            >
              {showAfter && (
                <motion.div
                  layoutId="toggle-bg"
                  className="absolute inset-0 bg-secondary rounded-lg"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">After</span>
            </button>
          </div>
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative bg-card-gradient rounded-2xl border border-border/50 p-8 md:p-10 overflow-hidden">
            {/* Mask reveal animation container */}
            <div className="relative min-h-[280px]">
              <AnimatePresence mode="wait">
                {!showAfter ? (
                  <motion.div
                    key="before"
                    initial={prefersReducedMotion ? { opacity: 0 } : { clipPath: 'inset(0 100% 0 0)' }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { clipPath: 'inset(0 0% 0 0)' }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { clipPath: 'inset(0 0 0 100%)' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-0"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X size={18} className="text-destructive" />
                      </div>
                      <h3 className="font-display text-xl font-medium">Common resume issues</h3>
                    </div>
                    <ul className="space-y-4">
                      {beforePoints.map((point, i) => (
                        <motion.li
                          key={point}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: prefersReducedMotion ? 0 : 0.1 + i * 0.08 }}
                          className="flex items-center gap-3 text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div
                    key="after"
                    initial={prefersReducedMotion ? { opacity: 0 } : { clipPath: 'inset(0 100% 0 0)' }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { clipPath: 'inset(0 0% 0 0)' }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { clipPath: 'inset(0 0 0 100%)' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-0"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-sand/20 flex items-center justify-center">
                        <Check size={18} className="text-sand" />
                      </div>
                      <h3 className="font-display text-xl font-medium">After atsresumie</h3>
                    </div>
                    <ul className="space-y-4">
                      {afterPoints.map((point, i) => (
                        <motion.li
                          key={point}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: prefersReducedMotion ? 0 : 0.1 + i * 0.08 }}
                          className="flex items-center gap-3 text-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-sand" />
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
