export type BenchmarkDef = {
  name: string;
  namespace: string;
  benchmarkSetupQueries: QueryDef[];
  benchmarkTeardownQueries: QueryDef[];
  iterationSetupQueries: QueryDef[];
  iterationTeardownQueries: QueryDef[];
  queries: QueryDef[];

  /**
   * The number of times to repeat the benchmark.
   */
  iterations: number;

  /**
   * The number of database connections to use for the benchmark.
   * Each connection is supposed to execute all benchmark queries in parallel with other connections.
   */
  numberOfConnections: number;
};

export type QueryDef = {
  name: string;
  query: string | ((seed: number) => AsyncGenerator<string>);
};

export function getIterable(query: QueryDef, seed: number): string[] | AsyncGenerator<string> {
  if (typeof query.query === "string") {
    return [query.query];
  }
  return query.query(seed);
}

export type BenchmarkTimingResult = {
  iterationResults: IterationResult[];
}

export type IterationResult = {
  timePerQuery: number[];
};