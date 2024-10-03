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
  // queries: [],
  queries: [
  {
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
    name: "admin's with 20+ likes",
    query: /**surql**/`
      SELECT id FROM comment WHERE author.is_admin AND array::len(array::flatten(SELECT VALUE <-likes FROM $parent)) >= 20;`,
  },
  {
    name: "admin's approved with 20+ likes",
    query: /**surql**/`
      SELECT id FROM comment WHERE author.is_admin AND approved AND array::len(array::flatten(SELECT VALUE <-likes FROM $parent)) >= 20;`,
  },
  {
    name: "admin's approved with 20+ likes, older",
    query: /**surql**/`
      SELECT id FROM comment WHERE author.is_admin AND approved AND createdAt < author.createdAt AND array::len(array::flatten(SELECT VALUE <-likes FROM $parent)) >= 20;`,
  },
  {
    name: "count admins",
    query: /**surql**/`
      SELECT count() FROM user WHERE is_admin GROUP ALL;`,
  },
  {
    name: "count admins' post likes",
    query: /**surql**/`
      RETURN array::len(array::flatten((SELECT VALUE ->likes->post FROM (SELECT VALUE id from user WHERE is_admin))));`,
  },
  {
    name: "count admins' comment likes",
    query: /**surql**/`
      RETURN array::len(array::flatten((SELECT VALUE ->likes->comment FROM (SELECT VALUE id from user WHERE is_admin))));`,
  },
  {
    name: "posts where all authors are admins",
    query: /**surql**/`
      SELECT id, authors FROM post WHERE array::len(SELECT value id FROM $parent.authors WHERE is_admin) == array::len(authors);`,
  },
  {
    name: "comments created after deletion and left on posts published after deletion",
    query: /**surql**/`
      SELECT * FROM comment WHERE !!deletedAt AND createdAt > deletedAt AND !!(post.deletedAt) AND post.publishedAt > post.deletedAt;`,
  },
  {
    name: "comments created after deletion and left on posts non-deleted posts with more than 200 likes #1",
    query: /**surql**/`
LET $comments = (SELECT * FROM comment WHERE !!deletedAt AND createdAt > deletedAt AND !(post.deletedAt));
SELECT * FROM $comments WHERE array::len(array::flatten(SELECT VALUE <-likes FROM $parent.post)) > 200;`,
  },
  {
    name: "comments created after deletion and left on posts non-deleted posts with more than 200 likes #2",
    query: /**surql**/`
LET $posts = (SELECT VALUE id FROM post WHERE !deletedAt AND array::len(array::flatten(SELECT VALUE <-likes FROM $parent)) > 200);
SELECT * FROM comment WHERE !!deletedAt AND createdAt > deletedAt AND post INSIDE $posts;`,
  },
  {
    name: "posts that have nested comments - unoptimized",
    query: /**surql**/`
LET $comments = (SELECT VALUE post FROM comment WHERE !!responseTo);
SELECT * FROM post WHERE (SELECT count() FROM $comments WHERE post = $parent.id GROUP ALL)[0].count;`,
  },
  {
    name: "posts that have nested comments - optimized",
    query: /**surql**/`
      RETURN array::distinct(SELECT VALUE post FROM comment WHERE !!responseTo).*;`,
  },
  {
    name: "how many comments each post has - where and count",
    query: /**surql**/`
      SELECT id, (SELECT count() FROM comment WHERE post = $parent GROUP ALL)[0].count as count FROM post;`,
  },
  // { // array::filter is 2.x only
  //   name: "how many comments each post has - filter and len",
  //   query: /**surql**/`
  //     SELECT id, (array::len(array::filter((SELECT VALUE post FROM comment), $parent))) as count FROM post;`,
  // },
  {
    name: "how many comments each post has - group by",
    query: /**surql**/`
      SELECT post, count(post) FROM comment GROUP BY post;`,
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
RETURN NONE;`
  }

  // GENERATE POSTS
  const postsCount = 300;
  const postIds: string[] = [];
  for (let i = 0; i < postsCount; i++) {
    const id = `post:⟨${chance.guid()}⟩`;
    postIds.push(id);
    const authors = chance.pickset(userIds, chance.natural({min: 1, max: 4}));
    const title = chance.sentence();
    const content = chance.paragraph();
    const publishedAt = chance.date().toISOString();
    const deletedAt = chance.bool({likelihood: 5})
      ? chance.date().toISOString()
      : null;
    yield /**surql**/`CREATE ${id} SET
authors = ${'[' + authors.join(', ') + ']'},
title = "${title}",
content = "${content}",
publishedAt = d"${publishedAt}",
deletedAt = ${deletedAt == null ? "NONE" : 'd"' + deletedAt + '"'}
RETURN NONE;`

    // Generate likes for posts
    const likesCount = chance.natural({min: 0, max: 500});
    const likingUsers = chance.pickset(userIds, likesCount);
    yield /**surql**/`RELATE [${likingUsers.join(', ')}]->likes->${id} RETURN NONE;`
  }

  // GENERATE COMMENTS
  const commentsCount = 100000;
  let rootCommentIds: string[] = [];
  let postIdByCommentId: Record<string, string> = {};
  for (let i = 0; i < commentsCount; i++) {
    const id = `comment:⟨${chance.guid()}⟩`;
    const author = chance.pickone(userIds);
    const content = chance.paragraph();
    const createdAt = chance.date().toISOString();
    const updatedAt = chance.date().toISOString();
    const deletedAt = chance.bool({likelihood: 3})
      ? chance.date().toISOString()
      : null;
    const responseTo = chance.bool({likelihood: 75}) && rootCommentIds.length > 0
      ? chance.pickone(rootCommentIds)
      : null;
    const postId = responseTo == null
      ? chance.pickone(postIds)
      : postIdByCommentId[responseTo];
    const approved = chance.bool({likelihood: 50});

    // Register the relationship between the comment and the post
    postIdByCommentId[id] = postId;

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
post = ${postId},
responseTo = ${responseTo == null ? "NONE" : responseTo},
approved = ${approved}
RETURN NONE;`

    // Generate likes for comment
    const likesCount = chance.natural({min: 0, max: 30});
    const likingUsers = chance.pickset(userIds, likesCount);
    yield /**surql**/`RELATE [${likingUsers.join(', ')}]->likes->${id} RETURN NONE;`
  }
}

export async function saveGenDataQueryToFile(seed: number): Promise<void> {
  const queryFile = Bun.file("data/select_simple_gen_data.surql");
  const queryWriter = queryFile.writer();
  for await (const queryString of generateData(seed)) {
    await queryWriter.write(queryString + "\n");
  }
}