import Script from 'next/script'

const BOOT = `
(function(){try{var s=localStorage.getItem('faktur-docs-theme');var m=s||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var a=m==='system'?(d?'dark':'light'):m;document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(a);}catch(e){}})();
`

export function ThemeScript() {
  return (
    <Script id="faktur-docs-theme-boot" strategy="beforeInteractive">
      {BOOT}
    </Script>
  )
}
