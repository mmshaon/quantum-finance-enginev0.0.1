\"use client\";

import { useEffect, useState } from \"react\";

export default function Header() {
  const [time, setTime] = useState(\"\");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleString(\"en-US\", { hour12: true }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className=\"flex justify-between items-center p-4 border-b border-cyanGlow\">
      <div className=\"flex items-center gap-3\">
        <div className=\"w-10 h-10 rounded-full bg-cyanGlow\" />
        <div>
          <h1 className=\"text-xl font-bold\">Quantum Finance Engine</h1>
          <p className=\"text-xs\">Created by: Mohammad Maynul Hasan</p>
        </div>
      </div>
      <div className=\"text-sm\">{time}</div>
    </header>
  );
}
