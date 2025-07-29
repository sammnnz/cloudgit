CREATE TYPE "REPOACCESS" AS ENUM (
	'public',
	'private'
);

CREATE TYPE "MAINTAINERACCESS" AS ENUM (
	'full',
	'partial'
);

CREATE TABLE "storage" (
	"id" BIGSERIAL NOT NULL UNIQUE,
	"link" VARCHAR(255) NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE "file" (
	"id" BIGSERIAL NOT NULL UNIQUE,
	"name" VARCHAR(255) NOT NULL,
	-- relative path into repo
	"path" VARCHAR(255) NOT NULL,
	-- `NULL` equal without extension
	"ext" VARCHAR(255),
	"branch_id" BIGINT NOT NULL,
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "file"."path" IS 'relative path into repo';
COMMENT ON COLUMN "file"."ext" IS '`NULL` equal without extension';
CREATE INDEX "file_index_branch_id"
ON "file" ("branch_id");
CREATE INDEX "file_index_ext"
ON "file" ("ext");

CREATE TABLE "repo" (
	"id" BIGSERIAL NOT NULL UNIQUE,
	-- repo holder
	"user_id" INTEGER NOT NULL,
	-- `NULL` when repo store locale
	"storage_id" BIGINT,
	"name" CHAR(32) NOT NULL,
	-- values: private, public
	"access" REPOACCESS NOT NULL,
	-- path into storage
	"path" VARCHAR(255) NOT NULL,
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "repo"."user_id" IS 'repo holder';
COMMENT ON COLUMN "repo"."storage_id" IS '`NULL` when repo store locale';
COMMENT ON COLUMN "repo"."access" IS 'values: private, public';
COMMENT ON COLUMN "repo"."path" IS 'path into storage';
CREATE INDEX "repo_index_user_id"
ON "repo" ("user_id");
CREATE INDEX "repo_index_storage_id"
ON "repo" ("storage_id");
CREATE INDEX "repo_index_access"
ON "repo" ("access");

CREATE TABLE "maintainer" (
	"id" BIGSERIAL NOT NULL UNIQUE,
	"repo_id" BIGINT NOT NULL,
	"user_id" INTEGER NOT NULL,
	-- values: full, partial
	"access" MAINTAINERACCESS NOT NULL,
	PRIMARY KEY("id")
);


COMMENT ON COLUMN "maintainer"."access" IS 'values: full, partial';
CREATE INDEX "maintainer_index_repo_id"
ON "maintainer" ("repo_id");

CREATE TABLE "branch" (
	"id" BIGSERIAL NOT NULL UNIQUE,
	"repo_id" BIGINT NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"is_default" BOOLEAN NOT NULL,
	PRIMARY KEY("id")
);


CREATE INDEX "branch_index_repo_id"
ON "branch" ("repo_id");
CREATE INDEX "branch_index_is_default"
ON "branch" ("default");

CREATE TABLE "auth_user_external" (
	"id" SERIAL NOT NULL UNIQUE,
	"user_id" INTEGER NOT NULL,
	PRIMARY KEY("id")
);



ALTER TABLE "repo"
ADD FOREIGN KEY("storage_id") REFERENCES "storage"("id")
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "maintainer"
ADD FOREIGN KEY("repo_id") REFERENCES "repo"("id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "branch"
ADD FOREIGN KEY("repo_id") REFERENCES "repo"("id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "file"
ADD FOREIGN KEY("branch_id") REFERENCES "branch"("id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "repo"
ADD FOREIGN KEY("user_id") REFERENCES "auth_user_external"("id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "maintainer"
ADD FOREIGN KEY("user_id") REFERENCES "auth_user_external"("id")
ON UPDATE CASCADE ON DELETE CASCADE;