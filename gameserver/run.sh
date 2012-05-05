#!/bin/bash

# Where are we located
SRC=$(cd `dirname $0` ; /bin/pwd)
cd ${SRC}
echo ${SRC}

sudo NODE_PATH=${SRC}/gameModules node server.js

