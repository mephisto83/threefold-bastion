export class SoundManager {
  private pools: Record<string, HTMLAudioElement[]> = {};
  private maxPoolSize = 5; // Max concurrent instances of the same sound
  public onPlayCallback?: (url: string) => void;
  public onEndCallback?: (url: string) => void;

  play(url: string, volume: number = 0.2) {
    // Ensure URL is absolute to avoid any ambiguity
    const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;

    if (!this.pools[absoluteUrl]) {
      this.pools[absoluteUrl] = [];
    }

    // Find a free audio element
    let audio = this.pools[absoluteUrl].find(a => a.paused || a.ended);

    if (!audio) {
      if (this.pools[absoluteUrl].length < this.maxPoolSize) {
        audio = new Audio(absoluteUrl);
        this.pools[absoluteUrl].push(audio);
      } else {
        return;
      }
    }

    audio.volume = volume;
    audio.currentTime = 0;
    
    // Set up onended handler
    audio.onended = () => {
      this.onEndCallback?.(url);
    };

    console.log(`Playing sound: ${absoluteUrl}`);
    audio.play().then(() => {
      this.onPlayCallback?.(url);
    }).catch((e) => {
      console.error(`Error playing sound ${absoluteUrl}:`, e);
    });
  }

  preload(url: string) {
    if (!this.pools[url]) {
      this.pools[url] = [];
      const audio = new Audio(url);
      // We don't play it, just load it.
      // Setting volume to 0 and playing then pausing is a trick to force load on some browsers,
      // but just creating the Audio object usually starts the download.
      audio.load();
      this.pools[url].push(audio);
    }
  }
}

export const soundManager = new SoundManager();
