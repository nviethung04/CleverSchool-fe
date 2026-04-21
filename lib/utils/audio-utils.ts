/**
 * Audio utility functions for playing sound effects
 */

/**
 * Play an audio file with specified volume
 * @param fileName - Name of the audio file (e.g., 'ting.mp3', 'reset.mp3')
 * @param volume - Volume level (0.0 to 1.0), default is 0.3
 */
export const playAudio = (fileName: string, volume: number = 0.3): void => {
    try {
        const audio = new Audio(`/${fileName}`);
        audio.volume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
        audio.play().catch(() => {
            // Silently handle audio play errors (browser restrictions)
        });
    } catch (error) {
        // Silently handle audio creation errors
    }
};

/**
 * Audio effect presets with predefined volumes
 */
export const AudioEffects = {
    // User interaction sounds
    select: (volume?: number) => playAudio('ting.mp3', volume ?? 0.3),
    reset: (volume?: number) => playAudio('reset.mp3', volume ?? 0.3),
    submit: (volume?: number) => playAudio('submit.mp3', volume ?? 0.4),
    complete: (volume?: number) => playAudio('complete.mp3', volume ?? 0.5),
    navigate: (volume?: number) => playAudio('next.mp3', volume ?? 0.3),

    // Typing sounds
    type: (volume?: number) => playAudio('type.mp3', volume ?? 0.2),

    // Microphone sound
    microphone: (volume?: number) => playAudio('micro.mp3', volume ?? 0.3),

    // Answer correct/wrong sounds
    answerCorrect: (volume?: number) => playAudio('answer-correct.mp3', volume ?? 0.4),
    answerWrong: (volume?: number) => playAudio('answer-wrong.wav', volume ?? 0.4),
} as const;

/**
 * Check if audio should be excluded based on keyboard event
 * @param key - The key from KeyboardEvent
 * @returns true if the key should not trigger audio
 */
export const isAudioExcludedKey = (key: string): boolean => {
    const excludedKeys = [
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Home', 'End', 'PageUp', 'PageDown'
    ];
    return excludedKeys.includes(key);
};