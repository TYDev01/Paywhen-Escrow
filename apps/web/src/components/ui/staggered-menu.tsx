"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import "./staggered-menu.css";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  isFixed?: boolean;
}

const defaultColors = ["#B497CF", "#5227FF"];

// Adapted from React Bits' GSAP StaggeredMenu for an existing site header.
export function StaggeredMenu({
  position = "right",
  colors = defaultColors,
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl,
  menuButtonColor = "#fff",
  openMenuButtonColor = "#fff",
  accentColor = "#5227FF",
  changeMenuColorOnOpen = true,
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(false);
  const layerColors = colors.length ? colors.slice(0, 4) : defaultColors;
  const layerCount = layerColors.length;
  const itemCount = items.length;
  const socialCount = displaySocials ? socialItems.length : 0;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const layers = root.querySelectorAll(".sm-prelayer");
      const items = root.querySelectorAll(".sm-panel-itemLabel");
      const numbered = root.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item");
      const socials = root.querySelectorAll(".sm-socials-title, .sm-socials-link");
      const panel = panelRef.current;
      const toggle = toggleRef.current;
      const labels = root.querySelector(".sm-toggle-textInner");
      const icon = root.querySelector(".sm-icon");
      if (!panel || !toggle || !labels || !icon) return;

      const offscreen = position === "left" ? -100 : 100;
      const panelStart = layerCount * 0.065;
      gsap.set([...layers, panel], { x: 0, xPercent: offscreen });
      gsap.set(items, { yPercent: 120, rotation: 7 });
      gsap.set(numbered, { "--sm-num-opacity": 0 });
      gsap.set(socials, { y: 14, opacity: 0 });

      const timeline = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
      timeline
        .to(layers, { xPercent: 0, duration: 0.46, stagger: 0.065 }, 0)
        .to(panel, { xPercent: 0, duration: 0.57 }, panelStart)
        .to(labels, { yPercent: -50, duration: 0.42 }, 0)
        .to(icon, { rotation: 225, duration: 0.54 }, 0);
      if (items.length) {
        timeline.to(items, { yPercent: 0, rotation: 0, duration: 0.62, stagger: 0.055 }, panelStart + 0.1);
      }
      if (numbered.length) {
        timeline.to(numbered, { "--sm-num-opacity": 1, duration: 0.36, stagger: 0.055 }, panelStart + 0.2);
      }
      if (socials.length) {
        timeline.to(socials, { y: 0, opacity: 1, duration: 0.44, stagger: 0.045 }, panelStart + 0.3);
      }
      if (changeMenuColorOnOpen) {
        timeline.to(toggle, { color: openMenuButtonColor, duration: 0.3 }, 0.12);
      }

      timeline.progress(openRef.current ? 1 : 0).pause();
      timelineRef.current = timeline;
    }, root);

    return () => {
      context.revert();
      timelineRef.current = null;
    };
  }, [position, layerCount, itemCount, socialCount, displayItemNumbering, changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const setMenuOpen = useCallback((next: boolean) => {
    if (openRef.current === next) return;
    openRef.current = next;
    setOpen(next);

    const timeline = timelineRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timeline?.progress(next ? 1 : 0).pause();
    } else if (next) {
      timeline?.timeScale(1).play();
    } else {
      timeline?.timeScale(2).reverse();
    }

    if (next) onMenuOpen?.();
    else onMenuClose?.();
  }, [onMenuOpen, onMenuClose]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      toggleRef.current?.focus();
      setMenuOpen(false);
    };
    const handleOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        if (panelRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    if (closeOnClickAway) document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [open, closeOnClickAway, setMenuOpen]);

  function closeAfterNavigation() {
    toggleRef.current?.focus();
    setMenuOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={["staggered-menu-wrapper", isFixed && "sm-fixed", className].filter(Boolean).join(" ")}
      style={{ "--sm-accent": accentColor, "--sm-toggle-color": menuButtonColor } as CSSProperties}
      data-position={position}
      data-open={open || undefined}
    >
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" width={110} height={24} className="sm-logo-img" />
      )}
      <button
        ref={toggleRef}
        className="sm-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setMenuOpen(!openRef.current)}
        type="button"
      >
        <span className="sm-toggle-textWrap" aria-hidden="true">
          <span className="sm-toggle-textInner"><span>Menu</span><span>Close</span></span>
        </span>
        <span className="sm-icon" aria-hidden="true" />
      </button>

      <div className="sm-canvas">
        <div className="sm-prelayers" aria-hidden="true">
          {layerColors.map((color, index) => (
            <div key={index} className="sm-prelayer" style={{ background: color }} />
          ))}
        </div>
        <nav
          ref={panelRef}
          id={panelId}
          className="staggered-menu-panel"
          aria-label="Explore Escrow"
          aria-hidden={!open}
          inert={!open}
        >
          <p className="sm-panel-title">Explore Escrow</p>
          <ul className="sm-panel-list" data-numbering={displayItemNumbering || undefined}>
            {items.map(({ label, link, ariaLabel }) => (
              <li className="sm-panel-itemWrap" key={link}>
                <Link className="sm-panel-item" href={link} aria-label={ariaLabel} onNavigate={closeAfterNavigation}>
                  <span className="sm-panel-itemLabel">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {socialCount > 0 && (
            <div className="sm-socials">
              <p className="sm-socials-title">Social links</p>
              <ul className="sm-socials-list">
                {socialItems.map(({ label, link }) => (
                  <li key={link}>
                    <a href={link} className="sm-socials-link" target="_blank" rel="noopener noreferrer">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}

export default StaggeredMenu;
