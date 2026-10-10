"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  UserPlus,
  Zap,
  Brain,
  Battery,
  User,
  Check,
  X,
  FileText,
  AlertCircle,
  Activity,
  Flame,
  Moon,
  Shield,
} from "lucide-react";

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
  isModernSleek?: boolean;
}

export default function TeamRoster({ roster, setRoster, isModernSleek = false }: TeamRosterProps) {
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
      notes: notes || "Aucune note"
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
    if (confirm("Supprimer ce joueur de l'effectif ?")) {
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
    <div className={`space-y-5 ${isModernSleek ? "text-slate-900" : "text-slate-100"}`} id="team-roster">
      
      {/* Title Header */}
      <div className={`flex items-center justify-between gap-4 border rounded-2xl p-4 shadow-lg ${
        isModernSleek ? "bg-white border-slate-200" : "bg-[#0d1117] border-[#1f293d]"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isModernSleek ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30"
          }`}>
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
              <span>Effectif & Joueurs</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isModernSleek ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-[#161f30] text-slate-300 border-[#233149]"
              }`}>
                {roster.length} Joueurs
              </span>
            </h2>
            <p className={`text-xs ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Suivi physique et tactique</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-2 bg-[#00E599] hover:bg-[#05be80] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition duration-150 cursor-pointer shrink-0"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isAdding ? "Fermer" : "Ajouter Joueur"}</span>
        </button>
      </div>

      {/* Adding Form Expandable */}
      {isAdding && (
        <form onSubmit={handleAddPlayer} className={`border rounded-2xl p-4 sm:p-5 shadow-2xl animate-fade-in space-y-4 ${
          isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"
        }`}>
          <div className="flex items-center justify-between border-b border-[#1f293d]/60 pb-2">
            <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isModernSleek ? "text-slate-900" : "text-white"
            }`}>
              <UserPlus className="w-4 h-4 text-[#00E599]" />
              <span>Nouveau Joueur</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <User className="w-3.5 h-3.5 text-blue-400" /> Nom
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Kylian Mbappé"
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition border ${
                  isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500" : "bg-[#131b29] border-[#1f293d] text-white focus:border-[#00E599]"
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <span>🔢</span> Maillot
              </label>
              <input
                type="number"
                required
                min={1}
                max={99}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition border ${
                  isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#131b29] border-[#1f293d] text-white focus:border-[#00E599]"
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Poste
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition border ${
                  isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#131b29] border-[#1f293d] text-white focus:border-[#00E599]"
                }`}
              >
                <option value="Gardien de but">Gardien (GK)</option>
                <option value="Défenseur central">Défenseur central (CB)</option>
                <option value="Défenseur latéral">Défenseur latéral (LB/RB)</option>
                <option value="Milieu défensif">Milieu défensif (CDM)</option>
                <option value="Milieu relayeur">Milieu relayeur (CM)</option>
                <option value="Milieu offensif">Milieu offensif (CAM)</option>
                <option value="Ailier / Piston">Ailier / Piston (LW/RW)</option>
                <option value="Avant-centre">Buteur (ST)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Forme
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Player["status"])}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition border ${
                  isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#131b29] border-[#1f293d] text-white"
                }`}
              >
                <option value="normal">✅ Dispo</option>
                <option value="excellent">🔥 Top Forme</option>
                <option value="tired">💤 Fatigué</option>
                <option value="injured">🚨 Blessé</option>
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Vitesse ({speed}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-[#00E599] py-1 cursor-pointer"
              />
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <Brain className="w-3.5 h-3.5 text-purple-400" /> Tactique ({tactics}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={tactics}
                onChange={(e) => setTactics(Number(e.target.value))}
                className="w-full accent-purple-400 py-1 cursor-pointer"
              />
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                <Battery className="w-3.5 h-3.5 text-emerald-400" /> Endurance ({stamina}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={stamina}
                onChange={(e) => setStamina(Number(e.target.value))}
                className="w-full accent-emerald-400 py-1 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Consignes, blessures, repos..."
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border h-14 resize-none ${
                isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400" : "bg-[#131b29] border-[#1f293d] text-white placeholder-slate-500"
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-[#131b29] hover:bg-[#1f293d] border border-[#1f293d] text-xs font-bold rounded-xl text-slate-300 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#00E599] hover:bg-[#05be80] text-slate-950 text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Valider
            </button>
          </div>
        </form>
      )}

      {/* Roster Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {roster.map((p) => {
          // Fitness status badge styling & label
          let statusBadge = (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
              isModernSleek ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            }`}>
              <Check className="w-3 h-3 text-emerald-400" /> Dispo
            </span>
          );

          if (p.status === "excellent") {
            statusBadge = (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                isModernSleek ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}>
                <Flame className="w-3 h-3 text-amber-400" /> Top
              </span>
            );
          } else if (p.status === "tired") {
            statusBadge = (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                isModernSleek ? "bg-blue-100 text-blue-900 border-blue-300" : "bg-blue-500/15 text-blue-300 border-blue-500/30"
              }`}>
                <Moon className="w-3 h-3 text-blue-400" /> Fatigué
              </span>
            );
          } else if (p.status === "injured") {
            statusBadge = (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                isModernSleek ? "bg-rose-100 text-rose-900 border-rose-300" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
              }`}>
                <AlertCircle className="w-3 h-3 text-rose-400" /> Blessé
              </span>
            );
          }

          return (
            <div 
              key={p.id}
              className={`border rounded-2xl p-3.5 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between ${
                isModernSleek 
                  ? "bg-white border-slate-200 hover:border-emerald-400" 
                  : "bg-[#0d1117] border-[#1f293d] hover:border-[#00E599]/40"
              }`}
            >
              {/* Profile Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      isModernSleek
                        ? "bg-slate-100 border-slate-300 text-slate-900"
                        : "bg-[#131b29] border-[#233149] text-[#00E599]"
                    }`}>
                      #{p.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-xs font-black truncate leading-tight ${isModernSleek ? "text-slate-900" : "text-white"}`}>{p.name}</h3>
                      <span className={`text-[10px] font-bold ${isModernSleek ? "text-slate-500" : "text-slate-400"} block truncate`}>{p.position}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {statusBadge}
                  </div>
                </div>

                {/* Performance Stats Bars with Clean Icons */}
                <div className={`py-2 space-y-1.5 border-t border-b my-2.5 ${
                  isModernSleek ? "border-slate-100" : "border-[#1f293d]"
                }`}>
                  {/* Speed */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                        <Zap className="w-3 h-3 text-amber-400" /> Vitesse
                      </span>
                      <span className="font-mono font-black text-amber-400">{p.stats.speed}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isModernSleek ? "bg-slate-100" : "bg-[#131b29]"}`}>
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${p.stats.speed}%` }} />
                    </div>
                  </div>

                  {/* Tactics */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                        <Brain className="w-3 h-3 text-purple-400" /> Tactique
                      </span>
                      <span className="font-mono font-black text-purple-400">{p.stats.tactics}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isModernSleek ? "bg-slate-100" : "bg-[#131b29]"}`}>
                      <div className="bg-purple-400 h-full rounded-full transition-all duration-300" style={{ width: `${p.stats.tactics}%` }} />
                    </div>
                  </div>

                  {/* Stamina */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                        <Battery className="w-3 h-3 text-emerald-400" /> Endurance
                      </span>
                      <span className="font-mono font-black text-emerald-400">{p.stats.stamina}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isModernSleek ? "bg-slate-100" : "bg-[#131b29]"}`}>
                      <div className="bg-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${p.stats.stamina}%` }} />
                    </div>
                  </div>
                </div>

                {/* Notes Pill */}
                {p.notes && p.notes !== "Aucune note" && (
                  <p className={`text-[10px] leading-relaxed italic p-2 rounded-xl border flex items-start gap-1.5 ${
                    isModernSleek ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-[#131b29]/80 border-[#1f293d] text-slate-400"
                  }`}>
                    <FileText className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                    <span className="truncate">{p.notes}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons Toolbar with Icon Toggles & Tooltips */}
              <div className={`mt-3 pt-2 border-t flex items-center justify-between ${
                isModernSleek ? "border-slate-100" : "border-[#1f293d]"
              }`}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updatePlayerStatus(p.id, "normal")}
                    className={`h-7 px-2 rounded-lg text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                      p.status === "normal"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                        : isModernSleek
                          ? "bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                          : "bg-[#131b29] text-slate-400 hover:text-white border-[#1f293d]"
                    }`}
                    title="Statut : Disponible"
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => updatePlayerStatus(p.id, "excellent")}
                    className={`h-7 px-2 rounded-lg text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                      p.status === "excellent"
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-black"
                        : isModernSleek
                          ? "bg-slate-100 text-slate-600 hover:text-amber-600 border-slate-200"
                          : "bg-[#131b29] text-slate-400 hover:text-amber-400 border-[#1f293d]"
                    }`}
                    title="Statut : Top Forme"
                  >
                    <Flame className="w-3 h-3 text-amber-400" />
                  </button>

                  <button
                    onClick={() => updatePlayerStatus(p.id, "tired")}
                    className={`h-7 px-2 rounded-lg text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                      p.status === "tired"
                        ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                        : isModernSleek
                          ? "bg-slate-100 text-slate-600 hover:text-blue-600 border-slate-200"
                          : "bg-[#131b29] text-slate-400 hover:text-blue-400 border-[#1f293d]"
                    }`}
                    title="Statut : Fatigué"
                  >
                    <Moon className="w-3 h-3 text-blue-400" />
                  </button>

                  <button
                    onClick={() => updatePlayerStatus(p.id, "injured")}
                    className={`h-7 px-2 rounded-lg text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                      p.status === "injured"
                        ? "bg-rose-600 text-white border-rose-500 shadow-xs"
                        : isModernSleek
                          ? "bg-slate-100 text-slate-600 hover:text-rose-600 border-slate-200"
                          : "bg-[#131b29] text-slate-400 hover:text-rose-400 border-[#1f293d]"
                    }`}
                    title="Statut : Blessé / Indisponible"
                  >
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                  </button>
                </div>

                <button
                  onClick={() => handleDeletePlayer(p.id)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    isModernSleek
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                      : "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50"
                  }`}
                  title="Supprimer ce joueur de l'effectif"
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
