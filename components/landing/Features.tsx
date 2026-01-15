import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Shield, Target, Code2, History, FileStack } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'ATS-safe layout',
    description: 'Clean, parseable structure that passes automated screening.',
  },
  {
    icon: Target,
    title: 'Keyword alignment',
    description: 'Match your resume to job requirements automatically.',
  },
  {
    icon: Code2,
    title: 'LaTeX precision',
    description: 'Professional typesetting with full source access.',
  },
  {
    icon: History,
    title: 'Version history',
    description: 'Track changes and revert to previous versions.',
  },
  {
    icon: FileStack,
    title: '1–2 page control',
    description: 'Automatically fit your content to the right length.',
  },
];

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
  isInView: boolean;
}

const FeatureCard = ({ feature, index, isInView }: FeatureCardProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: prefersReducedMotion ? 0 : 0.1 + index * 0.08,
        type: 'spring',
        damping: 20,
      }}
      whileHover={prefersReducedMotion ? {} : { y: -5 }}
      className="group relative"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative bg-card-gradient rounded-2xl border border-border/50 p-6 h-full transition-colors duration-300 hover:border-sand/30 overflow-hidden"
        whileHover={
          prefersReducedMotion
            ? {}
            : {
                rotateX: 5,
                rotateY: -5,
                transition: { type: 'spring', damping: 20 },
              }
        }
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sand/10 to-beige/5" />
        </div>

        {/* Content - needs higher z-index to stay above effects */}
        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4"
            whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 10 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <feature.icon size={22} className="text-sand" />
          </motion.div>

          {/* Text */}
          <h3 className="font-display text-lg font-medium mb-2 text-foreground">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>

        {/* Animated border glow on hover - positioned behind content */}
        <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none z-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--coffee-light)), hsl(var(--sand)), hsl(var(--coffee-light)))',
              backgroundSize: '200% 200%',
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }
            }
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-24 md:py-32">
      <div ref={containerRef} className="container mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
            Key benefits
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create a resume that gets past the algorithms
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
};
