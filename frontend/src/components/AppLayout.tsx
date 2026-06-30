import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, Home, PlusCircle } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/bounties", label: "Bounties", icon: ClipboardList },
  { to: "/post", label: "Post", icon: PlusCircle },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-[#08090c]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
          <NavLink to="/" className="min-w-0 flex-1 sm:flex-none">
            <span className="block text-base font-semibold leading-tight text-white">
              BountyBoard
            </span>
            <span className="hidden text-xs text-zinc-400 sm:block">
              Post it. Claim it. Get paid on-chain.
            </span>
          </NavLink>
          <nav className="order-3 grid w-full grid-cols-3 gap-1 sm:order-none sm:flex sm:w-auto sm:items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm transition sm:justify-start",
                      isActive
                        ? "bg-emerald-500 text-zinc-950"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white",
                    ].join(" ")
                  }
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <WalletConnect />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
