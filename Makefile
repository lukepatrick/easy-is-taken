# Shortcuts for the talk. Run `make` or `make help` for the list.
# The deck commands wrap the npm scripts in deck/package.json.

DECK := deck
URL  := http://127.0.0.1:8765/\#/presenter/1

.DEFAULT_GOAL := help
.PHONY: help install present build serve dev shoot fallback pdf refresh previews open-fallback

help: ## List the shortcuts
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-14s %s\n", $$1, $$2}'

install: ## Install deck dependencies (system Chrome is used, so no Playwright download)
	cd $(DECK) && npm ci --ignore-scripts

present: build ## Build the deck, then serve it; open the presenter view printed below
	@echo ""
	@echo "  Presenter view: $(URL)"
	@echo "  Audience view:  http://127.0.0.1:8765/"
	@echo "  Ctrl-C to stop."
	@echo ""
	cd $(DECK) && npm run serve

build: ## Generate slides.md and build the static deck into deck/dist
	cd $(DECK) && npm run build

serve: ## Serve the last build on port 8765 (no rebuild)
	@echo "  Presenter view: $(URL)"
	cd $(DECK) && npm run serve

dev: ## Live dev server with reload on port 3030
	cd $(DECK) && npm run dev

shoot: ## Screenshot every slide and click state (needs `make serve` in another terminal)
	cd $(DECK) && npm run shoot

fallback: ## Rebuild deck/fallback.html from the screenshots
	cd $(DECK) && npm run fallback

pdf: ## Export deck/easy-is-taken.pdf through the system Chrome
	cd $(DECK) && npm run export:pdf

refresh: build ## After an edit: build, then screenshots, fallback and PDF (needs `make serve` running)
	cd $(DECK) && npm run shoot && npm run fallback && npm run export:pdf

open-fallback: ## Open the one-file offline fallback in the default browser
	xdg-open $(DECK)/fallback.html

previews: ## Re-render the scenario map previews and research/gallery.html
	python3 tools/render_owm.py
