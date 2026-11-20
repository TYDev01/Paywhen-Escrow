"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { authedFetch, getAccessToken, logout } from "@/lib/auth-store";
import { Brand, BrandMark } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { WorkspaceAvatar } from "./workspace-avatar";
import { WorkspaceIcon, type WorkspaceIconName } from "./workspace-icon";

export interface AccountProfile {
  legalName: string | null;
  phone: string | null;
  country: string | null;
}

interface Account {
  displayName: string;
  email: string;
  emailVerified: boolean;
  verification: string;
  profile: AccountProfile | null;
  avatarUrl: string | null;
}

type AccountChanges = Partial<Pick<Account, "displayName" | "profile" | "verification" | "avatarUrl">>;
const AccountContext = createContext<{
  account: Account;
  updateAccount: (changes: AccountChanges) => void;
} | null>(null);

export function useWorkspaceAccount() {
  return useContext(AccountContext)?.account ?? null;
}

export function useWorkspaceAccountUpdate() {
  return useContext(AccountContext)?.updateAccount;
}

type NavItem = { href: string; label: string; icon: WorkspaceIconName };
const navGroups: { heading: string; items: NavItem[] }[] = [
  {
    heading: "General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "overview" },
      { href: "/dashboard/transactions", label: "Transactions", icon: "history" },
    ],
  },
  {
    heading: "Escrow",
    items: [
      { href: "/dashboard/buy", label: "Buy", icon: "buy" },
      { href: "/dashboard/sell", label: "Sell", icon: "sell" },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/dashboard/disputes", label: "Disputes", icon: "dispute" },
      { href: "/dashboard/support", label: "Support tickets", icon: "support" },
      { href: "/dashboard/settings", label: "Account settings", icon: "settings" },
    ],
  },
];

const COLLAPSE_KEY = "escrow.sidebarCollapsed";
const THEME_KEY = "escrow.theme";

