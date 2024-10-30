import { auth } from "@/auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { getUserProject } from "@/server/projects";
import { sendPushNotification } from "@/server/push";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

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

      setTimeout(() => {
        getUserProject(metadata.projectId)
          .then((project) => {
            if (!project) {
              return;
            }

            sendPushNotification(
              project,
              `Fitxer ${file.name} afegit`,
              project.name,
              metadata.eventId
                ? `/grups/${project.id}/calendari/${metadata.eventId}`
                : `/grups/${project.id}/fitxers`,
            ).catch((err) => {
              console.error(
                "Failed to send push notification after uploading file",
                err,
              );
            });
          })
          .catch((err) => {
            console.error("Failed to get project after uploading file", err);
          });
      }, 0);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {};
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter;
