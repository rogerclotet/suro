import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { generatePdfThumbnail } from "@/server/pdf-thumbnail";

async function main() {
  const pdfs = await db.query.files.findMany({
    where: and(eq(files.type, "application/pdf"), isNull(files.thumbnailUrl)),
    columns: { id: true, name: true, url: true },
  });

  console.log(`Found ${pdfs.length} PDFs without thumbnails`);

  let succeeded = 0;
  let failed = 0;

  for (const pdf of pdfs) {
    process.stdout.write(`Processing ${pdf.name} (${pdf.id})... `);

    const thumbnail = await generatePdfThumbnail(pdf.url);
    if (!thumbnail) {
      console.log("failed");
      failed++;
      continue;
    }

    await db
      .update(files)
      .set({ thumbnailUrl: thumbnail.url })
      .where(eq(files.id, pdf.id));

    console.log("ok");
    succeeded++;
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
