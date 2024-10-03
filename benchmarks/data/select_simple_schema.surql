-- USERS
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON TABLE user TYPE string;
DEFINE FIELD email ON TABLE user TYPE string;
DEFINE FIELD createdAt ON TABLE user TYPE datetime;
DEFINE FIELD is_admin ON TABLE user TYPE bool;

DEFINE INDEX uniqueEmail ON TABLE user COLUMNS email UNIQUE;

-- POSTS
DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD authors ON TABLE post TYPE set<record<user>>;
DEFINE FIELD title ON TABLE post TYPE string;
DEFINE FIELD content ON TABLE post TYPE string;
DEFINE FIELD publishedAt ON TABLE post TYPE datetime;
DEFINE FIELD deletedAt ON TABLE post TYPE option<datetime>;

DEFINE INDEX indexByDeletedAt ON TABLE post COLUMNS deletedAt;

-- COMMENTS
DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD author ON TABLE comment TYPE record<user>;
DEFINE FIELD content ON TABLE comment TYPE string;
DEFINE FIELD createdAt ON TABLE comment TYPE datetime;
DEFINE FIELD updatedAt ON TABLE comment TYPE datetime;
DEFINE FIELD deletedAt ON TABLE comment TYPE option<datetime>;
DEFINE FIELD post ON TABLE comment TYPE record<post>;
DEFINE FIELD responseTo ON TABLE comment TYPE option<record<comment>>;
DEFINE FIELD approved ON TABLE comment TYPE bool;

DEFINE INDEX indexByAuthor ON TABLE comment COLUMNS author;
DEFINE INDEX indexByDeletedAt ON TABLE comment COLUMNS deletedAt;
DEFINE INDEX indexApproved ON TABLE comment COLUMNS approved;
DEFINE INDEX indexByPost ON TABLE comment COLUMNS post;

-- LIKES - schemaless on purpose
DEFINE TABLE likes TYPE RELATION;