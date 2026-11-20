// Actions de score par sport (mode Live du tableau tactique et télécommande déportée)

export interface SportScoreAction {
  id: string;
  label: string;
  shortLabel: string;
  points: number;
  icon: string;
  requiresAssisterModal?: boolean;
}

export const getSportScoreActions = (sport: string): SportScoreAction[] => {
  switch (sport) {
    case "rugby":
      return [
        { id: "drop", label: "Drop", shortLabel: "Drop (+3)", points: 3, icon: "🥅", requiresAssisterModal: false },
        { id: "essai", label: "Essai", shortLabel: "Essai (+5)", points: 5, icon: "🏉", requiresAssisterModal: false },
        { id: "transformation", label: "Transformation", shortLabel: "Transformation (+2)", points: 2, icon: "🎯", requiresAssisterModal: false },
      ];
    case "basketball":
      return [
        { id: "basket_3", label: "3 points", shortLabel: "3 points (+3)", points: 3, icon: "🎯", requiresAssisterModal: false },
        { id: "basket_2", label: "2 points", shortLabel: "2 points (+2)", points: 2, icon: "🏀", requiresAssisterModal: false },
        { id: "basket_1", label: "Lancer franc", shortLabel: "Lancer franc (+1)", points: 1, icon: "⭕", requiresAssisterModal: false },
      ];
    case "handball":
      return [
        { id: "goal", label: "But", shortLabel: "But", points: 1, icon: "🤾", requiresAssisterModal: true },
      ];
    case "football":
    default:
      return [
        { id: "goal", label: "But", shortLabel: "But", points: 1, icon: "⚽", requiresAssisterModal: true },
      ];
  }
};
