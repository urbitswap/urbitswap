/-  s=swap
|%
++  enjs
  =,  enjs:format
  =>  |%
      ++  flagify
        |=  f=flag:s
        ^-  @t
        (rap 3 (scot %p p.f) '/' q.f ~)
      ++  addrify
        |=  a=@ux
        ^-  @t
        (crip (weld "0x" ((x-co:co 40) a)))
      ++  signify
        |=  a=@ux
        ^-  @t
        (crip (weld "0x" ((x-co:co 130) a)))
      --
  |%
  ++  flag
    |=  f=flag:s
    ^-  json
    s+(flagify f)
  ::
  ++  traders
    |=  t=traders:s
    ^-  json
    %-  pairs
    %+  turn  ~(tap by t)
    |=  [a=@ux s=@p]
    [(addrify a) s+(scot %p s)]
  ::
  ++  action
    |=  [f=flag:s u=update:s]
    ^-  json
    %-  pairs
    =-  ~[['traders' s+(flagify f)] ['update' -]]
    %-  pairs
    :_  ~
    :-  -.u
    ?.  ?=([%asoc *] u)
      ~
    %-  pairs
    :~  ['addr' s+(addrify addr.u)]
        ['sign' s+(signify sign.u)]
    ==
  --
::
++  dejs
  =,  dejs:format
  |%
  ++  nu2   (su ;~(pfix (jest '0x') hex))
  ++  flag  (su ;~((glue fas) ;~(pfix sig fed:ag) ^sym))
  ::
  ++  action
    |=  jon=json
    ;;  action:s
    %.  jon
    %-  ot
    :~  traders+flag
        :-  %update
        %-  of
        :~  init+ul
            drop+ul
            join+ul
            asoc+(ot ~[addr+nu2 sign+nu2])
  ==    ==
  --
--
