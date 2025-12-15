ALTER TABLE "body_records" ALTER COLUMN "recorded_date" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "display_name" varchar(100);