import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

export interface ScrollPhase {
  progress: number;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const SCROLL_PHASES: ScrollPhase[] = [
  {
    progress: 0,
    title: "EDAFY",
    subtitle: "Virtual Data Room",
    description: "Intelligence Platform"
  },
  {
    progress: 0.15,
    title: "",
    subtitle: "",
    description: "Begin Exploration"
  },
  {
    progress: 0.3,
    title: "",
    subtitle: "",
    description: "Transitioning to Globe"
  },
  {
    progress: 0.5,
    title: "",
    subtitle: "",
    description: "Interactive Mode"
  }
];

export class ScrollAnimationController {
  private timeline: gsap.core.Timeline | null = null;
  private callbacks: Map<string, (progress: number) => void> = new Map();
  private spacer: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTimeline();
    }
  }

  private initializeTimeline() {
    // MODIFIED: No longer creating/appending spacer or modifying body styles here.
    // We expect the scroll area to be defined by the layout (e.g., sticky container).

    // Initialize GSAP ScrollTrigger
    try {
      this.timeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero-scroll-container', // Track progress only for the hero section
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5, // Smoother scrub
          onUpdate: (self) => {
            this.notifyCallbacks(self.progress);
          },
        },
      });
    } catch (error) {
      console.error('Failed to initialize scroll timeline:', error);
      // Fallback: create a simple animation without scroll
      this.createManualAnimation();
    }
  }

  private createManualAnimation() {
    // Fallback animation that runs automatically
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.01;
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
      }
      this.notifyCallbacks(progress);
    }, 50);
  }

  public onProgress(callback: (progress: number) => void): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.callbacks.set(id, callback);
    return id;
  }

  public offProgress(id: string): void {
    this.callbacks.delete(id);
  }

  private notifyCallbacks(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    this.callbacks.forEach(callback => callback(clampedProgress));
  }

  public scrollTo(progress: number): void {
    if (typeof window === 'undefined') return;

    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = totalHeight * progress;

    gsap.to(window, {
      scrollTo: targetScroll,
      duration: 1.5,
      ease: 'power3.inOut'
    });
  }

  public destroy(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.callbacks.clear();

    if (this.spacer && this.spacer.parentNode) {
      this.spacer.parentNode.removeChild(this.spacer);
    }

    // Reset document styles
    if (typeof window !== 'undefined') {
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.overflowY = '';
      document.body.style.backgroundColor = '';
    }
  }

  // Helper methods for common animation calculations
  static getHeroOpacity(progress: number): number {
    return Math.max(0, 1 - progress * 2);
  }

  static getLatticeOpacity(progress: number): number {
    return Math.max(0, 1 - progress * 1.5);
  }

  static getLatticeScale(progress: number): number {
    return 1 - progress * 0.2;
  }

  static getGlobeOpacity(progress: number): number {
    if (progress < 0.3) return 0;
    return Math.min(1, (progress - 0.3) * 2.5);
  }

  static getPanelOpacity(progress: number): number {
    if (progress < 0.1) return 0;
    return Math.min(1, (progress - 0.1) * 5);
  }

  static getPanelVisibility(progress: number): 'visible' | 'hidden' {
    return progress > 0.05 ? 'visible' : 'hidden'; // Very early reveal
  }

  static getInteractivity(progress: number): boolean {
    return progress >= 0.7;
  }

  static getBlurAmount(progress: number): number {
    // No blur at end of scroll - globe and panels should be very visible
    return 0;
  }
}
