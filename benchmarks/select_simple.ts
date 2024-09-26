import { type BenchmarkDef, type QueryDef } from "../benchmark";
import Chance from "chance";

let cachedCreationQuery: string | undefined;
export async function getCreationQuery(seed: number): Promise<string> {
  if (cachedCreationQuery === undefined) {
    let query = "";
    for await (let subQuery of generateData(seed)) {
      query += subQuery;
    }
    cachedCreationQuery = query;
  }
  return cachedCreationQuery;
}


const iterations = 1;
const namespace = "selectsimple";

const schemaSetupQuery: QueryDef = {
  name: "setup",
  query: loadSchemaAsString,
};

const dataGenQuery: QueryDef = {
  name: "datagen",
  query: generateData,
};

const teardownQuery: QueryDef = {
  name: "teardown",
  query: /**surql**/`
    REMOVE NAMESPACE ${namespace};
    `,
};

export const selectSimpleBenchmark: BenchmarkDef = {
  name: "selectsimple",
  namespace: namespace,
  benchmarkSetupQueries: [schemaSetupQuery, dataGenQuery],
  benchmarkTeardownQueries: [teardownQuery],
  iterationSetupQueries: [],
  iterationTeardownQueries: [],
  queries: [{
    name: "select slightly invalid",
    query: /**surql**/`
      SELECT id FROM comment WHERE deletedAt IS NOT NONE AND deletedAt < createdAt;`,
  },
  {
    name: "select very invalid",
    query: /**surql**/`
      SELECT id FROM comment WHERE deletedAt IS NOT NONE AND deletedAt < createdAt AND updatedAt < createdAt;`,
  },
  {
    name: "select very invalid from admin",
    query: /**surql**/`
      SELECT id FROM comment WHERE deletedAt IS NOT NONE AND deletedAt < createdAt AND updatedAt < createdAt AND author.is_admin;`,
  },
  {
    name: "select very invalid from admin with identity",
    query: /**surql**/`
      SELECT author.id, author.name, author.email FROM comment WHERE deletedAt IS NOT NONE AND deletedAt < createdAt AND updatedAt < createdAt AND author.is_admin;`,
  },
  {
    name: "admin's with 400+ likes",
    query: /**surql**/`
      SELECT id FROM comment WHERE author.is_admin AND likes >= 400;`,
  },
  {
    name: "admin's approved with 400+ likes",
    query: /**surql**/`
      SELECT id FROM comment WHERE author.is_admin AND likes >= 400 AND approved;`,
  },
  {
    name: "admin's approved with 400+ likes, older",
    query: /**surql**/`
      SELECT id FROM comment WHERE author.is_admin AND likes >= 400 AND approved AND createdAt < author.createdAt;`,
  },
  // {
  //   name: "find unapproved comments that are replies to other some user's comments",
  //   // TODO: Compare single query vs multiple step query performance
  //   query: /**surql**/`
  //     ???`,
  // }
  ],
  iterations: iterations,
  numberOfConnections: 1,
};

async function* loadSchemaAsString(_: number): AsyncGenerator<string> {
  const query = Bun.file("benchmarks/data/select_simple_schema.surql");
  yield await query.text();
}

async function* generateCreationQuery(seed: number): AsyncGenerator<string> {
  yield await getCreationQuery(seed);
}

async function* generateData(seed: number): AsyncGenerator<string> {
  const chance = new Chance(seed);

  // GENERATE USERS
  const usersCount = 1000;
  const userIds: string[] = [];
  const userEmails: string[] = [];
  function nextEmail(): string {
    let triesLeft = 500;
    while (triesLeft > 0) {
      const email = chance.email();
      if (!userEmails.includes(email)) {
        userEmails.push(email);
        return email;
      }
      triesLeft--;
    }
    throw new Error("Failed to generate unique email");
  }

  for (let i = 0; i < usersCount; i++) {
    const id = `user:⟨${chance.guid()}⟩`;
    userIds.push(id);
    const name = chance.name();
    const email = nextEmail();
    const createdAt = chance.date().toISOString();
    const isAdmin = chance.bool({likelihood: 2});
    yield /**surql**/`CREATE ${id} SET
name = "${name}",
email = "${email}",
createdAt = d"${createdAt}",
is_admin = ${isAdmin}
RETURN NULL;`
  }

  // GENERATE COMMENTS
  const commentsCount = 100000;
  let rootCommentIds: string[] = [];
  for (let i = 0; i < commentsCount; i++) {
    const id = `comment:⟨${chance.guid()}⟩`;
    const author = chance.pickone(userIds);
    const content = chance.paragraph();
    const createdAt = chance.date().toISOString();
    const updatedAt = chance.date().toISOString();
    const deletedAt = chance.bool({likelihood: 3})
      ? chance.date().toISOString()
      : null;
    const likes = chance.integer({min: 0, max: 500});
    const responseTo = chance.bool({likelihood: 75}) && rootCommentIds.length > 0
      ? chance.pickone(rootCommentIds)
      : null;
    const approved = chance.bool({likelihood: 50});

    // Allow only some comments to have a response
    if (chance.bool({likelihood: 5})) {
      rootCommentIds.push(id);
    }

    yield /**surql**/`CREATE ${id} SET
author = ${author},
content = "${content}",
createdAt = d"${createdAt}",
updatedAt = d"${updatedAt}",
deletedAt = ${deletedAt == null ? "NONE" : 'd"' + deletedAt + '"'},
likes = ${likes},
responseTo = ${responseTo == null ? "NONE" : responseTo},
approved = ${approved}
RETURN NULL;`
  }
}

export async function saveGenDataQueryToFile(seed: number): Promise<void> {
  const queryFile = Bun.file("data/select_simple_gen_data.surql");
  const queryWriter = queryFile.writer();
  for await (const queryString of generateData(seed)) {
    await queryWriter.write(queryString + "\n");
  }
}