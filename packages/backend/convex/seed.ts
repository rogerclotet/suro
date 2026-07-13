import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";

/**
 * Store-screenshot demo data. NOT part of the product — run by hand against a
 * dev deployment to stage believable content behind the review/demo account:
 *
 *   npx convex run seed:demoGroup '{"email": "review@suro.clotet.dev", "locale": "ca"}'
 *
 * The account must have signed in once already (the seed only stages data; the
 * review sign-in path lives in reviewOtp.ts). Re-running is safe: any previous
 * demo group is deleted and rebuilt in the requested locale, and the user's
 * app locale is switched so the whole UI matches the capture pass.
 */

const DEMO_MEMBER_EMAILS = {
  julia: "julia@suro.demo",
  marc: "marc@suro.demo",
} as const;

type DemoItem = {
  name: string;
  category?: string;
  completed?: boolean;
  assignee?: "anna" | "julia" | "marc";
  dueDaysFromNow?: number;
  dueAllDay?: boolean;
};

type DemoContent = {
  groupName: string;
  shopping: { name: string; items: DemoItem[] };
  packing: { name: string; items: DemoItem[] };
  chores: { name: string; items: DemoItem[] };
  events: {
    today: string;
    birthday: string;
    trip: { name: string; description: string };
    boiler: string;
  };
  notes: {
    menu: { name: string; html: string };
    wifi: { name: string; html: string };
  };
  pot: {
    name: string;
    groceries: string;
    electricity: string;
    internet: string;
  };
};

