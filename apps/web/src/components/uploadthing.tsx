import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { UploadFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<UploadFileRouter>();
export const UploadDropzone = generateUploadDropzone<UploadFileRouter>();
