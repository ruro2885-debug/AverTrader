#!/bin/bash

# TechInnovations.tsx
sed -i 's/text-xs font-mono text-emerald-400 uppercase tracking-widest/text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider/g' src/components/TechInnovations.tsx

# Hero.tsx
sed -i 's/text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest/text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider/g' src/components/Hero.tsx

# AverLogo.tsx
sed -i 's/tracking-\[0.2em\] text-emerald-400 font-bold uppercase/tracking-widest text-emerald-400 font-bold uppercase/g' src/components/AverLogo.tsx

