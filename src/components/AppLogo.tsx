/* eslint-disable @next/next/no-img-element */

interface AppLogoProps {
  /** Tamanho (lado) do logo em pixels. */
  size?: number;
  className?: string;
}

/**
 * Logo oficial do Clube da Cota (comunidade ao redor da moeda).
 * O arquivo SVG já possui o fundo branco arredondado, então funciona sobre qualquer cor.
 */
export function AppLogo({ size = 36, className = "" }: AppLogoProps) {
  return (
    <img
      src="/icon-comunidade.svg"
      alt="Clube da Cota"
      width={size}
      height={size}
      draggable={false}
      className={`select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Tela de carregamento do app: logo com animação de "respiração",
 * halo pulsante e anel girando ao redor.
 */
export function AppLoadingScreen({ message = "Carregando Clube da Cota..." }: { message?: string }) {
  return (
    <main
      className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 gap-8"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Halo pulsante */}
        <span className="logo-halo absolute inset-2 rounded-full bg-[#044E3A]/15" />
        {/* Anel girando */}
        <span className="logo-ring absolute inset-0 rounded-full border-4 border-[#044E3A]/10 border-t-[#044E3A]" />
        {/* Logo */}
        <AppLogo size={96} className="logo-breathe drop-shadow-lg" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-xl font-black tracking-tight text-[#044E3A]">Clube da Cota</h1>
        <p className="text-sm font-semibold text-slate-500 flex items-center justify-center gap-1">
          <span>{message.replace(/\.+$/, "")}</span>
          <span className="flex gap-0.5 items-end pb-0.5" aria-hidden="true">
            <span className="logo-dot w-1 h-1 rounded-full bg-slate-400" />
            <span className="logo-dot w-1 h-1 rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }} />
            <span className="logo-dot w-1 h-1 rounded-full bg-slate-400" style={{ animationDelay: "0.4s" }} />
          </span>
        </p>
      </div>
    </main>
  );
}
