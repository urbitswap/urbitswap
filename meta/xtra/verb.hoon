::  /cfg/verb.hoon : verbosity enablement configuration
::
::    to deploy locally, run the following:
::
::    cd ./desk/full/cfg/
::    ln ../../../meta/xtra/verb.hoon ./
::
%-  malt
^-  (list [@tas vase])
:~  [%debug !>(%&)]
==
