'use client';

import React from 'react';

export interface CelebrationSparklesProps {
  className?: string;
  showAura?: boolean;
}

interface ParticleConfig {
  id: number;
  type: 'star' | 'diamond' | 'dot' | 'ribbon';
  left: string;
  top: string;
  color: string;
  size: number;
  delay: string;
  duration: string;
  animation: 'twinkle' | 'float' | 'burst';
  rotate?: number;
}

// Paleta La Marka elegante para encantamento no balcão
const COLORS = {
  champagne: '#DFB76C',
  champagneBright: '#F5D061',
  terracotta: '#5F3A36',
  dustyRose: '#C59B94',
  softBlush: '#DFC2BC',
  ivory: '#FAF6F5',
};

// Partículas com posicionamento determinístico (zero hydration mismatch)
const PARTICLES: ParticleConfig[] = [
  // Coroa / Topo Central
  { id: 1, type: 'star', left: '50%', top: '-28px', color: COLORS.champagne, size: 26, delay: '0s', duration: '2.4s', animation: 'twinkle' },
  { id: 2, type: 'diamond', left: '42%', top: '-18px', color: COLORS.champagneBright, size: 14, delay: '0.2s', duration: '2.1s', animation: 'float' },
  { id: 3, type: 'diamond', left: '58%', top: '-20px', color: COLORS.dustyRose, size: 14, delay: '0.35s', duration: '2.6s', animation: 'float' },
  { id: 4, type: 'dot', left: '35%', top: '-10px', color: COLORS.terracotta, size: 7, delay: '0.1s', duration: '1.9s', animation: 'twinkle' },
  { id: 5, type: 'dot', left: '65%', top: '-12px', color: COLORS.champagne, size: 6, delay: '0.4s', duration: '2.2s', animation: 'twinkle' },

  // Canto Superior Esquerdo
  { id: 6, type: 'star', left: '6%', top: '2%', color: COLORS.champagne, size: 20, delay: '0.15s', duration: '2.5s', animation: 'twinkle' },
  { id: 7, type: 'diamond', left: '16%', top: '-4px', color: COLORS.dustyRose, size: 13, delay: '0.3s', duration: '2.7s', animation: 'float' },
  { id: 8, type: 'ribbon', left: '-12px', top: '12%', color: COLORS.champagneBright, size: 10, delay: '0.25s', duration: '2.8s', animation: 'float', rotate: 25 },
  { id: 9, type: 'dot', left: '10%', top: '15%', color: COLORS.terracotta, size: 8, delay: '0.5s', duration: '2.0s', animation: 'twinkle' },
  { id: 10, type: 'star', left: '2%', top: '24%', color: COLORS.dustyRose, size: 16, delay: '0.4s', duration: '2.3s', animation: 'float' },

  // Canto Superior Direito
  { id: 11, type: 'star', left: '92%', top: '2%', color: COLORS.champagne, size: 22, delay: '0.1s', duration: '2.4s', animation: 'twinkle' },
  { id: 12, type: 'diamond', left: '82%', top: '-6px', color: COLORS.terracotta, size: 12, delay: '0.25s', duration: '2.9s', animation: 'float' },
  { id: 13, type: 'ribbon', left: '102%', top: '10%', color: COLORS.dustyRose, size: 11, delay: '0.45s', duration: '2.6s', animation: 'float', rotate: -30 },
  { id: 14, type: 'dot', left: '88%', top: '16%', color: COLORS.champagneBright, size: 7, delay: '0.15s', duration: '1.8s', animation: 'twinkle' },
  { id: 15, type: 'star', left: '97%', top: '22%', color: COLORS.champagne, size: 15, delay: '0.55s', duration: '2.5s', animation: 'float' },

  // Laterais Meio (Emoldurando o Card de Ganho)
  { id: 16, type: 'star', left: '-18px', top: '44%', color: COLORS.champagne, size: 18, delay: '0.3s', duration: '2.2s', animation: 'twinkle' },
  { id: 17, type: 'dot', left: '-6px', top: '56%', color: COLORS.dustyRose, size: 8, delay: '0.6s', duration: '2.5s', animation: 'float' },
  { id: 18, type: 'ribbon', left: '-14px', top: '68%', color: COLORS.terracotta, size: 11, delay: '0.2s', duration: '2.7s', animation: 'float', rotate: 15 },

  { id: 19, type: 'star', left: '102%', top: '42%', color: COLORS.champagneBright, size: 19, delay: '0.2s', duration: '2.4s', animation: 'twinkle' },
  { id: 20, type: 'dot', left: '104%', top: '54%', color: COLORS.champagne, size: 8, delay: '0.5s', duration: '2.1s', animation: 'float' },
  { id: 21, type: 'ribbon', left: '101%', top: '66%', color: COLORS.dustyRose, size: 12, delay: '0.35s', duration: '3.0s', animation: 'float', rotate: -20 },

  // Canto Inferior Esquerdo e Direito
  { id: 22, type: 'star', left: '4%', top: '82%', color: COLORS.champagne, size: 17, delay: '0.4s', duration: '2.6s', animation: 'twinkle' },
  { id: 23, type: 'diamond', left: '14%', top: '92%', color: COLORS.terracotta, size: 13, delay: '0.6s', duration: '2.4s', animation: 'float' },
  { id: 24, type: 'dot', left: '26%', top: '98%', color: COLORS.softBlush, size: 6, delay: '0.3s', duration: '1.9s', animation: 'twinkle' },

  { id: 25, type: 'star', left: '94%', top: '80%', color: COLORS.dustyRose, size: 18, delay: '0.25s', duration: '2.3s', animation: 'float' },
  { id: 26, type: 'diamond', left: '84%', top: '90%', color: COLORS.champagne, size: 14, delay: '0.5s', duration: '2.7s', animation: 'twinkle' },
  { id: 27, type: 'dot', left: '72%', top: '97%', color: COLORS.terracotta, size: 7, delay: '0.35s', duration: '2.0s', animation: 'float' },

  // Base Central
  { id: 28, type: 'star', left: '50%', top: '102%', color: COLORS.champagneBright, size: 16, delay: '0.45s', duration: '2.2s', animation: 'twinkle' },
];

