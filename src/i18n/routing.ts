import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ca", "es", "en"],
  defaultLocale: "ca",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/login": "/login",
    "/info": "/info",
    "/privacy": {
      ca: "/privacitat",
      es: "/privacidad",
      en: "/privacy",
    },
    "/profile": {
      ca: "/perfil",
      es: "/perfil",
      en: "/profile",
    },
    "/notifications": {
      ca: "/notificacions",
      es: "/notificaciones",
      en: "/notifications",
    },
    "/groups": {
      ca: "/grups",
      es: "/grupos",
      en: "/groups",
    },
    "/groups/[projectId]": {
      ca: "/grups/[projectId]",
      es: "/grupos/[projectId]",
      en: "/groups/[projectId]",
    },
    "/groups/[projectId]/lists": {
      ca: "/grups/[projectId]/llistes",
      es: "/grupos/[projectId]/listas",
      en: "/groups/[projectId]/lists",
    },
    "/groups/[projectId]/lists/templates": {
      ca: "/grups/[projectId]/llistes/plantilles",
      es: "/grupos/[projectId]/listas/plantillas",
      en: "/groups/[projectId]/lists/templates",
    },
    "/groups/[projectId]/lists/templates/[templateId]": {
      ca: "/grups/[projectId]/llistes/plantilles/[templateId]",
      es: "/grupos/[projectId]/listas/plantillas/[templateId]",
      en: "/groups/[projectId]/lists/templates/[templateId]",
    },
    "/groups/[projectId]/lists/categories": {
      ca: "/grups/[projectId]/llistes/categories",
      es: "/grupos/[projectId]/listas/categorias",
      en: "/groups/[projectId]/lists/categories",
    },
    "/groups/[projectId]/lists/[listId]": {
      ca: "/grups/[projectId]/llistes/[listId]",
      es: "/grupos/[projectId]/listas/[listId]",
      en: "/groups/[projectId]/lists/[listId]",
    },
    "/groups/[projectId]/calendar": {
      ca: "/grups/[projectId]/calendari",
      es: "/grupos/[projectId]/calendario",
      en: "/groups/[projectId]/calendar",
    },
    "/groups/[projectId]/calendar/[eventId]": {
      ca: "/grups/[projectId]/calendari/[eventId]",
      es: "/grupos/[projectId]/calendario/[eventId]",
      en: "/groups/[projectId]/calendar/[eventId]",
    },
    "/groups/[projectId]/files": {
      ca: "/grups/[projectId]/fitxers",
      es: "/grupos/[projectId]/archivos",
      en: "/groups/[projectId]/files",
    },
    "/groups/[projectId]/notes": {
      ca: "/grups/[projectId]/notes",
      es: "/grupos/[projectId]/notas",
      en: "/groups/[projectId]/notes",
    },
    "/groups/[projectId]/notes/[noteId]": {
      ca: "/grups/[projectId]/notes/[noteId]",
      es: "/grupos/[projectId]/notas/[noteId]",
      en: "/groups/[projectId]/notes/[noteId]",
    },
    "/groups/[projectId]/expenses": {
      ca: "/grups/[projectId]/despeses",
      es: "/grupos/[projectId]/gastos",
      en: "/groups/[projectId]/expenses",
    },
    "/groups/[projectId]/expenses/[potId]": {
      ca: "/grups/[projectId]/despeses/[potId]",
      es: "/grupos/[projectId]/gastos/[potId]",
      en: "/groups/[projectId]/expenses/[potId]",
    },
    "/groups/[projectId]/secret-santa": {
      ca: "/grups/[projectId]/amic-invisible",
      es: "/grupos/[projectId]/amigo-invisible",
      en: "/groups/[projectId]/secret-santa",
    },
    "/groups/[projectId]/secret-santa/ideas": {
      ca: "/grups/[projectId]/amic-invisible/idees",
      es: "/grupos/[projectId]/amigo-invisible/ideas",
      en: "/groups/[projectId]/secret-santa/ideas",
    },
    "/groups/[projectId]/invitation/[inviteToken]": {
      ca: "/grups/[projectId]/invitacio/[inviteToken]",
      es: "/grupos/[projectId]/invitacion/[inviteToken]",
      en: "/groups/[projectId]/invitation/[inviteToken]",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
