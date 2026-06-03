#!/bin/bash

# Where are we located
SRC=$(cd `dirname $0` ; /bin/pwd)
cd ${SRC}
echo ${SRC}

npm start