const CONTENT: Record<"ca" | "es" | "en", DemoContent> = {
  ca: {
    groupName: "El pis de Gràcia",
    shopping: {
      name: "Compra setmanal",
      items: [
        { name: "Tomàquets", category: "Fruita i verdura", completed: true },
        { name: "Alvocats", category: "Fruita i verdura" },
        { name: "Llimones", category: "Fruita i verdura" },
        { name: "Iogurts naturals", category: "Nevera", completed: true },
        { name: "Llet d'avena", category: "Nevera" },
        { name: "Ous", category: "Nevera" },
        { name: "Arròs", category: "Rebost" },
        { name: "Cigrons cuits", category: "Rebost" },
        { name: "Paper de cuina", category: "Neteja" },
      ],
    },
    packing: {
      name: "Maleta per la Cerdanya",
      items: [
        { name: "Botes de muntanya", category: "Roba", completed: true },
        { name: "Forro polar", category: "Roba" },
        { name: "Impermeable", category: "Roba" },
        { name: "Crema solar", category: "Bany" },
        { name: "Cantimplora", category: "Excursió" },
        { name: "Mapa de rutes", category: "Excursió" },
        { name: "Jocs de taula", category: "Extres" },
      ],
    },
    chores: {
      name: "Tasques de casa",
      items: [
        {
          name: "Treure el vidre",
          completed: true,
          assignee: "anna",
          dueDaysFromNow: -2,
          dueAllDay: true,
        },
        {
          name: "Regar les plantes",
          assignee: "anna",
          dueDaysFromNow: 0,
          dueAllDay: true,
        },
        {
          name: "Comprar bombetes",
          assignee: "anna",
          dueDaysFromNow: 0,
          dueAllDay: true,
        },
        {
          name: "Arreglar la persiana",
          assignee: "anna",
          dueDaysFromNow: -1,
          dueAllDay: true,
        },
      ],
    },
    events: {
      today: "Sopar al terrat",
      birthday: "Sopar d'aniversari de la Júlia",
      trip: {
        name: "Cap de setmana a la Cerdanya",
        description: "Casa rural a Bellver. Pujada divendres al vespre.",
      },
      boiler: "Revisió de la caldera",
    },
    notes: {
      menu: {
        name: "Menú de la setmana",
        html: "<h2>Menú de la setmana</h2><ul><li><strong>Dilluns:</strong> cigrons amb espinacs</li><li><strong>Dimarts:</strong> arròs saltat amb verdures</li><li><strong>Dimecres:</strong> truita de patates i amanida</li><li><strong>Dijous:</strong> sopa de fideus i lluç al forn</li><li><strong>Divendres:</strong> pizza casolana 🍕</li></ul>",
      },
      wifi: {
        name: "Wifi i comptadors",
        html: "<p><strong>Wifi:</strong> PisGracia_5G — contrasenya al rebedor.</p><p><strong>Comptador llum:</strong> ES0031 (rebedor).</p><p>La clau de pas de l'aigua és sota la pica de la cuina.</p>",
      },
    },
    pot: {
      name: "Despeses del pis",
      groceries: "Compra del Mercadona",
      electricity: "Factura de la llum",
      internet: "Internet de maig",
    },
  },
  es: {
    groupName: "El piso de Gracia",
    shopping: {
      name: "Compra semanal",
      items: [
        { name: "Tomates", category: "Fruta y verdura", completed: true },
        { name: "Aguacates", category: "Fruta y verdura" },
        { name: "Limones", category: "Fruta y verdura" },
        { name: "Yogures naturales", category: "Nevera", completed: true },
        { name: "Leche de avena", category: "Nevera" },
        { name: "Huevos", category: "Nevera" },
        { name: "Arroz", category: "Despensa" },
        { name: "Garbanzos cocidos", category: "Despensa" },
        { name: "Papel de cocina", category: "Limpieza" },
      ],
    },
    packing: {
      name: "Maleta para la Cerdaña",
      items: [
        { name: "Botas de montaña", category: "Ropa", completed: true },
        { name: "Forro polar", category: "Ropa" },
        { name: "Chubasquero", category: "Ropa" },
        { name: "Crema solar", category: "Baño" },
        { name: "Cantimplora", category: "Excursión" },
        { name: "Mapa de rutas", category: "Excursión" },
        { name: "Juegos de mesa", category: "Extras" },
      ],
    },
    chores: {
      name: "Tareas de casa",
      items: [
        {
          name: "Sacar el vidrio",
          completed: true,
          assignee: "anna",
          dueDaysFromNow: -2,
          dueAllDay: true,
        },
        {
          name: "Regar las plantas",
          assignee: "anna",
          dueDaysFromNow: 0,
          dueAllDay: true,
        },
        {
          name: "Comprar bombillas",
          assignee: "anna",
          dueDaysFromNow: 0,
          dueAllDay: true,
        },
        {
          name: "Arreglar la persiana",
          assignee: "anna",
          dueDaysFromNow: -1,
          dueAllDay: true,
        },
      ],
    },
    events: {
      today: "Cena en la terraza",
      birthday: "Cena de cumpleaños de Júlia",
      trip: {
        name: "Finde en la Cerdaña",
        description: "Casa rural en Bellver. Subida el viernes por la tarde.",
      },
      boiler: "Revisión de la caldera",
    },
    notes: {
      menu: {
        name: "Menú de la semana",
        html: "<h2>Menú de la semana</h2><ul><li><strong>Lunes:</strong> garbanzos con espinacas</li><li><strong>Martes:</strong> arroz salteado con verduras</li><li><strong>Miércoles:</strong> tortilla de patatas y ensalada</li><li><strong>Jueves:</strong> sopa de fideos y merluza al horno</li><li><strong>Viernes:</strong> pizza casera 🍕</li></ul>",
      },
      wifi: {
        name: "Wifi y contadores",
        html: "<p><strong>Wifi:</strong> PisGracia_5G — contraseña en el recibidor.</p><p><strong>Contador de luz:</strong> ES0031 (recibidor).</p><p>La llave de paso del agua está bajo el fregadero de la cocina.</p>",
      },
    },
    pot: {
      name: "Gastos del piso",
      groceries: "Compra del Mercadona",
      electricity: "Factura de la luz",
      internet: "Internet de mayo",
    },
  },
  en: {
    groupName: "Gràcia flat",
    shopping: {
      name: "Weekly groceries",
      items: [
        { name: "Tomatoes", category: "Produce", completed: true },
        { name: "Avocados", category: "Produce" },
        { name: "Lemons", category: "Produce" },
        { name: "Plain yogurts", category: "Fridge", completed: true },
        { name: "Oat milk", category: "Fridge" },
        { name: "Eggs", category: "Fridge" },
        { name: "Rice", category: "Pantry" },
        { name: "Cooked chickpeas", category: "Pantry" },
        { name: "Paper towels", category: "Cleaning" },
      ],
    },
    packing: {
      name: "Cerdanya trip packing",
      items: [
        { name: "Hiking boots", category: "Clothes", completed: true },
        { name: "Fleece jacket", category: "Clothes" },
        { name: "Rain jacket", category: "Clothes" },
        { name: "Sunscreen", category: "Bathroom" },
        { name: "Water bottle", category: "Hike" },
        { name: "Trail map", category: "Hike" },
        { name: "Board games", category: "Extras" },
      ],
    },
    chores: {
      name: "House chores",
      items: [
        {
          name: "Take out the glass",
          completed: true,
          assignee: "anna",
          dueDaysFromNow: -2,
          dueAllDay: true,
        },
        {
          name: "Water the plants",
          assignee: "anna",
          dueDaysFromNow: 0,
          dueAllDay: true,
        },
        {
          name: "Buy light bulbs",
          assignee: "anna",
          dueDaysFromNow: 0,
          dueAllDay: true,
        },
        {
          name: "Fix the blinds",
          assignee: "anna",
          dueDaysFromNow: -1,
          dueAllDay: true,
        },
      ],
    },
    events: {
      today: "Rooftop dinner",
      birthday: "Júlia's birthday dinner",
      trip: {
        name: "Weekend in la Cerdanya",
        description: "Country house in Bellver. Driving up Friday evening.",
      },
      boiler: "Boiler service",
    },
    notes: {
      menu: {
        name: "Weekly menu",
        html: "<h2>Weekly menu</h2><ul><li><strong>Monday:</strong> chickpeas with spinach</li><li><strong>Tuesday:</strong> veggie fried rice</li><li><strong>Wednesday:</strong> potato omelette and salad</li><li><strong>Thursday:</strong> noodle soup and baked hake</li><li><strong>Friday:</strong> homemade pizza 🍕</li></ul>",
      },
      wifi: {
        name: "Wifi & meters",
        html: "<p><strong>Wifi:</strong> PisGracia_5G — password is in the hallway.</p><p><strong>Electricity meter:</strong> ES0031 (hallway).</p><p>The water shut-off valve is under the kitchen sink.</p>",
      },
    },
    pot: {
      name: "Flat expenses",
      groceries: "Mercadona run",
      electricity: "Electricity bill",
      internet: "May internet",
    },
  },
};

