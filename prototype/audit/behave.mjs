import { chromium } from "playwright-core";
const URL = "http://localhost:5173";
const out = []; const ok = (n, pass, extra = "") => { out.push({ n, pass, extra }); console.log(`${pass ? "PASS" : "FAIL"}  ${n}${extra ? "  → " + extra : ""}`); };
const errors = [];

async function mk(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  return { ctx, page };
}
async function login(page) {
  await page.goto(URL);
  await page.getByLabel("Usuario").fill("demo");
  await page.getByLabel("Contraseña", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("heading", { name: "Proyectos", level: 1 }).waitFor();
  await page.waitForTimeout(1100);
}
const openBoard = async (page, name = "Rediseño del sitio") => {
  await page.getByRole("button", { name, exact: true }).click(); await page.waitForTimeout(1100);
};
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a ? (a.getAttribute("aria-label") || a.textContent || a.tagName).trim().slice(0, 60) : null; });
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const browser = await chromium.launch({ channel: "chrome" });

/* ---------- Reflow 320px y zoom 200% (1.4.10 / 1.4.4) ---------- */
for (const [label, vp] of [["320px", { width: 320, height: 640 }], ["zoom 200% (640px)", { width: 640, height: 400 }]]) {
  const { ctx, page } = await mk(browser, { viewport: vp });
  await page.goto(URL); ok(`${label}: login sin scroll horizontal`, (await overflowX(page)) <= 0, `Δ=${await overflowX(page)}`);
  await page.getByRole("button", { name: "Crea una" }).click();
  ok(`${label}: registro sin scroll horizontal`, (await overflowX(page)) <= 0);
  await page.getByRole("button", { name: "Inicia sesión" }).click();
  await login(page);
  ok(`${label}: proyectos sin scroll horizontal`, (await overflowX(page)) <= 0, `Δ=${await overflowX(page)}`);
  await page.getByRole("button", { name: "Nuevo proyecto" }).click(); await page.waitForTimeout(300);
  ok(`${label}: modal proyecto sin scroll horizontal`, (await overflowX(page)) <= 0);
  await page.keyboard.press("Escape");
  await openBoard(page);
  ok(`${label}: tablero: la página no desborda (solo la región del tablero)`, (await overflowX(page)) <= 0, `Δ=${await overflowX(page)}`);
  await page.getByRole("button", { name: "Migrar formulario de contacto", exact: true }).click(); await page.waitForTimeout(1100);
  ok(`${label}: panel ticket sin scroll horizontal`, (await overflowX(page)) <= 0, `Δ=${await overflowX(page)}`);
  const dw = await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? d.scrollWidth - d.clientWidth : -1; });
  ok(`${label}: panel ticket, el propio diálogo no desborda`, dw <= 0, `Δ=${dw}`);
  await ctx.close();
}

