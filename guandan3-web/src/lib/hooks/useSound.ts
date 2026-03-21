import { useRef, useCallback } from 'react';

type SoundType = 'turn' | 'play' | 'win' | 'lose' | 'bomb' | 'straight';

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: string) => {
    try {
      if (!audioContextRef.current) {
        // Lazy init
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
        }
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'turn':
          // Soft "Ding" - Sine wave with quick decay
          const oscTurn = ctx.createOscillator();
          oscTurn.type = 'sine';
          oscTurn.frequency.setValueAtTime(880, now); // A5
          oscTurn.connect(gainNode);
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          
          oscTurn.start(now);
          oscTurn.stop(now + 0.5);
          break;

        case 'play':
          // Card Snap - White noise burst + high pitch short tone
          const noiseLen = ctx.sampleRate * 0.1;
          const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
          const noiseData = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseLen; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.5; // Reduce volume
          }
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(1200, now);
          
          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(gainNode);
          
          gainNode.gain.setValueAtTime(0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          
          noiseSrc.start(now);
          break;

        case 'win':
          // Major Chord Arpeggio (C-E-G-C)
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            const g = ctx.createGain();
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8);
            
            osc.connect(g);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.8);
          });
          break;
          
        case 'lose':
          // Diminished Chord (C-Eb-Gb-A)
          [523.25, 622.25, 739.99, 880.00].reverse().forEach((freq, i) => {
             const osc = ctx.createOscillator();
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(freq, now + i * 0.15);
             
             const g = ctx.createGain();
             g.connect(ctx.destination);
             g.gain.setValueAtTime(0, now + i * 0.15);
             g.gain.linearRampToValueAtTime(0.1, now + i * 0.15 + 0.05);
             g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.0);
             
             osc.connect(g);
             osc.start(now + i * 0.15);
             osc.stop(now + i * 0.15 + 1.0);
          });
          break;
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, []);

  return { playSound };
};
