export type BenchmarkDef = {
  name: string;
  namespace: string;
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
  query: string;
};

export type BenchmarkTimingResult = {
  iterationResults: IterationResult[];
}

export type IterationResult = {
  timePerQuery: number[];
};