/* ---------- Teclado, foco y comportamiento (desktop) ---------- */
{
  const { ctx, page } = await mk(browser);
  await login(page);

  // Esc cierra modal y devuelve el foco al disparador
  await page.getByRole("button", { name: "Nuevo proyecto" }).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
  ok("Modal proyecto: foco inicial en el campo nombre", (await active(page)) === "" || (await page.evaluate(() => document.activeElement?.id?.endsWith("-name"))));
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  ok("Modal proyecto: Esc cierra y devuelve foco a «Nuevo proyecto»", (await active(page)).includes("Nuevo proyecto"), await active(page));

  // Focus trap: Tab repetido no sale del diálogo
  await page.getByRole("button", { name: "Nuevo proyecto" }).click(); await page.waitForTimeout(250);
  let trapped = true;
  for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body && !a.closest("dialog"); })) { trapped = false; break; } }
  ok("Modal proyecto: el foco queda atrapado en el diálogo (14 Tab)", trapped);
  await page.keyboard.press("Escape");

  await openBoard(page);

  // Anillo de foco visible
  await page.getByRole("button", { name: "Nuevo ticket" }).focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}`; });
  ok("Foco visible (outline 2px) en botones", /solid 2px/.test(ring), ring);

  // Mover por menú (teclado)
  const before = await page.locator('[aria-label^="Columna: En progreso"] h3').count();
  await page.getByRole("button", { name: /^Mover ticket MJ-1:/ }).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(100);
  ok("Menú «Mover a…»: abre y enfoca primer ítem", (await active(page)).startsWith("Mover a"), await active(page));
  await page.keyboard.press("Escape");
  ok("Menú: Esc cierra y devuelve foco al botón", (await active(page)).startsWith("Mover ticket MJ-1"), await active(page));
  await page.keyboard.press("Enter"); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
  const after = await page.locator('[aria-label^="Columna: En progreso"] h3').count();
  ok("Mover por teclado: MJ-1 pasa a «En progreso»", after === before + 1, `${before}→${after}`);
  ok("Mover por teclado: foco vuelve al botón del ticket movido", (await active(page)).startsWith("Mover ticket MJ-1"), await active(page));
  ok("Mover: se anuncia en región live", (await page.locator('[role=status]').allTextContents()).some((t) => /MJ-1 movido a En progreso/.test(t)));

  // Drag and drop: salto de columna → rechazado con toast; contigua → ok
  const card = page.locator("article", { hasText: "Elegir tipografías" });
  await card.dragTo(page.locator('[aria-label^="Columna: Por hacer"]'));
  await page.waitForTimeout(200);
  ok("DnD: salto de columna (Terminado→Por hacer) rechazado con aviso", (await page.getByText("No se puede saltar columnas").count()) > 0);
  const cardsDone = await page.locator('[aria-label^="Columna: Terminado"] article').count();
  ok("DnD: la tarjeta rechazada no cambia de columna", cardsDone === 4, `Terminado=${cardsDone}`);
  await page.locator("article", { hasText: "Migrar formulario" }).dragTo(page.locator('[aria-label^="Columna: Review"]'));
  await page.waitForTimeout(250);
  ok("DnD: movimiento contiguo válido (En progreso→Review)", (await page.locator('[aria-label^="Columna: Review"] article', { hasText: "Migrar formulario" }).count()) === 1);

  // Permiso: ticket ajeno bloqueado
  const lock = page.getByRole("button", { name: /MJ-4: No tienes permiso/ });
  ok("Permisos: ticket ajeno (MJ-4) muestra candado con motivo", (await lock.count()) === 1);
  ok("Permisos: ticket ajeno no es arrastrable", (await page.locator("article", { hasText: "Crear sistema de iconos" }).getAttribute("draggable")) === "false");

  // Filtros AND
  await page.getByRole("button", { name: /^Etiquetas/ }).click();
  await page.getByRole("checkbox", { name: "diseño" }).check(); await page.getByRole("checkbox", { name: "tokens" }).check();
  await page.waitForTimeout(150);
  ok("Filtros AND: etiquetas «diseño»+«tokens» → solo 1 ticket", (await page.locator('[role=group][aria-label^="Columna"] article').count()) === 1, `${await page.locator('[role=group][aria-label^="Columna"] article').count()} tickets`);
  await page.keyboard.press("Escape");
  ok("Dropdown filtro: Esc devuelve foco al botón", (await active(page)).startsWith("Etiquetas"), await active(page));
  await page.getByRole("button", { name: "Quitar filtro Etiqueta: diseño" }).click(); await page.waitForTimeout(150);
  ok("Quitar chip: el foco pasa al chip siguiente (no se pierde)", (await active(page)).startsWith("Quitar filtro"), await active(page));
  await page.getByRole("button", { name: "Limpiar filtros" }).click(); await page.waitForTimeout(150);
  ok("Limpiar filtros: foco queda en un control de filtros", /Fecha|Filtros/.test(await active(page)), await active(page));

  // Panel de ticket
  await page.getByRole("button", { name: "Definir arquitectura de la nueva home", exact: true }).click(); await page.waitForTimeout(1100);
  ok("Panel: título accesible del diálogo", (await page.getByRole("dialog", { name: "Detalle del ticket" }).count()) === 1);
  const trapped2 = await (async () => { for (let i = 0; i < 40; i++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body && !a.closest("dialog"); })) return false; } return true; })();
  ok("Panel: foco atrapado en 40 Tab", trapped2);
  // Comentar
  const n0 = await page.locator('ol[aria-label^="Comentarios"] li').count();
  await page.getByLabel("Añadir un comentario").fill("Comentario de prueba\nsegunda línea");
  await page.keyboard.press("Control+Enter"); await page.waitForTimeout(1000);
  ok("Comentarios: Ctrl+Enter publica", (await page.locator('ol[aria-label^="Comentarios"] li').count()) === n0 + 1);
  ok("Comentarios: foco vuelve al campo tras publicar", (await page.evaluate(() => document.activeElement?.tagName)) === "TEXTAREA");
  ok("Comentarios: botón «Comentar» deshabilitado con campo vacío", await page.getByRole("button", { name: "Comentar" }).isDisabled());
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok("Panel: Esc cierra y devuelve foco al título del ticket", (await active(page)) === "Definir arquitectura de la nueva home", await active(page));

  // Self-assign en ticket ajeno
  await page.getByRole("button", { name: "Crear sistema de iconos", exact: true }).click(); await page.waitForTimeout(400);
  ok("Solo lectura: campos deshabilitados salvo «Asignarme»", (await page.getByLabel("Título").isDisabled()) && (await page.getByRole("button", { name: "Asignarme este ticket" }).isEnabled()));
  ok("Solo lectura: «Eliminar» oculto", (await page.getByRole("button", { name: "Eliminar" }).count()) === 0);
  await page.getByRole("button", { name: "Asignarme este ticket" }).click(); await page.waitForTimeout(300);
  ok("Auto-asignación: el formulario pasa a editable", await page.getByLabel("Título").isEnabled());
  ok("Auto-asignación: foco pasa al campo Título", (await page.evaluate(() => document.activeElement?.tagName)) === "INPUT");
  await page.keyboard.press("Escape");

  // Crear ticket + validación
  await page.getByRole("button", { name: "Nuevo ticket" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Crear ticket" }).click();
  ok("Nuevo ticket: error de título en texto y foco en el campo", (await page.getByText("Introduce un título para el ticket").count()) > 0 && (await page.evaluate(() => document.activeElement?.tagName)) === "INPUT");
  await page.getByLabel("Título").fill("Ticket creado en auditoría");
  await page.locator("dialog").getByLabel("Etiquetas", { exact: true }).fill("qa, nuevo"); await page.keyboard.press("Enter");
  ok("TagInput: coma y Enter crean chips", (await page.locator('ul[aria-label="Etiquetas del ticket"] li').count()) === 2);
  await page.getByRole("button", { name: "Crear ticket" }).click(); await page.waitForTimeout(1100);
  ok("Nuevo ticket: aparece en «Por hacer»", (await page.locator('[aria-label^="Columna: Por hacer"] article', { hasText: "Ticket creado en auditoría" }).count()) === 1);

  // Archivar / restaurar
  await page.getByRole("button", { name: "Ticket creado en auditoría", exact: true }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Eliminar" }).click(); await page.waitForTimeout(300);
  ok("Archivar: desaparece del tablero", (await page.locator("article", { hasText: "Ticket creado en auditoría" }).count()) === 0);
  await page.getByLabel("Mostrar tickets archivados").check();
  ok("Archivados: visible con badge «Archivado»", (await page.locator("article", { hasText: "Ticket creado en auditoría" }).getByText("Archivado").count()) === 1);
  await ctx.close();
}

/* ---------- Reduced motion ---------- */
{
  const { ctx, page } = await mk(browser, { reducedMotion: "reduce" });
  await login(page); await openBoard(page);
  await page.getByRole("button", { name: "Migrar formulario de contacto", exact: true }).click(); await page.waitForTimeout(100);
  const dur = await page.evaluate(() => getComputedStyle(document.querySelector("dialog[open]")).animationDuration);
  ok("prefers-reduced-motion: animación del panel = 0s", parseFloat(dur) === 0, dur);
  await ctx.close();
}

/* ---------- Tamaño de objetivos táctiles (≥24×24) ---------- */
{
  const { ctx, page } = await mk(browser);
  const small = async (label) => {
    const r = await page.evaluate(() => [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=radio]")]
      .filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); const lb = e.closest("label")?.getBoundingClientRect(); if (lb && lb.width >= 24 && lb.height >= 24 && (e.type === "checkbox" || e.type === "radio")) return false; return b.width > 0 && b.height > 0 && cs.visibility !== "hidden" && !e.classList.contains("sr-only") && !(e.closest("[inert]")); })
      .map((e) => { const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), t: (e.getAttribute("aria-label") || e.textContent || e.type || e.tagName).trim().slice(0, 40), inline: !!e.closest("p") && e.tagName === "BUTTON" && getComputedStyle(e).display === "inline" } })
      .filter((x) => (x.w < 24 || x.h < 24) && !x.inline));
    ok(`Objetivos ≥24px: ${label}`, r.length === 0, r.map((x) => `${x.t} ${x.w}×${x.h}`).join("; "));
  };
  await login(page); await small("proyectos");
  await openBoard(page); await small("tablero");
  await page.getByRole("button", { name: "Migrar formulario de contacto", exact: true }).click(); await page.waitForTimeout(1100); await small("panel de ticket");
  await ctx.close();
}

await browser.close();
const fails = out.filter((o) => !o.pass);
console.log(`\n${out.length - fails.length}/${out.length} OK`);
console.log(errors.length ? `Errores de consola/página:\n${[...new Set(errors)].join("\n")}` : "Sin errores de consola ni excepciones.");
