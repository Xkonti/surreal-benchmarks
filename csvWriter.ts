import type { BenchmarkTimingResult } from "./benchmark";

export function writeToCSV(benchmarkName: string, databaseName: string, results: BenchmarkTimingResult, outputDir: string) {
  const file = Bun.file(`${outputDir}/${benchmarkName}-${databaseName}.csv`, );
  // Bun.write(file, "Hello?", { createPath: true });
  const writer = file.writer();

  // Find the max number of queries per iteration
  let maxQueries = 0;
  for (const iteration of results.iterationResults) {
    if (iteration.timePerQuery.length > maxQueries) {
      maxQueries = iteration.timePerQuery.length;
    }
  }

  // Write the header
  writer.write("iteration")
  for (let i = 1; i <=maxQueries; i++) {
    writer.write(",query" + i);
  }
  writer.write("\n");

  // Write the results row by row
  for (let i = 1; i <= results.iterationResults.length; i++) {
    writer.write(`#${i}`);
    for (const time of results.iterationResults[i - 1].timePerQuery) {
      writer.write(`,${time}`);
    }
    writer.write("\n");
  }

  writer.end();
}