const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNavigation.tsx', 'utf8');

const newMotionDivStart = `<motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 10px 20px rgba(0, 0, 0, 0.4)'
        }}
        className="relative w-full max-w-md h-[44px] rounded-[22px] flex items-center justify-around px-4 pointer-events-auto"
      >`;

const regex = /<motion\.div\s+initial=\{\{ y: 50, opacity: 0 \}\}\s+animate=\{\{ y: 0, opacity: 1 \}\}\s+transition=\{\{ duration: 0\.45, ease: \[0\.16, 1, 0\.3, 1\] \}\}\s+style=\{\{[\s\S]*?className="relative w-\[90%\] max-w-md h-\[50px\] rounded-\[25px\] flex items-center justify-around px-4 pointer-events-auto"\s*>/;

code = code.replace(regex, newMotionDivStart);

// Reduce AI button size and positioning to fit 44px height
code = code.replace(/className="absolute -top-\[10px\] w-\[34px\] h-\[34px\] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"/g, `className="absolute -top-[12px] w-[32px] h-[32px] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"`);

// Adjust the other buttons height to fit
code = code.replace(/className="relative flex flex-col items-center justify-center w-\[48px\] h-\[40px\] cursor-pointer group focus:outline-none select-none"/g, 'className="relative flex flex-col items-center justify-center w-[48px] h-[36px] cursor-pointer group focus:outline-none select-none"');

code = code.replace(/className="fixed bottom-\[16px\] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"/, `className="fixed bottom-[12px] left-[15px] right-[15px] z-50 flex justify-center pointer-events-none"`);

fs.writeFileSync('src/components/BottomNavigation.tsx', code);
