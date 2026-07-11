const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNavigation.tsx', 'utf8');

const newMotionDivStart = `<motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
        }}
        className="relative w-[90%] max-w-md h-[50px] rounded-[25px] flex items-center justify-around px-4 pointer-events-auto"
      >`;

const regex = /<motion\.div\s+initial=\{\{ y: 50, opacity: 0 \}\}\s+animate=\{\{ y: 0, opacity: 1 \}\}\s+transition=\{\{ duration: 0\.45, ease: \[0\.16, 1, 0\.3, 1\] \}\}\s+style=\{\{[\s\S]*?className="relative w-\[90%\] max-w-md h-\[56px\] rounded-\[30px\] flex items-center justify-around px-4 pointer-events-auto"\s*>/;

code = code.replace(regex, newMotionDivStart);

// Reduce AI button size and positioning to fit 50px height
code = code.replace(/className="absolute -top-\[8px\] w-\[36px\] h-\[36px\] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"/g, `className="absolute -top-[10px] w-[34px] h-[34px] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"`);

// Adjust the other buttons height to fit
code = code.replace(/className="relative flex flex-col items-center justify-center w-\[48px\] h-\[44px\] cursor-pointer group focus:outline-none select-none"/g, 'className="relative flex flex-col items-center justify-center w-[48px] h-[40px] cursor-pointer group focus:outline-none select-none"');

fs.writeFileSync('src/components/BottomNavigation.tsx', code);
