import { publishLaunchCourse } from "../src/lib/platform/launch-course";

async function main() {
  const result = await publishLaunchCourse();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
