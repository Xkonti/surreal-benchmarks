import { mkdir } from "node:fs/promises";
import { runBenchmark } from "./benchmarkRunner";
import { homelanderSet, jabbaSet, translucentSet, visionSet, type DatabaseDef } from "./database";
import { writeToCSV } from "./csvWriter";
import { processResults } from "./resultsProcessor";
import type { BenchmarkDef } from "./benchmark";
import { firstOneSchemaless, firstOneSchemafull } from "./benchmarks/first_one";
import { tombstonesBenchmark } from "./benchmarks/tombstones";

console.log("Hello via Bun!");

const currentData = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const outputDir = "./results/" + currentData;
await mkdir(outputDir, { recursive: true });

interface Plan {
  name: string;
  dbs: DatabaseDef[];
  benchmarks: BenchmarkDef[];
}

const plans: Plan[] = [
  {
    name: "Jabba",
    dbs: jabbaSet,
    benchmarks: [
      firstOneSchemaless,
      firstOneSchemafull,
      tombstonesBenchmark,
    ]
  },
  {
    name: "Translucent",
    dbs: translucentSet,
    benchmarks: [
      firstOneSchemaless,
      firstOneSchemafull,
      tombstonesBenchmark,
    ]
  },
  {
    name: "Vision",
    dbs: visionSet,
    benchmarks: [
      firstOneSchemaless,
      firstOneSchemafull,
      tombstonesBenchmark,
    ]
  },
  {
    name: "Homelander",
    dbs: homelanderSet,
    benchmarks: [
      firstOneSchemaless,
      firstOneSchemafull,
      tombstonesBenchmark,
    ]
  },
];

async function runPlan(plan: Plan) {
  for (const db of plan.dbs) {
    for (const benchmark of plan.benchmarks) {
      console.log(db.name, " - Starting benchmark", benchmark.name);
      let results = await runBenchmark(db, benchmark);
      console.log(db.name, " - Finished benchmark", benchmark.name);
      // Save raw data to a CSV file
      writeToCSV(db.name, benchmark.name, "-raw", results, outputDir);
      let processedResults = processResults(results);
      // Save summary data to a CSV file
      writeToCSV(db.name, benchmark.name, "-summary", processedResults, outputDir);
    }
  }
}

let tasks: Promise<void>[] = [];
for (const plan of plans) {
  tasks.push(runPlan(plan));
}

await Promise.all(tasks);
console.log("All benchmarks finished!");