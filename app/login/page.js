"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../components/AppHeader";
import Icon from "../components/Icon";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../components/providers/AuthProvider";
import { useI18n } from "../components/providers/I18nProvider";
import { getErrorMessage } from "../lib/errors";
import { isValidPhone, sanitizePasswordInput, sanitizePhoneInput } from "../lib/input";
import styles from "./Auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, register } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const switchMode = (next) => {
    if (pending || next === mode) return;
    setMode(next);
    setError("");
  };

  const validate = () => {
    if (mode === "register" && fullName.trim().length < 2) {
      return t("validation.name");
    }
    if (!isValidPhone(phone)) return t("validation.phone");
    if (!/^\d{4}$/.test(password)) return t("validation.password");
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    setError("");

    try {
      if (mode === "login") {
        await login(phone, password);
      } else {
        await register(fullName.trim(), phone, password);
      }
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, t));
      setPending(false);
    }
  };

  if (loading || user) {
    return (
      <>
        <AppHeader />
        <main id="main" className="container app-main">
          <PageLoader />
        </main>
      </>
    );
  }

  const isLogin = mode === "login";

  return (
    <>
      <AppHeader />
      <main id="main" className={`container ${styles.page}`}>
        <div className={styles.shell}>
          <aside className={styles.brandPanel}>
            <div className={styles.brandTop}>
              <span className={styles.panelLogo}>
                <Icon name="check" size={19} strokeWidth={2.8} />
              </span>
              <span className={styles.panelBrand}>{t("brand")}</span>
            </div>

            <div className={styles.brandBody}>
              <h1 className={styles.heroTitle}>{t("auth.heroTitle")}</h1>
              <p className={styles.heroBody}>{t("auth.heroBody")}</p>

              <ul className={styles.features}>
                {["auth.feature1", "auth.feature2", "auth.feature3"].map((key) => (
                  <li key={key}>
                    <span className={styles.featureCheck}>
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.preview} aria-hidden="true">
              <div className={styles.previewHead}>
                <span>{t("header.myTasks")}</span>
                <span className={styles.previewPercent}>70%</span>
              </div>
              <div className={styles.previewBar}>
                <span />
              </div>
              <div className={styles.previewRow}>
                <span className={`${styles.previewDot} ${styles.previewDotActive}`} />
                <span className={styles.previewText}>{t("task.pending")}</span>
                <span className={styles.previewTag}>{t("task.dueLabel")}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={`${styles.previewDot} ${styles.previewDotDone}`}>
                  <Icon name="check" size={9} strokeWidth={3.4} />
                </span>
                <span className={styles.previewText}>{t("task.completed")}</span>
                <span className={styles.previewTag}>{t("task.subtasksLabel")} 3/4</span>
              </div>
            </div>

            <p className={styles.brandFooter}>{t("auth.footer")}</p>
          </aside>

          <section className={styles.formPanel}>
            <div className={styles.formInner}>
              <header className={styles.formHead}>
                <h2>{isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}</h2>
                <p>{isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}</p>
              </header>

              <div className={styles.tabs} role="group">
                <button
                  type="button"
                  className={isLogin ? styles.tabActive : styles.tab}
                  onClick={() => switchMode("login")}
                  aria-pressed={isLogin}
                >
                  {t("auth.loginTab")}
                </button>
                <button
                  type="button"
                  className={!isLogin ? styles.tabActive : styles.tab}
                  onClick={() => switchMode("register")}
                  aria-pressed={!isLogin}
                >
                  {t("auth.registerTab")}
                </button>
              </div>

              <form key={mode} className={styles.form} onSubmit={handleSubmit} noValidate>
                {!isLogin && (
                  <div className="field">
                    <label className="label" htmlFor="fullName">
                      {t("auth.fullName")}
                    </label>
                    <div className="input-wrap">
                      <Icon name="user" size={18} />
                      <input
                        id="fullName"
                        className="input has-icon"
                        value={fullName}
                        onChange={(event) => {
                          setFullName(event.target.value);
                          if (error) setError("");
                        }}
                        placeholder={t("auth.fullNamePlaceholder")}
                        maxLength={80}
                        autoComplete="name"
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="label" htmlFor="phone">
                    {t("auth.phone")}
                  </label>
                  <div className="input-wrap">
                    <Icon name="phone" size={17} />
                    <input
                      id="phone"
                      className="input has-icon ltr"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(event) => {
                        setPhone(sanitizePhoneInput(event.target.value));
                        if (error) setError("");
                      }}
                      placeholder={t("auth.phonePlaceholder")}
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <span className="field-hint">{t("auth.phoneHint")}</span>
                </div>

                <div className="field">
                  <label className="label" htmlFor="password">
                    {t("auth.password")}
                  </label>
                  <div className="input-wrap">
                    <Icon name="lock" size={17} />
                    <input
                      id="password"
                      className="input has-icon ltr"
                      type="password"
                      inputMode="numeric"
                      value={password}
                      onChange={(event) => {
                        setPassword(sanitizePasswordInput(event.target.value));
                        if (error) setError("");
                      }}
                      placeholder={t("auth.passwordPlaceholder")}
                      maxLength={4}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      {...(!isLogin ? { autoFocus: true } : {})}
                    />
                  </div>
                  <span className="field-hint">{t("auth.passwordHint")}</span>
                </div>

                {error && (
                  <div className={styles.alert} role="alert">
                    <Icon name="alertCircle" size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary btn-block ${styles.submit}`}
                  disabled={pending}
                >
                  {pending && <span className="spinner" />}
                  {pending
                    ? t("auth.submitting")
                    : isLogin
                      ? t("auth.login")
                      : t("auth.register")}
                </button>
              </form>

              <p className={styles.switch}>
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(isLogin ? "register" : "login")}
                >
                  {isLogin ? t("auth.goRegister") : t("auth.goLogin")}
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
