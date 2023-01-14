all: build

.PHONY : clean

build: dest minify
	@cp index.html ./build/
	@cp -R assets ./build/
	@mv ./build.js ./build/

minify: concat
ifeq ($(shell which uglifyjs),)
	@mv ./temp.js ./build.js
else
	@cat ./temp.js | uglifyjs --compress --mangle > ./build.js
	@rm ./temp.js
endif

# These files need to be combined a specific order due to lexical scoping. For
# simplicity I am avoiding using modules or task runners.
concat:
	@cat './js/connectionhandler.js' './js/mersennetwister.js' './js/fixed.js' './js/constants.js' './js/collision.js' './js/block.js' './js/enemy.js' './js/player.js' './js/spawner.js' './js/gamestate.js' './js/map.js' './js/world.js' './js/gamescene.js' > ./temp.js

dest:
	@mkdir -p ./build

clean:
	@rm -rf ./build