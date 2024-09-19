import { type BenchmarkDef, type QueryDef } from "../benchmark";

const performTestsQuery: QueryDef = {
  name: "perform tests",
  query: /**surql**/`
    RETURN "Ready";
    CREATE |test1:30000| SET numberA = rand::int(-1000, 1000), numberB = rand::int(-1000, 1000), numberC = rand::int(-1000, 1000) RETURN NULL;
    SELECT * FROM test1;
    SELECT * FROM test1 WHERE numberA > numberB AND numberB > numberC;
    SELECT numberA AS result FROM test1 WHERE numberA > numberB AND numberB > numberC;
    `,
};

export const cleanupQuery: QueryDef = {
  name: "cleanup",
  query: /**surql**/ "DELETE test1; REMOVE TABLE test1;",
};

export const firstOneSchemaless: BenchmarkDef = {
  name: "first_one_schemaless",
  namespace: "firstoneschemaless",
  queries: [
    {
      name: "define table",
      query: /**surql**/`DEFINE TABLE test1;`,
    },
    performTestsQuery,
    cleanupQuery,
  ],
  iterations: 15,
  numberOfConnections: 1,
};

export const firstOneSchemafull: BenchmarkDef = {
  name: "first_one_schemafull",
  namespace: "firstoneschemafull",
  queries: [
    {
      name: "define table",
      query: /**surql**/`
        DEFINE TABLE test1;
        DEFINE FIELD numberA ON TABLE test1 TYPE number;
        DEFINE FIELD numberB ON TABLE test1 TYPE number;
        DEFINE FIELD numberC ON TABLE test1 TYPE number;
        `,
    },
    performTestsQuery,
    cleanupQuery,
  ],
  iterations: 15,
  numberOfConnections: 1,
};

export const firstOneWithIndex: BenchmarkDef = {
  name: "first_one_with_index",
  namespace: "firstoneindex",
  queries: [
    {
      name: "define table",
      query: /**surql**/`
        DEFINE TABLE test1;
        DEFINE FIELD numberA ON TABLE test1 TYPE number;
        DEFINE FIELD numberB ON TABLE test1 TYPE number;
        DEFINE FIELD numberC ON TABLE test1 TYPE number;
        DEFINE INDEX indexnumberA ON TABLE test1 COLUMNS numberA;
        DEFINE INDEX indexnumberB ON TABLE test1 COLUMNS numberB;
        DEFINE INDEX indexnumberC ON TABLE test1 COLUMNS numberC;
        `,
    },
    performTestsQuery,
    cleanupQuery,
  ],
  iterations: 30,
  numberOfConnections: 1,
};