import { useEffect, useState, type ReactNode } from "react";

import { toEnglish } from "@/lib/admin-i18n";

const KEY = "jhb-admin-lang";
const ATTRS = ["placeholder", "title", "aria-label"] as const;
const SKIP = "[data-no-translate], textarea, input, select option[data-raw]";

export type AdminLang = "hi" | "en";

export function useAdminLang(): [AdminLang, (l: AdminLang) => void] {
  const [lang, setLang] = useState<AdminLang>("hi");
  useEffect(() => {
    if (localStorage.getItem(KEY) === "en") setLang("en");
  }, []);
  return [lang, (l) => {
    localStorage.setItem(KEY, l);
    setLang(l);
  }];
}

/**
 * Shows the admin panel in English by swapping known Hindi labels on screen.
 * The panel's own logic and saved data are untouched; switching back restores the Hindi text.
 */
export function AdminLanguageScope({ lang, children }: { lang: AdminLang; children: ReactNode }) {
  useEffect(() => {
    if (lang !== "en") return;
    const originals = new Map<Node, string>();
    const attrOriginals = new Map<Element, Record<string, string>>();
    let busy = false;

    const skip = (n: Node) => {
      const el = n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n.parentElement;
      return !el || Boolean(el.closest(SKIP));
    };
    const doText = (n: Node) => {
      if (skip(n)) return;
      const v = n.nodeValue ?? "";
      const next = toEnglish(v);
      if (next !== v) {
        originals.set(n, v);
        n.nodeValue = next;
      }
    };
    const doEl = (el: Element) => {
      if (el.closest("[data-no-translate]")) return;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v) continue;
        const next = toEnglish(v);
        if (next !== v) {
          attrOriginals.set(el, { ...(attrOriginals.get(el) ?? {}), [a]: v });
          el.setAttribute(a, next);
        }
      }
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return doText(root);
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      doEl(root as Element);
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let n = tw.nextNode();
      while (n) {
        if (n.nodeType === Node.TEXT_NODE) doText(n);
        else doEl(n as Element);
        n = tw.nextNode();
      }
    };

    // Native prompt/confirm dialogs get English too.
    const nativePrompt = window.prompt.bind(window);
    const nativeConfirm = window.confirm.bind(window);
    window.prompt = (m?: string, d?: string) => nativePrompt(m ? toEnglish(m) : m, d);
    window.confirm = (m?: string) => nativeConfirm(m ? toEnglish(m) : m);

    walk(document.body);
    const obs = new MutationObserver((records) => {
      if (busy) return;
      busy = true;
      for (const r of records) {
        if (r.type === "characterData") doText(r.target);
        else if (r.type === "attributes") doEl(r.target as Element);
        else r.addedNodes.forEach(walk);
      }
      busy = false;
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });

    return () => {
      obs.disconnect();
      window.prompt = nativePrompt;
      window.confirm = nativeConfirm;
      originals.forEach((v, n) => {
        if (n.isConnected && toEnglish(v) === n.nodeValue) n.nodeValue = v;
      });
      attrOriginals.forEach((attrs, el) => {
        for (const [a, v] of Object.entries(attrs)) el.setAttribute(a, v);
      });
    };
  }, [lang]);

  return <>{children}</>;
}

export function AdminLanguageToggle({ lang, onChange }: { lang: AdminLang; onChange: (l: AdminLang) => void }) {
  return (
    <div data-no-translate className="inline-flex overflow-hidden rounded-md border border-border text-xs font-semibold" role="group" aria-label="भाषा / Language">
      {(["hi", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={`px-3 py-2 ${lang === l ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          {l === "hi" ? "हिंदी" : "English"}
        </button>
      ))}
    </div>
  );
}
