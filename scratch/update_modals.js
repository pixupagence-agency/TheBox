const fs = require('fs');

const filePath = 'components/TacticsBoard.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] max-w-md w-full rounded-2xl p-6 shadow-2xl relative">',
    to: '<div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl relative border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] max-w-xl w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">',
    to: '<div className={`max-w-xl w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] max-w-lg w-full rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">',
    to: '<div className={`max-w-lg w-full rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] max-w-4xl w-full rounded-2xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden">',
    to: '<div className={`max-w-4xl w-full rounded-2xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0b1019] border border-cyan-500/40 max-w-4xl w-full rounded-2xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden">',
    to: '<div className={`max-w-4xl w-full rounded-2xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1019] border-cyan-500/40 text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] w-full max-w-6xl rounded-2xl p-4 sm:p-6 shadow-2xl relative my-auto space-y-4 max-h-[95vh] overflow-y-auto">',
    to: '<div className={`w-full max-w-6xl rounded-2xl p-4 sm:p-6 shadow-2xl relative my-auto space-y-4 max-h-[95vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">',
    to: '<div className={`w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border border-[#1f293d] w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto">',
    to: '<div className={`w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border-2 border-[#00E599]/60 max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4">',
    to: '<div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4 border-2 ${isModernSleek ? "bg-white border-emerald-500/60 text-slate-900" : "bg-[#0d1117] border-[#00E599]/60 text-white"}`}>'
  },
  {
    from: '<div className="bg-[#0d1117] border-2 border-amber-500/60 max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4">',
    to: '<div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4 border-2 ${isModernSleek ? "bg-white border-amber-500/60 text-slate-900" : "bg-[#0d1117] border-amber-500/60 text-white"}`}>'
  }
];

let count = 0;
for (const r of replacements) {
  if (code.includes(r.from)) {
    code = code.split(r.from).join(r.to);
    count++;
  } else {
    console.log('Target string not found:', r.from.slice(0, 40));
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log(`Successfully updated ${count} modal containers.`);
