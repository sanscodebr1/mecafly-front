// Web polyfills for React Native modules that aren't available in web
if (typeof window !== 'undefined') {
  // Polyfill for Platform utilities
  if (!global.Platform) {
    global.Platform = {
      OS: 'web',
      select: (obj: any) => obj.web || obj.default || obj,
    };
  }

  // Polyfill for Dimensions
  if (!global.Dimensions) {
    global.Dimensions = {
      get: (dim: string) => {
        if (dim === 'window') {
          return {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            fontScale: 1,
          };
        }
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          scale: 1,
          fontScale: 1,
        };
      },
    };
  }
} 