import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import type { UploadedFileData } from "uploadthing/types";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import {
  events,
  files,
  projects,
  projectToUsers,
  users,
} from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
import { createNotification } from "@/server/notifications";
import { generatePdfThumbnail } from "@/server/pdf-thumbnail";
import { sendNotificationsToUsers } from "@/server/push";
import { utapi } from "@/server/uploadthing";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const uploadFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  fileUploader: f({
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "4MB" },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      const projectId = req.headers.get("x-project-id");
      if (!projectId) {
        throw new UploadThingError("Project ID not found");
      }

      const membership = await db.query.projectToUsers.findFirst({
        columns: { projectId: true },
        where: and(
          eq(projectToUsers.projectId, projectId),
          eq(projectToUsers.userId, session.user.id),
        ),
      });
      if (!membership) {
        throw new UploadThingError("Unauthorized");
      }

      let eventId = req.headers.get("x-event-id");
      if (eventId === "") {
        eventId = null;
      }

      if (eventId) {
        const event = await db.query.events.findFirst({
          columns: { id: true },
          where: and(eq(events.id, eventId), eq(events.projectId, projectId)),
        });
        if (!event) {
          throw new UploadThingError("Event not found");
        }
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, projectId, eventId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload

      const thumbnail =
        file.type === "application/pdf"
          ? await generatePdfThumbnail(file.url)
          : null;

      await db.insert(files).values({
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        url: file.url,
        thumbnailUrl: thumbnail?.url ?? null,
        type: file.type,
        size: file.size,
        uploadedBy: metadata.userId,
        projectId: metadata.projectId,
        eventId: metadata.eventId,
      });

      revalidatePath(`/[locale]/groups/${metadata.projectId}/files`, "page");

      if (metadata.eventId) {
        revalidatePath(
          `/[locale]/groups/${metadata.projectId}/calendar/${metadata.eventId}`,
          "page",
        );
      }

      getPostHogServer().capture({
        distinctId: metadata.userId,
        event: "upload_file",
        properties: {
          projectId: metadata.projectId,
          eventId: metadata.eventId,
          type: file.type,
          size: file.size,
        },
      });

      sendFileNotification(
        file,
        metadata.userId,
        metadata.projectId,
        metadata.eventId,
      );

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {};
    }),
  profileImageUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      const user = await db.query.users.findFirst({
        columns: { customImage: true },
        where: eq(users.id, session.user.id),
      });

      return { userId: session.user.id, oldImage: user?.customImage ?? null };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (metadata.oldImage) {
        const key = metadata.oldImage.split("/").pop();
        if (key) {
          await utapi.deleteFiles([key]);
        }
      }

      await db
        .update(users)
        .set({ customImage: file.url })
        .where(eq(users.id, metadata.userId));

      revalidatePath("/");

      getPostHogServer().capture({
        distinctId: metadata.userId,
        event: "upload_profile_image",
      });

      return {};
    }),

  groupImageUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      const projectId = req.headers.get("x-project-id");
      if (!projectId) {
        throw new UploadThingError("Project ID not found");
      }

      const project = await db.query.projects.findFirst({
        columns: { id: true, createdBy: true, image: true },
        where: eq(projects.id, projectId),
      });
      if (!project || project.createdBy !== session.user.id) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id, projectId, oldImage: project.image };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (metadata.oldImage) {
        const key = metadata.oldImage.split("/").pop();
        if (key) {
          await utapi.deleteFiles([key]);
        }
      }

      await db
        .update(projects)
        .set({ image: file.url })
        .where(eq(projects.id, metadata.projectId));

      revalidatePath("/");

      getPostHogServer().capture({
        distinctId: metadata.userId,
        event: "upload_group_image",
        properties: { projectId: metadata.projectId },
      });

      return {};
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter;

function sendFileNotification(
  file: UploadedFileData,
  userId: string,
  projectId: string,
  eventId: string | null,
) {
  const path = eventId
    ? `/groups/${projectId}/calendar/${eventId}`
    : `/groups/${projectId}/files`;
  const section = eventId ? "calendar" : "files";

  setTimeout(() => {
    db.query.projects
      .findFirst({
        columns: {
          id: true,
          name: true,
          createdBy: true,
          inviteToken: true,
        },
        with: {
          users: { columns: {}, with: { user: true } },
          categories: true,
        },
        where: and(eq(projects.id, projectId)),
      })
      .then(async (project) => {
        if (!project) {
          console.error(
            "Could not find project after uploading file",
            projectId,
          );
          return;
        }

        const params = { name: file.name };
        const fallbackBody = await translateNotificationBody(
          "file_uploaded",
          params,
          null,
        );

        await createNotification({
          type: "file_uploaded",
          title: project.name,
          body: fallbackBody,
          bodyParams: params,
          path,
          section,
          image: file.type.includes("image") ? file.url : undefined,
          projectId: project.id,
          createdBy: userId,
        });

        await sendNotificationsToUsers({
          users: project.users
            .filter((u) => u.user.id !== userId)
            .map((u) => u.user.id),
          body: fallbackBody,
          bodyKey: "file_uploaded",
          bodyParams: params,
          title: project.name,
          path,
          image: file.type.includes("image") ? file.url : undefined,
        });
      })
      .catch((err) => {
        console.error("Could not find project after uploading file", err);
      });
  }, 0);
}
