services-up:
	docker compose -f infra/compose.yml up -d

services-down:
	docker compose -f infra/compose.yml down

services-stop:
	docker compose -f infra/compose.yml stop

run-dev:
	make services-up
	npm run wait-for-postgres
	npm run dev