// Title shown in the top header for each route.
const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard/transactions", title: "Transactions" },
  { prefix: "/dashboard/buy", title: "Buy" },
  { prefix: "/dashboard/sell", title: "Sell" },
  { prefix: "/dashboard/disputes", title: "Disputes" },
  { prefix: "/dashboard/support", title: "Support tickets" },
  { prefix: "/dashboard/settings", title: "Account settings" },
  { prefix: "/dashboard/profile", title: "Profile" },
  { prefix: "/dashboard/kyc", title: "Identity verification" },
  { prefix: "/dashboard/new", title: "Create escrow" },
];
function pageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  return PAGE_TITLES.find((p) => pathname === p.prefix || pathname.startsWith(p.prefix + "/"))?.title ?? "Dashboard";
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuToggle = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [accountError, setAccountError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const updateAccount = useCallback((changes: AccountChanges) => {
    setAccount((current) => current ? { ...current, ...changes } : current);
  }, []);
  const accountContext = useMemo(
    () => account ? { account, updateAccount } : null,
    [account, updateAccount],
  );

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }

    const request = new AbortController();
    authedFetch<Account>("/me", { signal: request.signal })
      .then((data) => { if (!request.signal.aborted) setAccount(data); })
      .catch((error: unknown) => {
        if (request.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setAccountError(true);
      });

    return () => request.abort();
  }, [attempt, router]);

  // Restore the collapsed preference (desktop only), then persist on change.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "true");
    } catch {
      /* storage unavailable */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  // Restore the theme (stored choice, else the OS preference), then apply it.
  useEffect(() => {
    let initial: "light" | "dark" = "light";
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") initial = stored;
      else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) initial = "dark";
    } catch {
      /* storage unavailable */
    }
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((value) => {
      const next = value === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  async function signOut() {
    setSigningOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="workspace" data-collapsed={collapsed}>
      <header className="workspace-mobile-header">
        <Brand />
        <button ref={menuToggle} className="workspace-menu-toggle" type="button" aria-controls="workspace-sidebar"
          aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <WorkspaceIcon name={menuOpen ? "close" : "menu"} /> {menuOpen ? "Close" : "Menu"}
        </button>
      </header>
      <aside id="workspace-sidebar" className="workspace-sidebar" data-open={menuOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            closeMenu();
            menuToggle.current?.focus();
          }
        }}>
        <div className="workspace-sidebar-brand">
          {collapsed ? (
            <Link href="/" aria-label="Escrow home" className="text-primary">
              <BrandMark className="size-8" />
            </Link>
          ) : (
            <Brand />
          )}
          <button
            type="button"
            className="workspace-collapse-toggle"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <WorkspaceIcon name="panel" />
          </button>
        </div>
        {account && (
          <Link href="/dashboard/profile" className="workspace-sidebar-profile" onClick={closeMenu}
            title={collapsed ? account.displayName : undefined}>
            <WorkspaceAvatar name={account.displayName} avatarUrl={account.avatarUrl} />
            <strong className="workspace-nav-label">{account.displayName}</strong>
          </Link>
        )}
        <nav className="workspace-nav" aria-label="Workspace">
          {navGroups.map((group) => (
            <div key={group.heading} className="workspace-nav-group" role="group" aria-label={group.heading}>
              <p className="workspace-nav-heading">{group.heading}</p>
              {group.items.map(({ href, label, icon }) => {
                const isPage = pathname === href;
                const isSection = href !== "/dashboard" && pathname.startsWith(href + "/");
                return (
                  <Link key={href} className="workspace-nav-link" href={href}
                    aria-current={isPage ? "page" : isSection ? "location" : undefined}
                    onClick={closeMenu} title={collapsed ? label : undefined}>
                    <WorkspaceIcon name={icon} />
                    <span className="workspace-nav-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="workspace-sidebar-floor">
          <Link href="/faq" className="workspace-nav-link" title={collapsed ? "Help center" : undefined}>
            <WorkspaceIcon name="help" />
            <span className="workspace-nav-label">Help center</span>
          </Link>
          <button type="button" className="workspace-nav-link" onClick={signOut} disabled={signingOut}
            title={collapsed ? "Sign out" : undefined}>
            <WorkspaceIcon name="logout" />
            <span className="workspace-nav-label">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </aside>
      <main id="main" className="workspace-main">
        <header className="workspace-topbar">
          <h1 className="workspace-topbar-title">{pageTitle(pathname)}</h1>
          <div className="workspace-topbar-actions">
            <button type="button" className="workspace-topbar-icon" aria-label="Notifications">
              <WorkspaceIcon name="bell" />
            </button>
            <button type="button" className="workspace-topbar-icon" onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <WorkspaceIcon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <div className="workspace-usermenu">
              <button type="button" className="workspace-usermenu-trigger" aria-haspopup="menu"
                aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen((v) => !v)}>
                <WorkspaceAvatar name={account?.displayName ?? ""} avatarUrl={account?.avatarUrl} />
                <span className="workspace-usermenu-id">
                  <strong>{account?.displayName ?? "…"}</strong>
                  <span>Personal</span>
                </span>
                <WorkspaceIcon name="chevron" className="size-4" />
              </button>
              {userMenuOpen && (
                <>
                  <button type="button" aria-hidden tabIndex={-1} className="workspace-usermenu-backdrop"
                    onClick={() => setUserMenuOpen(false)} />
                  <div className="workspace-usermenu-pop" role="menu">
                    <Link role="menuitem" href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}>Account settings</Link>
                    <Link role="menuitem" href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}>Profile</Link>
                    <button type="button" role="menuitem" onClick={signOut} disabled={signingOut}>
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        {accountContext ? (
          <AccountContext.Provider value={accountContext}>{children}</AccountContext.Provider>
        ) : accountError ? (
          <div className="workspace-panel workspace-message" role="alert">
            <h1>Couldn’t load your workspace</h1>
            <p>Check your connection and try again.</p>
            <Button onClick={() => { setAccountError(false); setAttempt(attempt + 1); }}>Try again</Button>
          </div>
        ) : (
          <div className="workspace-skeleton" aria-busy="true" aria-label="Loading your workspace" role="status">
            <span /><span />
          </div>
        )}
      </main>
    </div>
  );
}