// All demo group names, to find (and tear down) a previous run in any locale.
const DEMO_GROUP_NAMES = new Set(
  Object.values(CONTENT).map((content) => content.groupName),
);

const DAY_MS = 24 * 60 * 60 * 1000;
// The seed stages screenshot fixtures for devices set to Europe/Madrid (CEST);
// event times are stored shifted so they *display* at the intended local hour.
const LOCAL_UTC_OFFSET_HOURS = 2;

/** Epoch ms for `daysFromNow` at the given local wall-clock hour. */
function atLocalHour(daysFromNow: number, hour: number): number {
  const day = new Date(Date.now() + daysFromNow * DAY_MS);
  day.setUTCHours(hour - LOCAL_UTC_OFFSET_HOURS, 0, 0, 0);
  return day.getTime();
}

/** Epoch ms for local midnight `daysFromNow` days ahead (all-day events). */
function atLocalMidnight(daysFromNow: number): number {
  return atLocalHour(daysFromNow, 0);
}

/** UTC midnight for the local calendar day `daysFromNow` ahead — all-day task dues. */
function atDueAllDay(daysFromNow: number): number {
  const day = new Date(Date.now() + daysFromNow * DAY_MS);
  return Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
}

async function deleteProjectCascade(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<void> {
  const lists = await ctx.db
    .query("lists")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const list of lists) {
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(list._id);
  }
  const pots = await ctx.db
    .query("pots")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const pot of pots) {
    const members = await ctx.db
      .query("potMembers")
      .withIndex("by_pot", (q) => q.eq("potId", pot._id))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    await ctx.db.delete(pot._id);
  }
  for (const table of [
    "spendings",
    "events",
    "notes",
    "categories",
    "listTemplates",
    "files",
    "projectMembers",
  ] as const) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  }
  await ctx.db.delete(projectId);
}

async function upsertDemoMember(
  ctx: MutationCtx,
  name: string,
  email: string,
  avatarColor: string,
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("users", { name, email, avatarColor });
}

