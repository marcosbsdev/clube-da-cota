import assert from 'node:assert';
import { sanitizarParaCliente } from '../src/lib/sanitize.ts';

console.log("🧪 Testando sanitização de dados sensíveis enviados ao navegador...\n");

const data = new Date("2026-01-10T00:00:00Z");
const consorcio = {
  id: "c1",
  criador: { id: "u1", name: "Criador", passwordHash: "hash1", resetToken: "r1" },
  cotas: [
    {
      id: "k1",
      tokenAcesso: "cota_abc",
      createdAt: data,
      participantes: [
        { id: "p1", tokenAcesso: "cp_xyz", usuario: { id: "u2", name: "Ana", passwordHash: "hash2", inviteToken: "i2" } },
      ],
    },
  ],
  auditorias: [{ id: "a1", usuarioResponsavel: { id: "u1", name: "Criador", passwordHash: "hash1" } }],
};

// Teste 1: segredos de autenticação nunca saem, mesmo para o gestor
const gestor = sanitizarParaCliente(consorcio, true);
const jsonGestor = JSON.stringify(gestor);
for (const segredo of ["hash1", "hash2", "r1", "i2", "passwordHash", "resetToken", "inviteToken"]) {
  assert.ok(!jsonGestor.includes(segredo), `Vazou "${segredo}" para o gestor`);
}
console.log("✅ Teste 1: hashes de senha e tokens de recuperação/convite removidos (gestor).");

// Teste 2: gestor mantém links de acesso para poder compartilhá-los
assert.strictEqual(gestor.cotas[0].tokenAcesso, "cota_abc");
assert.strictEqual(gestor.cotas[0].participantes[0].tokenAcesso, "cp_xyz");
console.log("✅ Teste 2: gestor mantém tokenAcesso para compartilhar os links.");

// Teste 3: participante comum não recebe links de acesso de ninguém
const comum = sanitizarParaCliente(consorcio, false);
const jsonComum = JSON.stringify(comum);
for (const segredo of ["cota_abc", "cp_xyz", "tokenAcesso", "hash1", "hash2"]) {
  assert.ok(!jsonComum.includes(segredo), `Vazou "${segredo}" para participante comum`);
}
console.log("✅ Teste 3: participante comum não recebe tokenAcesso nem hashes.");

// Teste 4: dados úteis e datas permanecem intactos
assert.strictEqual(comum.criador.name, "Criador");
assert.strictEqual(comum.cotas[0].participantes[0].usuario.name, "Ana");
assert.ok(comum.cotas[0].createdAt instanceof Date);
assert.strictEqual(comum.cotas[0].createdAt.getTime(), data.getTime());
assert.strictEqual(comum.auditorias[0].usuarioResponsavel.name, "Criador");
console.log("✅ Teste 4: nomes, estrutura e datas preservados.");

// Teste 5: não altera o objeto original e aceita null
assert.strictEqual(consorcio.criador.passwordHash, "hash1");
assert.strictEqual(sanitizarParaCliente(null, false), null);
console.log("✅ Teste 5: objeto original intacto e null tratado.");

console.log("\n🎉 Todos os 5 testes de sanitização passaram com 100% de sucesso!");
