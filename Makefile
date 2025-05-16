services-up:
	docker compose -f infra/compose.yml up -d

services-down:
	docker compose -f infra/compose.yml down

services-stop:
	docker compose -f infra/compose.yml stop

prepare-to-test:
	make services-up
	npm run wait-for-postgres
	npm run wait-for-app

run-dev:
	make services-up
	npm run wait-for-postgres
	npm run dev

run-test:
	make prepare-to-test
	npm run test

run-test-watch:
	make prepare-to-test
	npm run test:watch $(TEST_ARGS)

run-test-watch-filtered-by-file:
	make prepare-to-test
	npm run test:watch:filter_file $(TEST_ARGS)
