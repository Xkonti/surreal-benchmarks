import type { BenchmarkTimingResult } from "./benchmark";


export function processResults(results: BenchmarkTimingResult): BenchmarkTimingResult {

  let summary: BenchmarkTimingResult = {
    iterationResults: []
  };

  let resultsPerQuery: number[] = [];

  // Find the max number of queries per iteration
  let queriesCount = 0;
  for (const iteration of results.iterationResults) {
    if (iteration.timePerQuery.length > queriesCount) {
      queriesCount = iteration.timePerQuery.length;
    }
  }

  // Iteration 1: Calculate averate time of each query
  let averages: number[] = [];
  for (let queryIndex = 0; queryIndex < queriesCount; queryIndex++) {
    let sum = 0;
    let entriesCount = 0;
    for (const iteration of results.iterationResults) {
      if (iteration.timePerQuery.length <= queryIndex) {
        continue;
      }
      const entry = iteration.timePerQuery[queryIndex];
      if (entry == -1) {
        continue;
      }
      sum += iteration.timePerQuery[queryIndex];
      entriesCount++;
    }

    if (entriesCount == 0) {
      break;
    }
    const average = sum / entriesCount;
    averages.push(average);
    resultsPerQuery.push(entriesCount);
  }

  summary.iterationResults.push({
    timePerQuery: averages
  });

  // TODO: Iteration 2: Calculate standard deviation of each query


  // TODO: Iteration 3: Calculate median of each query

  // Number of results per query

  summary.iterationResults.push({
    timePerQuery: resultsPerQuery
  });

  return summary;
}