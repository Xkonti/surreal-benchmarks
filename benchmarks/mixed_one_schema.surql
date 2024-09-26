----------------------------
-- ACCESS
----------------------------

DEFINE ACCESS users ON DATABASE TYPE RECORD
    WITH JWT ALGORITHM RS256 KEY "-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----"
    AUTHENTICATE {
        LET $userId = <record<user>>$token.ID;
        UPSERT $userId SET
            username = $token.name,
            email = $token.email
        ;
        RETURN $userId;
    }
;

----------------------------
-- USER
----------------------------

DEFINE TABLE user TYPE NORMAL SCHEMAFULL
PERMISSIONS FOR select, delete
    WHERE $access = "users"
    AND id = $auth.id
;

DEFINE FIELD username
    ON TABLE user
    TYPE string
    ASSERT $value.len() > 1
;

DEFINE FIELD email
    ON TABLE user
    TYPE option<string>
    ASSERT !$value OR $value.is_email()
;

DEFINE FIELD author_id
    ON TABLE user
    TYPE option<string>
    DEFAULT NONE
    PERMISSIONS NONE
    COMMENT "An unique ID of the user that persists across multiple database instances - used to identify post authors"
;

-- Gets automatically set when the user is created
DEFINE FIELD created_at
    ON TABLE user
    TYPE datetime
    VALUE time::now()
    READONLY
;

-- Gets automatically set by an event
DEFINE FIELD updated_at
    ON TABLE user
    TYPE datetime
    VALUE time::now() -- This updates the field automatically
;

-- Make sure the author_id is unique
DEFINE INDEX unique_author_id
    ON TABLE user 
    COLUMNS author_id
    UNIQUE
;

----------------------------
-- APPROVED
----------------------------

DEFINE TABLE approved
    TYPE RELATION
    IN user OUT comment ENFORCED
    SCHEMAFULL
    PERMISSIONS
        FOR select, create, delete WHERE $access = "users" AND in = $auth.id
;

DEFINE FIELD date
    ON TABLE approved
    TYPE datetime
    VALUE time::now()
    READONLY
;

DEFINE FIELD note
    ON TABLE approved
    TYPE option<string>
;

DEFINE INDEX only_one_approval_per_comment
    ON TABLE approved 
    COLUMNS out UNIQUE;


DEFINE EVENT on_approval_creation
    ON TABLE approved
    WHEN $event == "CREATE"
    THEN {
        -- TODO: Test this properly with a frontend user
        IF $after.in NOT IN (SELECT VALUE ->comment.post<-authored<-user.id FROM ONLY $after LIMIT 1).flatten() {
            THROW "Only the outhor of the post can approve a comment on it";
        };

        UPDATE $after.out SET approved = true;
    }
;

DEFINE EVENT on_approval_deletion
    ON TABLE approved
    WHEN $event == "DELETE"
    THEN {
        UPDATE $before.out SET approved = false;
    }
;

DEFINE EVENT on_approval_update
    ON TABLE approved
    WHEN $event == "UPDATE"
    THEN {
        THROW "Cannot update approval status (" + (<string> $after.id) + ")";
    }
;



----------------------------
-- AUTHORED
----------------------------

DEFINE TABLE OVERWRITE authored
    TYPE RELATION
    IN user OUT post ENFORCED
    SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $access = "users" AND in = $auth.id
;

DEFINE FIELD OVERWRITE last_update_id
    ON TABLE authored
    TYPE uuid
    COMMENT "The ID of the last update to the relation - used to detect deleted relations"
;

DEFINE INDEX OVERWRITE unique_relation
    ON TABLE authored 
    COLUMNS in, out UNIQUE;

----------------------------
-- COMMENT
----------------------------

DEFINE TABLE OVERWRITE comment TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR select WHERE approved = true AND !post.draft AND !post.deleted_at
        FOR create FULL
;

DEFINE FIELD OVERWRITE content
    ON TABLE comment
    TYPE string
    ASSERT $value.len() <= 1000
;

DEFINE FIELD OVERWRITE author
    ON TABLE comment
    TYPE record<user>
    ASSERT $value.exists()
    PERMISSIONS
        FOR create WHERE author = $auth.id
;

