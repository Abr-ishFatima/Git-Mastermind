import React from 'react';
import { GitBranch, GitCommit } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock component for Hackathon. In a real app this would parse git history and render an SVG tree.
// Here we use a stylized CSS visualizer.
interface GitTreeProps {
  nodes: any[];
}

export function GitTree({ nodes }: GitTreeProps) {
  // Hardcoded visual tree for the demo effect
  const demoBranches = [
    { name: 'main', color: 'text-branch-main bg-branch-main/10 border-branch-main' },
    { name: 'feature/login', color: 'text-branch-feature bg-branch-feature/10 border-branch-feature' },
  ];

  return (
    <div className="h-full w-full bg-card/50 rounded-xl border relative overflow-hidden flex flex-col">
      <div className="p-3 border-b flex items-center gap-2 bg-card/80 backdrop-blur-sm z-10">
        <GitBranch className="w-4 h-4 text-primary" />
        <h3 className="font-display font-medium text-sm">Repository State</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-8 relative flex justify-center items-end pb-12">
        {/* Fake Grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Tree visualization (Stylized hardcode for UI aesthetic) */}
        <div className="relative w-64 h-64">
          {/* Trunk line */}
          <div className="absolute left-1/2 bottom-0 top-12 w-1 bg-branch-main -translate-x-1/2 rounded-full" />
          {/* Branch line */}
          <svg className="absolute left-1/2 bottom-20 w-16 h-24 -translate-x-1/2 overflow-visible pointer-events-none">
             <path d="M 0 100 Q 0 50, 40 50 T 64 0" fill="none" stroke="hsl(var(--branch-feature))" strokeWidth="4" strokeLinecap="round" />
          </svg>

          {/* Commits */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full border-4 border-card bg-branch-main shadow-[0_0_15px_hsl(var(--branch-main))] z-10" title="Initial commit" />
          
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="absolute bottom-20 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full border-4 border-card bg-branch-main shadow-[0_0_15px_hsl(var(--branch-main))] z-10" />

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} className="absolute bottom-32 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full border-4 border-card bg-branch-main shadow-[0_0_15px_hsl(var(--branch-main))] z-10" />

          {/* Feature branch commits */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} className="absolute bottom-32 left-[calc(50%+64px)] -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full border-4 border-card bg-branch-feature shadow-[0_0_15px_hsl(var(--branch-feature))] z-10" />
          
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} className="absolute bottom-44 left-[calc(50%+64px)] -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full border-4 border-card bg-branch-feature shadow-[0_0_15px_hsl(var(--branch-feature))] z-10" />

          {/* Labels */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-branch-main/20 text-branch-main px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap">main</div>
          <div className="absolute top-32 left-[calc(50%+64px)] -translate-x-1/2 bg-branch-feature/20 text-branch-feature px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap">feature/login</div>
        </div>

        {/* Dynamic Nodes from API (If they exist, we overlay a simple message) */}
        {nodes.length > 1 && (
          <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 text-primary px-3 py-2 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
             <GitCommit className="w-4 h-4" />
             <span>Tree updated: {nodes.length} commits total</span>
          </div>
        )}
      </div>
    </div>
  );
}
