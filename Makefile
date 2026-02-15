.PHONY: help install dev electron-dev build electron-build clean

help:
	@echo "POS Application Build Commands"
	@echo "=============================="
	@echo "make install          - Install all dependencies"
	@echo "make dev              - Run development servers (web only)"
	@echo "make electron-dev     - Run in Electron development mode"
	@echo "make build            - Build client for production"
	@echo "make electron-build   - Build Electron app for current platform"
	@echo "make electron-build-mac   - Build Electron app for macOS"
	@echo "make electron-build-win   - Build Electron app for Windows"
	@echo "make electron-build-all   - Build Electron app for all platforms"
	@echo "make clean            - Clean build artifacts"

install:
	npm install
	cd client && npm install && cd ..
	cd server && npm install && cd ..

dev:
	npm run dev

electron-dev:
	npm run electron-dev

build:
	npm run client-build

electron-build:
	npm run electron-build

electron-build-mac:
	npm run electron-pack -- --mac

electron-build-win:
	npm run electron-pack -- --win

electron-build-all:
	npm run electron-pack -- --mac --win

clean:
	rm -rf dist
	rm -rf client/dist
	rm -rf node_modules
	cd client && rm -rf node_modules && cd ..
	cd server && rm -rf node_modules && cd ..