DEFINE FIELD OVERWRITE created_at
    ON TABLE comment
    TYPE datetime
    VALUE time::now()
    READONLY
;

DEFINE FIELD OVERWRITE post
    ON TABLE comment
    TYPE record<post>
    ASSERT !reply_to OR reply_to.post.id == $value.id
    READONLY
;

DEFINE FIELD OVERWRITE reply_to
    ON TABLE comment
    TYPE option<record<comment>>
    ASSERT !$value OR $value.exists()
;

DEFINE FIELD OVERWRITE likes_count
    ON TABLE comment
	TYPE int
    DEFAULT 0
    PERMISSIONS
        FOR create, update, delete NONE
        FOR select FULL
    COMMENT "Calculated automatically"
;

DEFINE FIELD OVERWRITE approved
    ON TABLE comment
  	TYPE bool
    DEFAULT false
    PERMISSIONS
        FOR select, update, create, delete NONE
;

DEFINE EVENT OVERWRITE on_comment_created ON TABLE comment
    WHEN $event == "CREATE"
    THEN {
        IF !$after.post.exists() OR $after.draft OR $after.deleted_at {
            THROW "Can't comment on something that doesn't exist";
        };
        UPDATE $after.id SET
            approved = false,
            likes_count = 0
        ;
        # TODO: This is an opportunity to automatically approve the comment if it's the author's comment
    }
;

DEFINE EVENT OVERWRITE on_comment_approval_update ON TABLE comment
    WHEN $event == "UPDATE" AND $before.approved AND $before.approved != $after.approved
    THEN {
        IF $after.approved {
            UPDATE $after.post SET comments_count += 1;
        }
        ELSE {
            UPDATE $after.post SET comments_count -= 1;
        };
    }
;

DEFINE EVENT OVERWRITE on_comment_delete ON TABLE comment
    WHEN $event == "DELETE"
    THEN {
        IF $before.approved {
            UPDATE $before.post SET comments_count -= 1;
        };
    }
;

----------------------------
-- CONTAINS
----------------------------

DEFINE TABLE OVERWRITE contains
    TYPE RELATION
    IN series OUT post ENFORCED
    SCHEMAFULL
;

DEFINE FIELD OVERWRITE last_update_id
    ON TABLE contains
    TYPE uuid
    COMMENT "The ID of the last update to the relation - used to detect deleted relations"
;

DEFINE INDEX OVERWRITE unique_relation
    ON TABLE contains 
    COLUMNS in, out UNIQUE;

----------------------------
-- IS ABOUT
----------------------------

DEFINE TABLE OVERWRITE is_about
    TYPE RELATION
    IN post|series OUT topic ENFORCED
    SCHEMAFULL
;

DEFINE FIELD OVERWRITE deleted_at
    ON TABLE is_about
    TYPE option<datetime>
    DEFAULT NONE
    COMMENT "The date and time the relation was marked as deleted, it will be automatically deleted after a certain amount of time"
;

DEFINE FIELD OVERWRITE last_update_id
    ON TABLE is_about
    TYPE uuid
    COMMENT "The ID of the last update to the relation - used to detect deleted relations"
;

DEFINE INDEX OVERWRITE unique_relation
    ON TABLE is_about 
    COLUMNS in, out UNIQUE;

----------------------------
-- APPROVED
----------------------------

DEFINE TABLE OVERWRITE learned
    TYPE RELATION
    SCHEMAFULL
    PERMISSIONS
        FOR select, create, delete WHERE $access = "users" AND in = $auth.id
;

DEFINE FIELD OVERWRITE in
    ON TABLE learned
    TYPE record<user>
    ASSERT $value.exists()
;

DEFINE FIELD OVERWRITE out
    ON TABLE learned
    TYPE record<post>
;

DEFINE FIELD OVERWRITE date
    ON TABLE learned
    TYPE datetime
    VALUE time::now()
    READONLY
;

DEFINE INDEX OVERWRITE unique_relation
    ON TABLE learned 
    COLUMNS in, out UNIQUE;

DEFINE EVENT OVERWRITE on_learn_create ON TABLE learned
    WHEN $event == "CREATE"
    THEN {
        LET $post = $after.out;
        IF !$post.exists() OR $after.draft OR $after.deleted_at {
            THROW "Can't learn something that doesn't exist";
        };
        IF !$post.learnable {
            THROW "Can't learn a non-learnable post";
        };
    }
