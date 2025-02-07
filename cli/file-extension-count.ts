import { streamDirectoryScanner } from "@/utils/file";
import { asyncIteratorToArray } from "@/utils/iterator";

const dir = process.argv[2] || ".";

const filePaths = await asyncIteratorToArray(streamDirectoryScanner(dir));

console.log(`✅ Found ${filePaths.length} files`);

const differentFileExtensions = new Set(
  filePaths.map((f) => f.split(".").pop())
);
!global.silent &&
  console.log(
    `👉 Found ${differentFileExtensions.size} extensions: ${Array.from(
      differentFileExtensions
    ).join(", ")}`
  );
