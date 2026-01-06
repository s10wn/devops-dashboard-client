import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Team = {
  id: string;
  name: string;
  slug: string;
};

type TeamState = {
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
};

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      currentTeam: null,
      setCurrentTeam: (team) => set({ currentTeam: team }),
    }),
    {
      name: 'team-storage',
    }
  )
);