;

----------------------------
-- LIKED
----------------------------

DEFINE TABLE OVERWRITE liked
    TYPE RELATION
    SCHEMAFULL
    PERMISSIONS
        FOR select, create, delete WHERE $access = "users" AND in = $auth.id
;

DEFINE FIELD OVERWRITE in
    ON TABLE liked
    TYPE record<user>
    ASSERT $value.exists()
    PERMISSIONS FOR create WHERE id == $auth.id
;

DEFINE FIELD OVERWRITE out
    ON TABLE liked
    TYPE record<post|comment>
    -- Can't check if the post exists because the user doesn't have access to it
;

DEFINE INDEX OVERWRITE unique_relation
    ON TABLE liked
    COLUMNS in, out UNIQUE;

DEFINE EVENT OVERWRITE on_create ON TABLE liked
    WHEN $event == "CREATE"
    THEN {
        LET $target = $after.out;
        IF !$target.exists() OR $target.draft OR $target.deleted_at { 
            THROW "Can't like something that doesn't exist";
        };
        IF $target.table() == "comment" AND !$target.approved {
            THROW "Can't like an unapproved comment";
        };
        UPDATE $target SET likes_count += 1;
    }
;

DEFINE EVENT OVERWRITE on_delete ON TABLE liked
    WHEN $event == "DELETE"
    THEN {
        UPDATE $before.out SET likes_count -= 1;
    }
;

----------------------------
-- POST
----------------------------

DEFINE TABLE OVERWRITE post TYPE NORMAL SCHEMAFULL;

DEFINE FIELD OVERWRITE title
    ON TABLE post
    TYPE string
;

DEFINE FIELD OVERWRITE description
    ON TABLE post
    TYPE string
;

DEFINE FIELD OVERWRITE slug
    ON TABLE post
    TYPE string
    ASSERT $value.len() > 3 AND $value == $value.slug()
;

DEFINE FIELD OVERWRITE featured
    ON TABLE post
	TYPE bool
    DEFAULT false
;

DEFINE FIELD OVERWRITE obsolete
    ON TABLE post
	TYPE bool
;

DEFINE FIELD OVERWRITE draft
    ON TABLE post
	TYPE bool
    DEFAULT true
;

DEFINE FIELD OVERWRITE learnable
    ON TABLE post
	TYPE bool
    DEFAULT false
;

DEFINE FIELD OVERWRITE og_image
    ON TABLE post
    TYPE string
;

DEFINE FIELD OVERWRITE published_on
    ON TABLE post
    TYPE set<string>
    DEFAULT []
    COMMENT "URLs to version of this post on other sites"
;

DEFINE FIELD OVERWRITE published_on.*
    ON TABLE post
    TYPE string
    ASSERT $value.is_url();

DEFINE FIELD OVERWRITE published_at
    ON TABLE post
	TYPE datetime
    COMMENT "The date and time the post was first published"
;

DEFINE FIELD OVERWRITE updates
    ON TABLE post
    TYPE set<object>
    DEFAULT []
    COMMENT "List of updates to the content of the post"
;

DEFINE FIELD OVERWRITE updates.*.date
    ON TABLE post
	TYPE datetime
    ASSERT $value > published_at
;

DEFINE FIELD OVERWRITE updates.*.description
    ON TABLE post
	TYPE string
;

DEFINE FIELD OVERWRITE last_updated
    ON TABLE post
	TYPE datetime
    DEFAULT published_at
    COMMENT "The date and time the post was last updated"
;

DEFINE FIELD OVERWRITE deleted_at
    ON TABLE post
    TYPE option<datetime>
    DEFAULT NONE
    COMMENT "The date and time the post was marked as deleted, it will be automatically deleted after a certain amount of time"
;

DEFINE FIELD OVERWRITE last_update_id
    ON TABLE post
    TYPE uuid
    COMMENT "The ID of the last update to the post - used to detect deleted posts"
;

DEFINE FIELD OVERWRITE likes_count
    ON TABLE post
	TYPE int
    DEFAULT 0
    COMMENT "Calculated automatically"
;

