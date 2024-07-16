import { auth } from "@/auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
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

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, projectId };
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
      });

      revalidatePath("/projectes/[projectId]/fitxers");

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {};
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter;
