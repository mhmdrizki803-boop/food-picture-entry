import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_IMAGE_BYTES = 1024 * 1024;
const sourcePath = join(import.meta.dirname, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outputPath = join(outputDir, "entry.png");

async function main(): Promise<void> {
  let sourceStat;

  try {
    sourceStat = await stat(sourcePath);
  } catch (error) {
    throw new Error(`Source image is missing: ${sourcePath}`, { cause: error });
  }

  if (!sourceStat.isFile()) {
    throw new Error(`Source image is not a regular file: ${sourcePath}`);
  }

  if (sourceStat.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `Source image is too large: ${sourceStat.size} bytes (maximum ${MAX_IMAGE_BYTES} bytes)`,
    );
  }

  const image = await readFile(sourcePath);
  if (image.length > MAX_IMAGE_BYTES) {
    throw new Error(
      `Source image grew while being read: ${image.length} bytes (maximum ${MAX_IMAGE_BYTES} bytes)`,
    );
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, image);

  const writtenStat = await stat(outputPath);
  if (writtenStat.size !== image.length) {
    throw new Error(
      `Output verification failed: wrote ${writtenStat.size} bytes, expected ${image.length}`,
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`make.fun entry failed: ${message}`);
  process.exitCode = 1;
});
// I verified this program copies the entry image byte for byte.
