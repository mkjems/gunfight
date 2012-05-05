
components = js/requestAnimationFrame.js js/model.js
target = js/local.js

js/index.js : ${components} 
	@cat ${components} > ${target} 
	@echo "OK"

clean: 
	rm ${target}

