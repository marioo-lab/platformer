class AudioManager {
  constructor(game) {
    this.game = game;
    this.sounds = {};
    this.music = {};
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.soundVolume = 0.7;
    this.enabled = true;

    // Initialize Web Audio API context
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.soundGain = null;

    this.initializeAudioContext();
    this.createSyntheticSounds();
  }

  initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.soundGain = this.audioContext.createGain();

      // Connect gain nodes
      this.musicGain.connect(this.masterGain);
      this.soundGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set initial volumes
      this.musicGain.gain.value = this.musicVolume;
      this.soundGain.gain.value = this.soundVolume;
    } catch (error) {
      console.warn("Web Audio API not supported, falling back to HTML5 audio");
      this.audioContext = null;
    }
  }

  // Create synthetic sounds using Web Audio API
  createSyntheticSounds() {
    if (!this.audioContext) return;

    // Define sound patterns
    this.soundPatterns = {
      jump: { type: "square", frequency: 440, duration: 0.1, fadeOut: true },
      playerAttack: {
        type: "sawtooth",
        frequency: 220,
        duration: 0.15,
        fadeOut: true,
      },
      playerHit: {
        type: "triangle",
        frequency: 150,
        duration: 0.3,
        fadeOut: true,
      },
      enemyDie: {
        type: "sawtooth",
        frequency: 100,
        duration: 0.5,
        fadeOut: true,
      },
      enemyAttack: {
        type: "sawtooth",
        frequency: 180,
        duration: 0.2,
        fadeOut: true,
      },
      enemyHit: {
        type: "triangle",
        frequency: 120,
        duration: 0.25,
        fadeOut: true,
      },
      menuMove: {
        type: "square",
        frequency: 330,
        duration: 0.05,
        fadeOut: true,
      },
      menuSelect: {
        type: "square",
        frequency: 550,
        duration: 0.1,
        fadeOut: true,
      },
      gameOver: {
        type: "triangle",
        frequency: 110,
        duration: 1.0,
        fadeOut: true,
      },
      waveComplete: {
        type: "sine",
        frequency: 660,
        duration: 0.3,
        fadeOut: true,
      },
      pickup: { type: "sine", frequency: 880, duration: 0.2, fadeOut: true },
      land: { type: "noise", frequency: 80, duration: 0.1, fadeOut: true },
    };
  }

  // Generate a synthetic sound using Web Audio API
  generateSound(pattern) {
    if (!this.audioContext || !this.enabled) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.soundGain);

    if (pattern.type === "noise") {
      // Create noise using buffer
      const bufferSize = this.audioContext.sampleRate * pattern.duration;
      const buffer = this.audioContext.createBuffer(
        1,
        bufferSize,
        this.audioContext.sampleRate
      );
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      noise.connect(gainNode);

      if (pattern.fadeOut) {
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + pattern.duration
        );
      }

      noise.start();
      noise.stop(this.audioContext.currentTime + pattern.duration);

      return noise;
    } else {
      oscillator.type = pattern.type;
      oscillator.frequency.setValueAtTime(
        pattern.frequency,
        this.audioContext.currentTime
      );

      if (pattern.fadeOut) {
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + pattern.duration
        );
      } else {
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      }

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + pattern.duration);

      return oscillator;
    }
  }

  // Play a sound effect
  playSound(soundName, volume = 1.0) {
    if (!this.enabled) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    if (this.soundPatterns[soundName]) {
      // Generate synthetic sound
      const sound = this.generateSound(this.soundPatterns[soundName]);
      return sound;
    } else if (this.sounds[soundName]) {
      // Play loaded audio file
      const sound = this.sounds[soundName].cloneNode();
      sound.volume = volume * this.soundVolume;
      sound
        .play()
        .catch((e) => console.warn("Could not play sound:", soundName));
      return sound;
    } else {
      console.warn("Sound not found:", soundName);
    }
  }

  // Create simple background music using Web Audio API
  createBackgroundMusic() {
    if (!this.audioContext || !this.enabled) return;

    // Simple chord progression for background music
    const chords = [
      [261.63, 329.63, 392.0], // C major
      [293.66, 369.99, 440.0], // D minor
      [329.63, 415.3, 493.88], // E minor
      [349.23, 440.0, 523.25], // F major
    ];

    let chordIndex = 0;
    const chordDuration = 2.0; // 2 seconds per chord

    const playChord = () => {
      if (!this.currentMusic || this.currentMusic.stopped) return;

      const chord = chords[chordIndex];
      const oscillators = [];

      chord.forEach((frequency, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.musicGain);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          frequency * 0.5,
          this.audioContext.currentTime
        ); // Lower octave
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

        // Add slight detuning for richness
        oscillator.detune.setValueAtTime(
          (Math.random() - 0.5) * 5,
          this.audioContext.currentTime
        );

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + chordDuration);

        oscillators.push(oscillator);
      });

      chordIndex = (chordIndex + 1) % chords.length;

      // Schedule next chord
      setTimeout(() => {
        if (this.currentMusic && !this.currentMusic.stopped) {
          playChord();
        }
      }, chordDuration * 1000);
    };

    return { play: playChord, stopped: false };
  }

  // Play background music
  playMusic(musicName, loop = true) {
    if (!this.enabled) return;

    // Stop current music
    this.stopMusic();

    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    if (musicName === "game") {
      // Create synthetic background music
      this.currentMusic = this.createBackgroundMusic();
      if (this.currentMusic) {
        this.currentMusic.play();
      }
    } else if (this.music[musicName]) {
      // Play loaded music file
      this.currentMusic = this.music[musicName];
      this.currentMusic.loop = loop;
      this.currentMusic.volume = this.musicVolume;
      this.currentMusic
        .play()
        .catch((e) => console.warn("Could not play music:", musicName));
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      if (this.currentMusic.stopped !== undefined) {
        // Synthetic music
        this.currentMusic.stopped = true;
      } else {
        // HTML5 audio
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      }
      this.currentMusic = null;
    }
  }

  pauseMusic() {
    if (this.currentMusic && this.currentMusic.pause) {
      this.currentMusic.pause();
    }
  }

  resumeMusic() {
    if (this.currentMusic && this.currentMusic.play) {
      this.currentMusic
        .play()
        .catch((e) => console.warn("Could not resume music"));
    }
  }

  // Load external audio files (optional)
  loadSound(name, url) {
    const audio = new Audio(url);
    audio.preload = "auto";
    this.sounds[name] = audio;
    return audio;
  }

  loadMusic(name, url) {
    const audio = new Audio(url);
    audio.preload = "auto";
    this.music[name] = audio;
    return audio;
  }

  // Volume controls
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    if (this.soundGain) {
      this.soundGain.gain.value = this.soundVolume;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    if (this.currentMusic && this.currentMusic.volume !== undefined) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setMasterVolume(volume) {
    const vol = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }

  // Toggle audio on/off
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    }
    return this.enabled;
  }

  // Enhanced sound effects with variations
  playRandomSound(baseSoundName, pitchVariation = 0.1) {
    if (this.soundPatterns[baseSoundName]) {
      const pattern = { ...this.soundPatterns[baseSoundName] };
      pattern.frequency +=
        (Math.random() - 0.5) * pattern.frequency * pitchVariation;
      this.generateSound(pattern);
    } else {
      this.playSound(baseSoundName);
    }
  }

  // Cleanup
  destroy() {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  // Debug info
  getDebugInfo() {
    return {
      enabled: this.enabled,
      soundVolume: this.soundVolume,
      musicVolume: this.musicVolume,
      currentMusic: this.currentMusic ? "playing" : "none",
      audioContext: this.audioContext ? "available" : "not available",
    };
  }
}
