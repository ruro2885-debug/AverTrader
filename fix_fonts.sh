#!/bin/bash

# Loader.tsx
sed -i 's/tracking-\[0.4em\] text-gray-500 font-mono uppercase/font-bold tracking-\[0.2em\] text-gray-500 font-mono uppercase/g' src/components/Loader.tsx

# TechInnovations.tsx
sed -i 's/text-xs font-mono uppercase tracking-\[0.3em\] text-emerald-400/text-xs font-bold font-mono uppercase tracking-\[0.15em\] text-emerald-400/g' src/components/TechInnovations.tsx

# Features.tsx
sed -i 's/text-xs font-mono uppercase tracking-\[0.3em\] text-emerald-400/text-xs font-bold font-mono uppercase tracking-\[0.15em\] text-emerald-400/g' src/components/Features.tsx

sed -i 's/text-\[10px\] font-mono uppercase tracking-widest/text-\[10px\] font-bold font-mono uppercase tracking-wider/g' src/components/Features.tsx

# Stats.tsx
sed -i 's/text-\[10px\] font-mono tracking-\[0.2em\] text-gray-500 uppercase/text-\[10px\] font-bold font-mono tracking-widest text-gray-500 uppercase/g' src/components/Stats.tsx

# PlatformShowcase.tsx
sed -i 's/font-bold tracking-widest uppercase/font-bold tracking-wider uppercase/g' src/components/PlatformShowcase.tsx
sed -i 's/text-xs font-mono tracking-widest uppercase/text-xs font-bold font-mono tracking-wider uppercase/g' src/components/PlatformShowcase.tsx

