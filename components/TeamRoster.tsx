"use client";

import React, { useState } from "react";
import { Plus, Trash2, ShieldAlert, Sparkles, UserPlus, Heart, Zap, Award, Edit, Check } from "lucide-react";

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  status: "excellent" | "tired" | "injured" | "normal";
  stats: {
    speed: number;   // 1-100
    tactics: number; // 1-100
    stamina: number; // 1-100
  };
  notes?: string;
}

interface TeamRosterProps {
  roster: Player[];
  setRoster: React.Dispatch<React.SetStateAction<Player[]>>;
}

export default function TeamRoster({ roster, setRoster }: TeamRosterProps) {
  // New player input state
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState(10);
  const [position, setPosition] = useState("Milieu de terrain");
  const [status, setStatus] = useState<Player["status"]>("normal");
  const [speed, setSpeed] = useState(80);
  const [tactics, setTactics] = useState(75);
  const [stamina, setStamina] = useState(85);
  const [notes, setNotes] = useState("");

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name,
      number: Number(number),
      position,
      status,
      stats: {
        speed: Number(speed),
        tactics: Number(tactics),
        stamina: Number(stamina)
      },
      notes: notes || "Aucune note particulière"
    };

    setRoster([...roster, newPlayer]);
    setIsAdding(false);
    
    // Reset fields
    setName("");
    setNumber(12);
    setPosition("Milieu de terrain");
    setStatus("normal");
    setSpeed(75);
    setTactics(75);
    setStamina(75);
    setNotes("");
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm("Voulez-vous supprimer ce joueur de votre effectif ?")) {
      setRoster(roster.filter((p) => p.id !== id));
    }
  };

  const updatePlayerStatus = (id: string, newStatus: Player["status"]) => {
    setRoster(roster.map((p) => {
      if (p.id === id) {
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6 text-slate-100" id="team-roster">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-900/40">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Gestion d&apos;Effectif & Roster</h2>
            <p className="text-xs text-slate-400">Suivi physique, performances et statistiques individuelles des joueurs</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-brand-cream hover:bg-slate-100 text-brand-deep font-black text-xs rounded-lg flex items-center gap-2 shadow-lg transition duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{isAdding ? "Fermer le formulaire" : "Ajouter un Joueur"}</span>
        </button>
      </div>

      {/* Adding Form Expandable */}
      {isAdding && (
        <form onSubmit={handleAddPlayer} className="bg-brand-pine border border-brand-border rounded-xl p-5 shadow-2xl animate-fade-in space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-brand-border pb-2">
            🆕 Fiche de Nouveau Joueur
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Kylian Mbappé"
                className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory placeholder-brand-sage/60 focus:outline-none focus:border-brand-cream transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Numéro de maillot</label>
              <input
                type="number"
                required
                min={1}
                max={99}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory focus:outline-none focus:border-brand-cream transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Poste / Rôle</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory focus:outline-none focus:border-brand-cream transition"
              >
                <option value="Gardien de but">Gardien de but (GK)</option>
                <option value="Défenseur central">Défenseur central (CB)</option>
                <option value="Défenseur latéral">Défenseur latéral (LB/RB)</option>
                <option value="Milieu défensif">Milieu défensif (CDM)</option>
                <option value="Milieu relayeur">Milieu relayeur (CM)</option>
                <option value="Milieu offensif">Milieu offensif (CAM)</option>
                <option value="Ailier / Piston">Ailier / Piston (LW/RW)</option>
                <option value="Avant-centre">Avant-centre / Buteur (ST)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">État de forme physique</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Player["status"])}
                className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory focus:outline-none focus:border-brand-cream transition"
              >
                <option value="normal">Normal / Disponible</option>
                <option value="excellent">🔥 Forme Excellente</option>
                <option value="tired">💤 Fatigué (Ménagement)</option>
                <option value="injured">🚨 Blessé / Indisponible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Vitesse ({speed}/100)</label>
              <input
                type="range"
                min={1}
                max={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-brand-cream py-1.5 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Intelligence Tactique ({tactics}/100)</label>
              <input
                type="range"
                min={1}
                max={100}
                value={tactics}
                onChange={(e) => setTactics(Number(e.target.value))}
                className="w-full accent-brand-cream py-1.5 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Endurance ({stamina}/100)</label>
              <input
                type="range"
                min={1}
                max={100}
                value={stamina}
                onChange={(e) => setStamina(Number(e.target.value))}
                className="w-full accent-brand-cream py-1.5 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sage uppercase mb-1">Notes de préparation athlétique / blessures</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Douleur légère à la cheville droite. Repos préconisé pendant les 2 prochains entraînements."
              className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory placeholder-brand-sage/60 focus:outline-none focus:border-brand-cream transition h-16 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-brand-deep hover:bg-brand-moss border border-brand-border text-xs font-semibold rounded text-brand-sage cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-cream hover:bg-slate-100 text-brand-deep text-xs font-black rounded shadow-md cursor-pointer"
            >
              Ajouter au Roster
            </button>
          </div>
        </form>
      )}

      {/* Roster Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roster.map((p) => {
          
          // Class colors according to physical fitness status
          let statusLabel = "Disponible";
          let statusColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
          if (p.status === "excellent") {
            statusLabel = "🔥 Forme Excellente";
            statusColor = "bg-teal-500/15 text-teal-300 border-teal-500/20";
          } else if (p.status === "tired") {
            statusLabel = "💤 Fatigué";
            statusColor = "bg-amber-500/15 text-amber-400 border-amber-500/20";
          } else if (p.status === "injured") {
            statusLabel = "🚨 Blessé";
            statusColor = "bg-rose-500/15 text-rose-400 border-rose-500/25";
          }

          return (
            <div 
              key={p.id}
              className="bg-brand-pine border border-brand-border rounded-xl p-4 shadow-lg hover:border-brand-cream transition flex flex-col justify-between"
            >
              {/* Profile card title */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-deep border border-brand-border flex items-center justify-center font-black text-brand-cream text-sm">
                      {p.number}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-none">{p.name}</h3>
                      <span className="text-[10px] text-brand-sage font-semibold">{p.position}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Performance stats progress */}
                <div className="py-2.5 space-y-1.5 border-t border-b border-brand-border my-3">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-brand-sage">
                      <span className="flex items-center gap-1">💨 Vitesse</span>
                      <span className="font-bold">{p.stats.speed}%</span>
                    </div>
                    <div className="w-full bg-brand-deep h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${p.stats.speed}%` }} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-brand-sage">
                      <span className="flex items-center gap-1">🧠 Intelligence Tactique</span>
                      <span className="font-bold">{p.stats.tactics}%</span>
                    </div>
                    <div className="w-full bg-brand-deep h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-cream h-full rounded-full" style={{ width: `${p.stats.tactics}%` }} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-brand-sage">
                      <span className="flex items-center gap-1">🔋 Endurance</span>
                      <span className="font-bold">{p.stats.stamina}%</span>
                    </div>
                    <div className="w-full bg-brand-deep h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${p.stats.stamina}%` }} />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <p className="text-[10px] text-brand-sage leading-relaxed italic bg-brand-deep/50 p-2 rounded border border-brand-border">
                  {p.notes || "Aucune note consignée."}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updatePlayerStatus(p.id, "excellent")}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs transition border ${
                      p.status === "excellent" ? "bg-teal-500 text-white border-teal-600" : "bg-slate-950 text-slate-400 hover:text-brand-cream border-slate-800"
                    }`}
                    title="Mettre en forme excellente"
                  >
                    🔥
                  </button>
                  <button
                    onClick={() => updatePlayerStatus(p.id, "tired")}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs transition border ${
                      p.status === "tired" ? "bg-amber-500 text-slate-900 border-amber-600" : "bg-slate-950 text-slate-400 hover:text-brand-cream border-slate-800"
                    }`}
                    title="Marquer fatigué"
                  >
                    💤
                  </button>
                  <button
                    onClick={() => updatePlayerStatus(p.id, "injured")}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs transition border ${
                      p.status === "injured" ? "bg-rose-600 text-white border-rose-700" : "bg-slate-950 text-slate-400 hover:text-brand-cream border-slate-800"
                    }`}
                    title="Marquer blessé"
                  >
                    🚨
                  </button>
                </div>

                <button
                  onClick={() => handleDeletePlayer(p.id)}
                  className="p-1.5 rounded bg-slate-950 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 transition"
                  title="Supprimer de l'équipe"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
