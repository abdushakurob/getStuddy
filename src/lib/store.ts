import { create } from 'zustand';

// Types for the global state
interface UserProfile {
    xp: number;
    credits: number;
    streak: number;
    level: number;
}

interface GameState {
    user: UserProfile;
    activeCourseId: string | null;

    // Actions
    toggleCourse: (courseId: string) => void;
    awardXP: (amount: number) => void;
    spendCredits: (amount: number) => boolean;
    incrementStreak: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    user: {
        xp: 0,
        credits: 100, // Starting bonus
        streak: 0,
        level: 1,
    },
    activeCourseId: null,

    toggleCourse: (courseId) => set({ activeCourseId: courseId }),

    awardXP: (amount) => set((state) => {
        // Simple level-up logic: Level = XP / 1000 + 1
        const newXP = state.user.xp + amount;
        const newLevel = Math.floor(newXP / 1000) + 1;

        return {
            user: {
                ...state.user,
                xp: newXP,
                level: newLevel,
            }
        };
    }),

    spendCredits: (amount) => {
        const currentCredits = get().user.credits;
        if (currentCredits >= amount) {
            set((state) => ({
                user: { ...state.user, credits: state.user.credits - amount }
            }));
            return true;
        }
        return false;
    },

    incrementStreak: () => set((state) => ({
        user: { ...state.user, streak: state.user.streak + 1 }
    })),
}));
