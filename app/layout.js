import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import AppProviders from "./components/AppProviders";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata = {
  title: {
    default: "مهامي — إدارة المهام",
    template: "%s · مهامي",
  },
  description:
    "تطبيق مهام عربي حديث لتنظيم مهامك ومهامك الفرعية، بمظهر فاتح وداكن وواجهة عربية وإنجليزية.",
  applicationName: "مهامي",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070b16" },
  ],
};

const bootScript = `(function(){try{var t=localStorage.getItem('tm-theme');if(t!=='dark'&&t!=='light'){t='light'}document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('tm-lang');if(l!=='ar'&&l!=='en'){l='ar'}document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          تخطَّ إلى المحتوى
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
