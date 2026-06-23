CREATE TABLE "users"(
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "users" ADD PRIMARY KEY("id");
CREATE TABLE "pets"(
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "photo_url" TEXT NOT NULL,
    "feeding_instructions" TEXT NOT NULL,
    "approved_foods" TEXT NOT NULL,
    "forbidden_foods" TEXT NOT NULL,
    "emergency_notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "pets" ADD PRIMARY KEY("id");
CREATE TABLE "medications"(
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "medication_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "schedule_time" TEXT NOT NULL,
    "special_instructions" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "medications" ADD PRIMARY KEY("id");
CREATE TABLE "daily_tasks"(
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "task_name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "scheduled_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "daily_tasks" ADD PRIMARY KEY("id");
CREATE TABLE "care_logs"(
    "id" UUID NOT NULL,
    "daily_task_id" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "completed_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "care_logs" ADD PRIMARY KEY("id");
CREATE TABLE "proof_of_life_photos"(
    "id" UUID NOT NULL,
    "care_log_id" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "proof_of_life_photos" ADD PRIMARY KEY("id");
ALTER TABLE
    "daily_tasks" ADD CONSTRAINT "daily_tasks_pet_id_foreign" FOREIGN KEY("pet_id") REFERENCES "pets"("id");
ALTER TABLE
    "pets" ADD CONSTRAINT "pets_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "medications" ADD CONSTRAINT "medications_pet_id_foreign" FOREIGN KEY("pet_id") REFERENCES "pets"("id");
ALTER TABLE
    "proof_of_life_photos" ADD CONSTRAINT "proof_of_life_photos_id_foreign" FOREIGN KEY("id") REFERENCES "care_logs"("id");
ALTER TABLE
    "care_logs" ADD CONSTRAINT "care_logs_id_foreign" FOREIGN KEY("id") REFERENCES "daily_tasks"("id");