export const demoGroup = internalMutation({
  args: {
    email: v.string(),
    locale: v.union(v.literal("ca"), v.literal("es"), v.literal("en")),
    // Also remove the auto-created "Personal" group, so the demo group is the
    // account's only group — reviewers (and screenshot runs) land straight in it.
    dropPersonal: v.optional(v.boolean()),
  },
  handler: async (ctx, { email, locale, dropPersonal }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    if (user === null) {
      throw new Error(
        `No user with email ${email} — sign in once with the review account first`,
      );
    }
    const content = CONTENT[locale];

    // Tear down any previous demo group (any locale) so reruns are clean.
    const owned = await ctx.db
      .query("projects")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .collect();
    for (const project of owned) {
      if (
        DEMO_GROUP_NAMES.has(project.name) ||
        (dropPersonal === true && project.name === "Personal")
      ) {
        await deleteProjectCascade(ctx, project._id);
      }
    }

    // Reviewer-facing identity: readable name + the locale for this pass.
    await ctx.db.patch(user._id, {
      name: "Anna",
      avatarColor: "peach",
      locale,
      onboardingCompleted: true,
    });

    const julia = await upsertDemoMember(
      ctx,
      "Júlia",
      DEMO_MEMBER_EMAILS.julia,
      "mauve",
    );
    const marc = await upsertDemoMember(
      ctx,
      "Marc",
      DEMO_MEMBER_EMAILS.marc,
      "teal",
    );

    const projectId = await ctx.db.insert("projects", {
      name: content.groupName,
      createdBy: user._id,
      inviteToken: crypto.randomUUID(),
      color: "peach",
    });
    for (const userId of [user._id, julia, marc]) {
      await ctx.db.insert("projectMembers", { projectId, userId });
    }

    const now = Date.now();

    // Calendar: tonight's dinner, a dinner, a linked all-day weekend trip, and a chore slot.
    await ctx.db.insert("events", {
      name: content.events.today,
      startAt: atLocalHour(0, 19),
      endAt: atLocalHour(0, 21),
      allDay: false,
      projectId,
      createdBy: user._id,
      updatedAt: now,
    });
    await ctx.db.insert("events", {
      name: content.events.birthday,
      startAt: atLocalHour(3, 21),
      endAt: atLocalHour(3, 23),
      allDay: false,
      projectId,
      createdBy: julia,
      updatedAt: now,
    });
    const tripEventId = await ctx.db.insert("events", {
      name: content.events.trip.name,
      description: content.events.trip.description,
      startAt: atLocalMidnight(8),
      // All-day convention: endAt = last day + 1 (half-open range).
      endAt: atLocalMidnight(10),
      allDay: true,
      projectId,
      createdBy: user._id,
      updatedAt: now,
    });
    await ctx.db.insert("events", {
      name: content.events.boiler,
      startAt: atLocalHour(13, 10),
      endAt: atLocalHour(13, 11),
      allDay: false,
      projectId,
      createdBy: marc,
      updatedAt: now,
    });

    const assigneeFor = (who: DemoItem["assignee"]) => {
      if (who === "anna") return user._id;
      if (who === "julia") return julia;
      if (who === "marc") return marc;
      return undefined;
    };

    const insertList = async (
      list: { name: string; items: DemoItem[] },
      options: {
        favorite?: boolean;
        eventId?: Id<"events">;
        taskMode?: boolean;
      } = {},
    ) => {
      const listId = await ctx.db.insert("lists", {
        name: list.name,
        projectId,
        favorite: options.favorite ?? false,
        eventId: options.eventId,
        taskMode: options.taskMode ?? false,
        createdBy: user._id,
        updatedAt: now,
      });
      for (const item of list.items) {
        const dueAt =
          item.dueDaysFromNow !== undefined
            ? item.dueAllDay
              ? atDueAllDay(item.dueDaysFromNow)
              : atLocalHour(item.dueDaysFromNow, 12)
            : undefined;
        await ctx.db.insert("listItems", {
          name: item.name,
          completed: item.completed ?? false,
          listId,
          category: item.category,
          assigneeId: assigneeFor(item.assignee),
          dueAt,
          dueAllDay: item.dueAllDay,
          createdBy: user._id,
          updatedAt: now,
        });
      }
      return listId;
    };
    // The favorite list is the one screenshots open for the list-detail shot.
    const favoriteListId = await insertList(content.shopping, {
      favorite: true,
    });
    await insertList(content.packing, { eventId: tripEventId });
    await insertList(content.chores, { taskMode: true });

    for (const note of [content.notes.menu, content.notes.wifi]) {
      await ctx.db.insert("notes", {
        name: note.name,
        contents: note.html,
        format: "html",
        projectId,
        createdBy: user._id,
        updatedAt: now,
      });
    }

    // Expenses: an active pot with one split per member, so balances and a
    // settle-up proposal both render.
    const potId = await ctx.db.insert("pots", {
      name: content.pot.name,
      projectId,
      createdBy: user._id,
    });
    for (const userId of [user._id, julia, marc]) {
      await ctx.db.insert("potMembers", { potId, userId });
    }
    const spendings: {
      description: string;
      amount: number;
      from: Id<"users">;
    }[] = [
      { description: content.pot.groceries, amount: 6487, from: user._id },
      { description: content.pot.electricity, amount: 9240, from: julia },
      { description: content.pot.internet, amount: 3599, from: marc },
    ];
    for (const spending of spendings) {
      await ctx.db.insert("spendings", {
        amount: spending.amount,
        currency: "EUR",
        description: spending.description,
        from: spending.from,
        projectId,
        potId,
        createdBy: spending.from,
      });
    }

    return { projectId, locale, favoriteListId, potId };
  },
});
