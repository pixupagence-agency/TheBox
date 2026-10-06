"use client";

import React, { useState } from "react";
import { Search, Filter, BookOpen, Star, Trash2, ArrowUpRight, Plus, Eye, Share2, ClipboardList } from "lucide-react";
import ShareModal, { ShareData } from "./ShareModal";

interface StrategyLibraryProps {
  savedTactics: any[];
  setSavedTactics: React.Dispatch<React.SetStateAction<any[]>>;
  onLoadTactic: (tactic: any) => void;
}

export default function StrategyLibrary({ savedTactics, setSavedTactics, onLoadTactic }: StrategyLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSportFilter, setSelectedSportFilter] = useState("all");

  // Pre-configured Elite Formations / Gameplans
  const preconfiguredGameplans = [
    {
      id: "pre_1",
      name: "Bloc Compact 4-4-2 Plat",
      sport: "football",
      description: "Rideau défensif compact étouffant le milieu de terrain. Idéal pour neutraliser une équipe qui domine la possession.",
      author: "THE BOX Pro",
      difficulty: "Intermédiaire",
      keyframesCount: 2,
    },
    {
      id: "pre_2",
      name: "Transition Offensive 4-3-3 Rapide",
      sport: "football",
      description: "Projection rapide des pistons latéraux et ailiers dans les espaces libres suite à une récupération basse.",
      author: "THE BOX Pro",
      difficulty: "Avancé",
      keyframesCount: 3,
    },
    {
      id: "pre_3",
      name: "Défense en Zone 2-3 (Match)",
      sport: "basketball",
      description: "Couverture hermétique de la raquette pour forcer l'adversaire à prendre des tirs lointains sous pression.",
      author: "THE BOX Pro",
      difficulty: "Débutant",
      keyframesCount: 1,
    },
    {
      id: "pre_4",
      name: "Système de Pods d'Avants 1-3-3-1",
      sport: "rugby",
      description: "Organisation rigoureuse des avants sur toute la largeur du terrain pour pilonner la ligne d'avantage de manière cyclique.",
      author: "THE BOX Pro",
      difficulty: "Expert",
      keyframesCount: 2,
    },
    {
      id: "pre_5",
      name: "Système de Relance Rapide à 7m",
      sport: "handball",
      description: "Pivot se projetant dans le dos de la défense centrale avec croisé des ailiers.",
      author: "THE BOX Pro",
      difficulty: "Intermédiaire",
      keyframesCount: 2,
    }
  ];

  // Merge user-saved tactics and preconfigured templates
  const allPlaybooks = [
    ...savedTactics,
    ...preconfiguredGameplans.map(p => ({ ...p, preconfigured: true }))
  ];

  // Filtering logic
  const filteredPlaybooks = allPlaybooks.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSport = selectedSportFilter === "all" || item.sport === selectedSportFilter;
    return matchesSearch && matchesSport;
  });

  const toggleFavorite = (id: string, isPre: boolean) => {
    if (isPre) return; // Cannot favorite preconfigured in this simple layout
    setSavedTactics(
      savedTactics.map((item) => {
        if (item.id === id) {
          return { ...item, favorite: !item.favorite };
        }
        return item;
      })
    );
  };

  const deleteTactic = (id: string, isPre: boolean) => {
    if (isPre) return; // Cannot delete preconfigured templates
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce schéma de jeu ?")) {
      setSavedTactics(savedTactics.filter((item) => item.id !== id));
    }
  };

  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);

  const handleShare = (item: any) => {
    const isObj = typeof item === "object" && item !== null;
    const itemName = isObj ? item.name : String(item);
    const itemSport = isObj ? item.sport : "football";
    const itemDesc = isObj ? item.description : "";
    const playersList = isObj && item.keyframes?.[0]?.players
      ? item.keyframes[0].players
          .filter((t: any) => t.type === "player_a")
          .map((p: any) => ({
            number: p.number || 1,
            name: p.name || `Joueur #${p.number}`,
            position: p.role,
          }))
      : undefined;

    setShareData({
      type: "schema",
      title: itemName,
      sport: itemSport,
      clubName: isObj && item.teamName ? item.teamName : "The Box FC",
      formation: isObj && item.formation ? item.formation : undefined,
      notes: itemDesc || "Schéma de jeu préparé pour l'équipe.",
      players: playersList,
      phasesCount: isObj ? (item.keyframesCount || item.keyframes?.length || 1) : 1,
      imageUrl: isObj && item.previewImage ? item.previewImage : undefined,
    });
    setShareModalOpen(true);
  };

  return (
    <div className="space-y-6 text-brand-ivory" id="strategy-library">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-pine border border-brand-border rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-deep/60 text-brand-cream rounded-lg border border-brand-border">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Bibliothèque de Stratégies</h2>
            <p className="text-xs text-brand-sage font-medium">Gerez, chargez et distribuez vos plans de jeu professionnels</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block text-2xl font-black text-white">{savedTactics.length}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-sage">Sauvegardes</span>
          </div>
          <div className="h-8 w-[1px] bg-brand-border" />
          <div className="text-center">
            <span className="block text-2xl font-black text-brand-cream">{preconfiguredGameplans.length}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-sage">Modèles Pro</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-sage" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une tactique, un plan de jeu, des mots-clés..."
            className="w-full bg-brand-pine border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-brand-ivory placeholder-brand-sage/60 focus:outline-none focus:border-brand-cream transition"
          />
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2 w-full sm:w-auto bg-brand-deep border border-brand-border rounded-lg p-1">
          {["all", "football", "basketball", "rugby", "handball"].map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSportFilter(sport)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition cursor-pointer ${
                selectedSportFilter === sport
                  ? "bg-brand-moss text-brand-cream shadow"
                  : "text-brand-sage hover:text-brand-cream"
              }`}
            >
              {sport === "all" ? "Tous" : sport}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredPlaybooks.length === 0 ? (
        <div className="text-center py-16 bg-brand-pine/50 rounded-xl border border-dashed border-brand-border">
          <ClipboardList className="h-12 w-12 text-brand-sage mx-auto mb-3" />
          <h4 className="text-base font-bold text-brand-sage">Aucun plan de match trouvé</h4>
          <p className="text-xs text-brand-sage/60 mt-1 max-w-sm mx-auto">
            Ajustez votre recherche ou enregistrez un nouveau schéma depuis le tableau tactique interactif pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaybooks.map((item) => {
            const isPre = !!item.preconfigured;
            return (
              <div 
                key={item.id}
                className="bg-brand-pine border border-brand-border rounded-xl hover:border-brand-cream transition duration-200 flex flex-col justify-between overflow-hidden group shadow-lg"
              >
                
                {/* Header card info */}
                <div className="p-4 border-b border-brand-border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-brand-deep text-brand-cream border border-brand-border">
                        {item.sport.toUpperCase()}
                      </span>
                      {isPre && (
                        <span className="text-[10px] font-black text-brand-cream uppercase tracking-widest px-1.5 py-0.5 rounded bg-brand-moss border border-brand-border/40">
                          PRO
                        </span>
                      )}
                    </div>
                    
                    {/* Favorite and Delete controls */}
                    <div className="flex items-center gap-1.5">
                      {!isPre ? (
                        <>
                          <button
                            onClick={() => toggleFavorite(item.id, isPre)}
                            className={`p-1 rounded hover:bg-brand-moss transition cursor-pointer ${
                              item.favorite ? "text-amber-400" : "text-brand-sage hover:text-brand-cream"
                            }`}
                            title="Ajouter aux favoris"
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                          <button
                            onClick={() => deleteTactic(item.id, isPre)}
                            className="p-1 rounded hover:bg-brand-moss text-brand-sage hover:text-rose-400 transition cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-brand-sage">Par {item.author}</span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-brand-cream transition line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-brand-sage mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description || "Aucune consigne rédigée."}
                  </p>
                </div>

                {/* Subinfo and operations */}
                <div className="bg-brand-deep/80 px-4 py-3 flex items-center justify-between text-[11px] text-brand-sage">
                  <div className="flex items-center gap-3">
                    <span>🎬 {item.keyframesCount || item.keyframes?.length || 1} phases</span>
                    {item.difficulty && (
                      <span className="text-[10px] font-bold text-amber-500"> Niveau {item.difficulty}</span>
                    )}
                    {item.date && (
                      <span>Mis à jour : {item.date.split(" ")[0]}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShare(item)}
                      className="p-1.5 hover:text-brand-cream hover:bg-brand-moss rounded transition cursor-pointer"
                      title="Partager le schéma tactique (WhatsApp & Mail)"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onLoadTactic(item)}
                      className="px-2.5 py-1 rounded bg-brand-cream hover:bg-slate-100 text-brand-deep font-black flex items-center gap-0.5 transition shadow cursor-pointer"
                    >
                      <span>Charger</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={shareData}
      />

    </div>
  );
}
