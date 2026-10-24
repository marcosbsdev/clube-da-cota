/**
 * Remove campos sensíveis de qualquer estrutura antes de enviá-la ao navegador.
 * Preserva objetos Date e a estrutura original (arrays/objetos aninhados).
 */

/** Campos que NUNCA devem sair do servidor. */
const CAMPOS_SEMPRE_REMOVIDOS = new Set([
  "passwordHash",
  "inviteToken",
  "inviteExpiresAt",
  "resetToken",
  "resetExpiresAt",
]);

/** Campos removidos, exceto quando o visualizador pode gerenciar o consórcio. */
const CAMPOS_SOMENTE_GESTOR = new Set(["tokenAcesso"]);

export function sanitizarParaCliente<T>(valor: T, podeVerTokensAcesso: boolean): T {
  const walk = (v: any): any => {
    if (v === null || typeof v !== "object" || v instanceof Date) return v;
    if (Array.isArray(v)) return v.map(walk);
    const out: any = {};
    for (const [k, val] of Object.entries(v)) {
      if (CAMPOS_SEMPRE_REMOVIDOS.has(k)) continue;
      if (CAMPOS_SOMENTE_GESTOR.has(k) && !podeVerTokensAcesso) continue;
      out[k] = walk(val);
    }
    return out;
  };
  return walk(valor);
}
