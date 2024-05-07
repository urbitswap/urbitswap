::  /cfg/test.hoon : debug configuration file
::
::    to deploy locally, run the following:
::
::    cd ./desk/full/cfg/
::    ln ../../../meta/xtra/test.hoon ./
::
%-  malt
^-  (list [@tas vase])
:~  [%debug !>(%&)]
    [%chain !>(`@tas`%sepolia)]
    [%point !>(~zod)]
==
