import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

const URL = "http://localhost:5173";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const results = [];

async function scan(page, label) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of r.violations) {
    results.push({ label, id: v.id, impact: v.impact, n: v.nodes.length,
      sample: v.nodes.slice(0, 2).map((n) => `${n.target.join(" ")} :: ${(n.failureSummary || "").split("\n").slice(1, 3).join(" | ")}`) });
  }
  console.log(`  scan ${label}: ${r.violations.length} violaciones`);
}

async function login(page) {
  await page.goto(URL);
  await page.getByLabel("Usuario").fill("demo");
  await page.getByLabel("Contraseña", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("heading", { name: "Proyectos", level: 1 }).waitFor();
  await page.waitForTimeout(1200);
}

async function flow(browser, scheme, vp, tag) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: vp });
  const page = await ctx.newPage();
  const t = (s) => `${tag} ${s}`;
  console.log(`== ${tag}`);

  await page.goto(URL); await scan(page, t("login"));
  await page.getByRole("button", { name: "Crea una" }).click();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await scan(page, t("registro con errores"));
  await page.getByRole("button", { name: "Inicia sesión" }).click();
  await page.getByLabel("Usuario").fill("x"); await page.getByLabel("Contraseña", { exact: true }).fill("mal");
  await page.getByRole("button", { name: "Iniciar sesión" }).click(); await page.getByRole("alert").waitFor();
  await scan(page, t("login error credenciales"));

  await login(page); await scan(page, t("proyectos"));
  await page.getByRole("button", { name: "Nuevo proyecto" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Crear proyecto" }).click(); await scan(page, t("modal proyecto con error"));
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Editar proyecto Rediseño/ }).click(); await page.waitForTimeout(300);
  await scan(page, t("modal editar proyecto")); await page.keyboard.press("Escape");
  await page.getByLabel("Estado de la vista").selectOption("loading"); await scan(page, t("proyectos loading"));
  await page.getByLabel("Estado de la vista").selectOption("empty"); await scan(page, t("proyectos vacío"));
  await page.getByLabel("Estado de la vista").selectOption("error"); await scan(page, t("proyectos error"));
  await page.getByLabel("Estado de la vista").selectOption("ready");

  await page.getByRole("button", { name: "Rediseño del sitio", exact: true }).click(); await page.waitForTimeout(1200);
  await scan(page, t("tablero"));
  if (vp.width >= 768) {
    await page.getByRole("button", { name: /^Prioridad/ }).click(); await scan(page, t("filtro prioridad abierto"));
    await page.getByLabel("Alta").check(); await page.getByLabel("Media").check();
    await scan(page, t("tablero con chips"));
    await page.getByRole("button", { name: /^Fecha/ }).click();
    await page.getByLabel("Desde").fill("2026-10-10"); await page.getByLabel("Hasta").fill("2026-10-01");
    await scan(page, t("filtro fecha inválida")); await page.keyboard.press("Escape");
    await scan(page, t("tablero sin resultados"));
    await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
  } else {
    await page.getByRole("button", { name: /Filtros/ }).click(); await page.waitForTimeout(300);
    await scan(page, t("sheet filtros")); await page.keyboard.press("Escape");
  }
  await page.getByRole("button", { name: "Migrar formulario de contacto", exact: true }).click(); await page.waitForTimeout(1200);
  await scan(page, t("panel ticket edición + comentarios"));
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Nuevo ticket" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Crear ticket" }).click(); await scan(page, t("panel nuevo ticket con error"));
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Definir arquitectura de la nueva home", exact: true }).click(); await page.waitForTimeout(300);
  await scan(page, t("panel ticket")); await page.keyboard.press("Escape");
  await ctx.close();
}

const browser = await chromium.launch({ channel: "chrome" });
for (const scheme of ["light", "dark"]) {
  await flow(browser, scheme, { width: 1280, height: 800 }, `${scheme}/desktop`);
  await flow(browser, scheme, { width: 375, height: 800 }, `${scheme}/móvil`);
}
await browser.close();

const agg = new Map();
for (const r of results) {
  const k = r.id; const e = agg.get(k) ?? { impact: r.impact, where: [], sample: r.sample[0] };
  e.where.push(`${r.label} (${r.n})`); agg.set(k, e);
}
console.log("\n===== RESUMEN axe (wcag2a/aa + 2.1 a/aa) =====");
if (!agg.size) console.log("Sin violaciones.");
for (const [id, e] of agg) console.log(`\n[${e.impact}] ${id}\n  ej: ${e.sample}\n  en: ${e.where.slice(0, 8).join("; ")}${e.where.length > 8 ? ` … +${e.where.length - 8}` : ""}`);
