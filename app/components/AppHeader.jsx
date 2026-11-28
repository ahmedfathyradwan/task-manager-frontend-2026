"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";
import { useAuth } from "./providers/AuthProvider";
import { useI18n } from "./providers/I18nProvider";
import { useTheme } from "./providers/ThemeProvider";
import styles from "./Header.module.css";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const isAdmin = user?.role === "admin";
  const onAdmin = pathname?.startsWith("/admin");

  const handleLogout = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } finally {
      setLeaving(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link
          href={user ? "/" : "/login"}
          className={styles.brand}
          aria-label={t("brand")}
        >
          <span className={styles.logo}>
            <Icon name="check" size={18} strokeWidth={2.8} />
          </span>
          <span className={styles.brandName}>{t("brand")}</span>
        </Link>

        {user && (
          <nav className={styles.nav} aria-label={t("header.myTasks")}>
            <Link
              href="/"
              aria-label={t("header.myTasks")}
              className={`${styles.navItem} ${!onAdmin ? styles.navActive : ""}`}
            >
              <Icon name="listChecks" size={17} />
              <span className={styles.navLabel}>{t("header.myTasks")}</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                aria-label={t("header.admin")}
                className={`${styles.navItem} ${onAdmin ? styles.navActive : ""}`}
              >
                <Icon name="shield" size={17} />
                <span className={styles.navLabel}>{t("header.admin")}</span>
              </Link>
            )}
          </nav>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.langBtn}
            onClick={toggleLang}
            aria-label={t("header.toggleLang")}
            title={t("header.toggleLang")}
          >
            <Icon name="globe" size={17} />
            <span className={styles.langShort}>{t("header.langShort")}</span>
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={t("header.toggleTheme")}
            title={t("header.toggleTheme")}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>

          {user && (
            <>
              <div className={styles.user}>
                <span
                  className={`${styles.avatar} ${isAdmin ? styles.avatarAdmin : ""}`}
                  aria-hidden="true"
                >
                  {initialsOf(user.fullName)}
                </span>
                <span className={styles.userText}>
                  <span className={`${styles.userName} ${isAdmin ? "admin-name" : ""}`}>
                    {user.fullName}
                  </span>
                  {isAdmin && (
                    <span className={styles.userRole}>
                      <Icon name="shield" size={11} />
                      {t("role.admin")}
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={handleLogout}
                disabled={leaving}
                aria-label={t("header.logout")}
                title={t("header.logout")}
              >
                {leaving ? (
                  <span className="spinner" />
                ) : (
                  <Icon name="logout" size={18} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
