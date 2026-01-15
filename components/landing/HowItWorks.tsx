import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { FileText, Eye, Download, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Paste JD + Resume + Focus',
    description: 'Upload or paste your current resume and the job description. Add optional focus areas.',
  },
  {
    number: '02',
    icon: Eye,
    title: 'Preview ATS Match',
    description: 'See your ATS score, keyword matches, and suggested improvements in real-time.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Export PDF + LaTeX',
    description: 'Download your optimized resume as PDF and get the LaTeX source. Uses 1 credit.',
  },
];

export const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div ref={containerRef} className="container mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to an ATS-optimized resume
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border hidden lg:block" />
          <motion.div
            className="absolute top-1/2 left-0 h-px hidden lg:block"
            style={{ background: 'linear-gradient(90deg, hsl(var(--sand)), hsl(var(--beige)))' }}
            initial={{ width: 0 }}
            animate={isInView ? { width: '100%' } : {}}
            transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
          />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.2 + index * 0.15,
                  type: 'spring',
                  damping: 20,
                }}
                className="relative group"
              >
                {/* Card */}
                <div className="relative bg-card-gradient rounded-2xl border border-border/50 p-8 h-full transition-all duration-300 hover:border-sand/30 hover:shadow-glow">
                  {/* Step number */}
                  <div className="absolute -top-4 left-8 px-3 py-1 bg-card border border-border rounded-lg">
                    <span className="font-display text-sm font-semibold text-sand">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-6 mt-2"
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <step.icon size={24} className="text-sand" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-medium mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>

                  {/* Arrow (hidden on last) */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden lg:block z-10">
                      <motion.div
                        initial={{ x: 0 }}
                        animate={isInView && !prefersReducedMotion ? { x: [0, 5, 0] } : {}}
                        transition={{ delay: 1 + index * 0.2, duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight size={20} className="text-sand" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