export function CelebrationSparkles({ className = '', showAura = true }: CelebrationSparklesProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none select-none overflow-visible z-10 ${className}`}
    >
      <style>{`
        @keyframes lm-sparkle-twinkle {
          0%, 100% {
            transform: scale(0.35) rotate(0deg);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.15) rotate(45deg);
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(223, 183, 108, 0.75));
          }
        }

        @keyframes lm-sparkle-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(0.85);
            opacity: 0.45;
          }
          50% {
            transform: translateY(-10px) rotate(15deg) scale(1.08);
            opacity: 0.95;
            filter: drop-shadow(0 0 4px rgba(197, 155, 148, 0.6));
          }
        }

        @keyframes lm-sparkle-burst {
          0% {
            transform: scale(0.2) translate(0, 0);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: scale(1) translate(0, -4px);
            opacity: 0.85;
          }
        }

        @keyframes lm-aura-pulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.04);
            opacity: 0.65;
          }
        }

        .lm-anim-twinkle {
          animation: lm-sparkle-twinkle infinite ease-in-out;
        }

        .lm-anim-float {
          animation: lm-sparkle-float infinite ease-in-out;
        }

        .lm-anim-burst {
          animation: lm-sparkle-burst 0.8s ease-out forwards;
        }

        .lm-anim-aura {
          animation: lm-aura-pulse 3.5s infinite ease-in-out;
        }
      `}</style>

      {/* Aura Suave Dourada e Terracota ao redor do modal */}
      {showAura && (
        <div
          className="absolute -inset-10 sm:-inset-16 rounded-[48px] pointer-events-none lm-anim-aura -z-10"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(223, 183, 108, 0.22) 0%, rgba(197, 155, 148, 0.12) 45%, transparent 72%)',
          }}
        />
      )}

      {/* Partículas Delicadas */}
      {PARTICLES.map((p) => {
        const animClass =
          p.animation === 'twinkle'
            ? 'lm-anim-twinkle'
            : p.animation === 'float'
            ? 'lm-anim-float'
            : 'lm-anim-burst';

        return (
          <div
            key={p.id}
            className={`absolute ${animClass}`}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {p.type === 'star' && (
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 0C12.4 5.8 18.2 11.6 24 12C18.2 12.4 12.4 18.2 12 24C11.6 18.2 5.8 12.4 0 12C5.8 11.6 11.6 5.8 12 0Z"
                  fill={p.color}
                />
              </svg>
            )}

            {p.type === 'diamond' && (
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5L10 0Z"
                  fill={p.color}
                />
              </svg>
            )}

            {p.type === 'dot' && (
              <span
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: `0 0 6px ${p.color}80`,
                }}
              />
            )}

            {p.type === 'ribbon' && (
              <span
                style={{
                  width: p.size * 0.55,
                  height: p.size * 1.3,
                  backgroundColor: p.color,
                  borderRadius: 2,
                  display: 'inline-block',
                  transform: `rotate(${p.rotate || 20}deg)`,
                  boxShadow: `0 0 4px ${p.color}60`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
