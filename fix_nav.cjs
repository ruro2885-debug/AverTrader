const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNavigation.tsx', 'utf8');

// Replace the <motion.div style={{...}} className="...">...</div> with a new simpler glassy version

const newMotionDivStart = `<motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        className="relative w-[90%] max-w-md h-[56px] rounded-[30px] flex items-center justify-around px-4 pointer-events-auto"
      >`;

const regex = /<motion\.div\s+initial=\{\{ y: 50, opacity: 0 \}\}\s+animate=\{\{ y: 0, opacity: 1 \}\}\s+transition=\{\{ duration: 0\.45, ease: \[0\.16, 1, 0\.3, 1\] \}\}\s+style=\{\{[\s\S]*?className="relative w-\[90%\] max-w-md h-\[58px\] backdrop-blur-\[36px\] backdrop-saturate-\[2\.0\] border rounded-\[30px\] flex items-center justify-between px-5 pointer-events-auto overflow-visible"\s*>/;

code = code.replace(regex, newMotionDivStart);

// Remove the complex dynamic refraction layers
const refractionRegex = /\{\/\* Dynamic Refraction & Bevel Highlight Layer \*\/\}[\s\S]*?\{\/\* Subtle green ambient glass reflections inside from Aver branding \*\/\}[\s\S]*?<\/div>/;

code = code.replace(refractionRegex, '');

// Adjust ai icon size slightly so it doesn't break the smaller height
code = code.replace(/className="absolute -top-\[10px\] w-\[38px\] h-\[38px\] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"/g, `className="absolute -top-[8px] w-[36px] h-[36px] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"`);

// Remove text labels to make it more compact or just make them smaller. "Ensure the icons and text labels within the bar are spaced cleanly to fit the new, smaller height."
code = code.replace(/<span\s+className=\{\`text-\[11px\]/g, '<span\n                  className={`text-[9px]');
code = code.replace(/className=\{\`w-\[22px\] h-\[22px\] transition-all duration-220/g, 'className={`w-[18px] h-[18px] transition-all duration-220');
code = code.replace(/<item\.icon className="relative w-5 h-5/g, '<item.icon className="relative w-4 h-4');

code = code.replace(/className="relative flex flex-col items-center justify-center w-\[54px\] h-\[48px\] cursor-pointer group focus:outline-none select-none"/g, 'className="relative flex flex-col items-center justify-center w-[48px] h-[44px] cursor-pointer group focus:outline-none select-none"');

fs.writeFileSync('src/components/BottomNavigation.tsx', code);
