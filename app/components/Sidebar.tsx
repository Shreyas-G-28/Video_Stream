import React from 'react';
import { Home, Compass, PlaySquare, Clock, ThumbsUp } from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  currentView: string;
  navigateTo: (view: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: "Home" },
  { id: 'shorts', icon: Compass, label: "Shorts" },
  { id: 'subs', icon: PlaySquare, label: "Subscriptions" },
  { id: 'divider1', isDivider: true },
  { id: 'history', icon: Clock, label: "History" },
  { id: 'liked', icon: ThumbsUp, label: "Liked videos" }
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, currentView, navigateTo }) => (
  <aside className={`${sidebarOpen ? 'w-[240px] px-3' : 'w-[72px] px-1'} hidden md:flex flex-col gap-1 py-3 overflow-y-auto flex-shrink-0 transition-all duration-200 border-r border-zinc-800/50 bg-[#0f0f0f] h-full select-none`}>
    {sidebarOpen ? (
      navItems.map((item, idx) => item.isDivider ? (
        <div key={`div-${idx}`} className="my-2 border-t border-zinc-800"></div>
      ) : (
        item.icon && (
          <button
            key={item.id}
            type="button"
            onClick={() => navigateTo(item.id as string)}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg cursor-pointer text-left ${currentView === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-100 hover:bg-zinc-800'}`}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        )
      ))
    ) : (
      navItems.filter(i => !i.isDivider).slice(0, 2).map((item, idx) => (
        item.icon && (
          <button
            key={`small-${idx}`}
            type="button"
            onClick={() => navigateTo(item.id as string)}
            className="w-full flex flex-col items-center justify-center gap-1 p-4 rounded-xl hover:bg-zinc-800 cursor-pointer text-zinc-100"
          >
            <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2}/>
            <span className="text-[10px]">{item.label}</span>
          </button>
        )
      ))
    )}
  </aside>
);

export default Sidebar;