@AGENTS.md

# Allium

## Qué es esto

ERP interno para **Onion**, empresa de catering y organización de eventos que
opera bajo la razón social **Allium E.A.S.** en Paraguay. Onion es la unidad
de negocio activa hoy; el sistema se llama "Allium" (sin el prefijo "ERP" en
el nombre visible) porque la estructura debe permitir sumar otras unidades de
Allium en el futuro (multi-empresa / multi-unidad), aunque hoy solo se
construye y usa lo necesario para Onion.

Identidad de marca: paleta fucsia / bordó. Tipografías: Inter para texto de
cuerpo y Hanken Grotesk para títulos (HK Guise, la tipografía de marca, es
comercial y no está en Google Fonts; Hanken Grotesk es de la misma fundición
—Hanken Design Co.— y es el reemplazo más cercano disponible).

## Objetivo del proyecto

Es una **herramienta interna de uso propio**, no un producto para vender ni
un SaaS multi-tenant genérico. Las decisiones de alcance, UX y prioridad
deben optimizar para que Nicolás (dueño/operador de Onion) pueda gestionar
su propio negocio de forma simple, no para generalizar a clientes externos.
Uso mobile-first: se opera principalmente desde el celular, en el día a día
de eventos.

## Stack

- **Next.js** (App Router, TypeScript) — `src/app`
- **Tailwind CSS v4** — configuración vía `@theme` en `src/app/globals.css`
  (colores de marca: escalas `fucsia-*` y `bordo-*`)
- **Supabase** — base de datos (Postgres) y autenticación
  - Cliente browser: `src/lib/supabase/client.ts`
  - Cliente server (Server Components/Actions): `src/lib/supabase/server.ts`
  - Variables de entorno en `.env.local` (ver `.env.local.example`), nunca
    committear `.env.local`
- **Vercel** — deploy

## Cómo se construye

Cada fase (ej: módulo de eventos, clientes, presupuestos, inventario, etc.)
se implementa y se prueba funcionando antes de pasar a la siguiente. No se
avanza en paralelo sobre módulos a medio terminar. Preferir simplicidad:
esto es un ERP de uso único (un solo usuario/negocio real hoy), no hace
falta diseñar para escala ni para múltiples clientes externos todavía —
solo dejar la puerta abierta a futuras unidades de Allium sin sobre-diseñar
por adelantado.
