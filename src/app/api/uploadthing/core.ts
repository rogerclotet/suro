import { auth } from "@/auth";
import { db } from "@/server/db";
import { files, projects } from "@/server/db/schema";
import { sendNotificationsToUsers } from "@/server/push";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import type { UploadedFileData } from "uploadthing/types";

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

      let eventId = req.headers.get("x-event-id");
      if (eventId === "") {
        eventId = null;
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, projectId, eventId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload

      await db.insert(files).values({
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        url: file.url,
        type: file.type,
        size: file.size,
        uploadedBy: metadata.userId,
        projectId: metadata.projectId,
        eventId: metadata.eventId,
      });

      revalidatePath(`/grups/${metadata.projectId}/fitxers`);

      if (metadata.eventId) {
        revalidatePath(
          `/grups/${metadata.projectId}/calendari/${metadata.eventId}`,
        );
      }

      sendNotification(
        file,
        metadata.userId,
        metadata.projectId,
        metadata.eventId,
      );

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {};
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter;

function sendNotification(
  file: UploadedFileData,
  userId: string,
  projectId: string,
  eventId: string | null,
) {
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
      .then((project) => {
        if (!project) {
          console.error(
            "Could not find project after uploading file",
            projectId,
          );
          return;
        }

        sendNotificationsToUsers(
          project.users
            .filter((u) => u.user.id !== userId)
            .map((u) => u.user.id),
          `Fitxer ${file.name} afegit`,
          project.name,
          eventId
            ? `/grups/${project.id}/calendari/${eventId}`
            : `/grups/${project.id}/fitxers`,
        ).catch((err) => {
          console.error(
            "Failed to send push notification after uploading file",
            err,
          );
        });
      })
      .catch((err) => {
        console.error("Could not find project after uploading file", err);
      });
  }, 0);
}