DEFINE FIELD OVERWRITE comments_count
    ON TABLE post
	TYPE int
    DEFAULT 0
    COMMENT "Calculated automatically"
;

DEFINE EVENT OVERWRITE on_post_date_update
    ON TABLE post
    WHEN
        $event != "DELETE"
        AND ($before.published_at != $after.published_at OR $before.updates != $after.updates)
    THEN {
        IF $after.updates.len() > 0 {
            LET $lastest_update = (SELECT VALUE date FROM ONLY $after.updates ORDER BY date DESC LIMIT 1);
            UPDATE $after.id SET last_updated = $lastest_update;
        }
        ELSE {
            UPDATE $after.id SET last_updated = $after.published_at;
        }
    }
;

DEFINE EVENT OVERWRITE on_post_delete ON TABLE post
    WHEN $event == "DELETE"
    THEN {
        -- Delete all comments for the post when deleting the post
        LET $post_id = $before.id;
        LET $comments = (SELECT VALUE id FROM comment WHERE post.id == $post_id);
        DELETE $comments;
    }
;

DEFINE INDEX OVERWRITE unique_slug
    ON TABLE post 
    COLUMNS slug
    UNIQUE;

----------------------------
-- REQUIRES
----------------------------

DEFINE TABLE OVERWRITE requires
    TYPE RELATION
    SCHEMAFULL
    COMMENT "Whether a post requires the knowledge from another post"
;

DEFINE FIELD OVERWRITE in
    ON TABLE requires
    TYPE record<post>
    ASSERT $value != out AND $value.exists()
;

DEFINE FIELD OVERWRITE out
    ON TABLE requires
    TYPE record<post>
    ASSERT $value != in AND $value.exists() AND $value.learnable
;

DEFINE INDEX OVERWRITE unique_post_requirements 
    ON TABLE requires 
    COLUMNS in, out UNIQUE;

----------------------------
-- SERIES
----------------------------

DEFINE TABLE OVERWRITE series TYPE NORMAL SCHEMAFULL;

DEFINE FIELD OVERWRITE name
    ON TABLE series
    TYPE string
    ASSERT $value.len() >= 1
;

DEFINE FIELD OVERWRITE description
    ON TABLE series
    TYPE string
    ASSERT $value.len() >= 10
;

DEFINE FIELD OVERWRITE slug
    ON TABLE series
    TYPE string
    ASSERT $value.len() > 3 AND $value == $value.slug()
;

DEFINE FIELD OVERWRITE deleted_at
    ON TABLE series
    TYPE option<datetime>
    DEFAULT NONE
    COMMENT "The date and time the series was marked as deleted, it will be automatically deleted after a certain amount of time"
;

DEFINE FIELD OVERWRITE last_update_id
    ON TABLE series
    TYPE uuid
    COMMENT "The ID of the last update to the series - used to detect deleted series"
;

----------------------------
-- TOPIC
----------------------------

DEFINE TABLE OVERWRITE topic TYPE NORMAL SCHEMAFULL;

DEFINE FIELD OVERWRITE name
    ON TABLE topic
    TYPE string
    ASSERT $value.len() >= 1
;

DEFINE FIELD OVERWRITE description
    ON TABLE topic
    TYPE string
    ASSERT $value.len() >= 10
;

DEFINE FIELD OVERWRITE slug
    ON TABLE topic
    TYPE string
    ASSERT $value.len() > 1 AND $value == $value.slug()
;

DEFINE FIELD OVERWRITE deleted_at
    ON TABLE topic
    TYPE option<datetime>
    DEFAULT NONE
    COMMENT "The date and time the topic was marked as deleted, it will be automatically deleted after a certain amount of time"
;

DEFINE FIELD OVERWRITE last_update_id
    ON TABLE topic
    TYPE uuid
    COMMENT "The ID of the last update to the topic - used to detect deleted topics"
;

----------------------------
-- POST_INTERACTIONS
----------------------------

DEFINE TABLE OVERWRITE post_interactions TYPE NORMAL AS
    SELECT
        id AS post_id,
        likes_count AS likes_count,
        comments_count AS comments_count
    FROM post
    WHERE !draft AND !deleted_at
    PERMISSIONS
        FOR select FULL
;