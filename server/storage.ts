// Neon Object Storage (S3-compatible, branches with the database). Bucket declared in neon.ts.
// The neon adapter reads AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3 and AWS_REGION.
import "server-only";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

export const ASSETS_BUCKET = "assets";

export const files = new Files({ adapter: neon({ bucket: ASSETS_BUCKET }) });
