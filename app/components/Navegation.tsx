"use client";

import { Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
      const ids = ["inicio", "estadisticas", "condiciones", "prevencion", "audio"];
      const y = window.scrollY + 100;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const h = el.offsetHeight;
          if (y >= top && y < top + h) {
            setActive(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  const items = [
    { id: "inicio", label: "Inicio" },
    { id: "estadisticas", label: "Estadísticas" },
    { id: "condiciones", label: "Condiciones" },
    { id: "prevencion", label: "Prevención" },
    { id: "audio", label: "Audio Cardíaco" },
  ];

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur transition ${
        isScrolled ? "border-slate-200 shadow-sm" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-2 text-blue-600"
          onClick={(e) => {
            e.preventDefault();
            go("inicio");
          }}
        >
          <Heart className="h-6 w-6" />
          <span className="text-lg font-bold">Core AI</span>
        </button>

        <ul className="hidden gap-8 md:flex">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => go(it.id)}
                className={`border-b-2 pb-1 text-sm font-medium transition ${
                  active === it.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-700 hover:text-blue-600"
                }`}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden text-slate-700"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <ul className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => go(it.id)}
                  className={`w-full text-left text-base font-medium ${
                    active === it.id ? "text-blue-600" : "text-slate-700"
                  }`}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}