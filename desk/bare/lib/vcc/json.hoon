/-  v=vcc
|%
++  enjs
  =,  enjs:format
  =>  |%
      ++  flagify
        |=  f=flag:v
        ^-  @t
        (rap 3 (scot %p p.f) '/' q.f ~)
      --
  |%
  ++  flag
    |=  f=flag:v
    ^-  json
    s+(flagify f)
  ::
  ++  traders
    |=  t=traders:v
    ^-  json
    %-  pairs
    %+  turn  ~(tap by t)
    |=  [a=@ux s=@p]
    [(scot %ux a) s+(scot %p s)]
  ::
  ++  action
    |=  [f=flag:v u=update:v]
    ^-  json
    %-  pairs
    =-  ~[['traders' s+(flagify f)] ['update' -]]
    %-  pairs
    [[-.u ?.(?=([%asoc *] u) ~ s+(scot %ux addr.u))]]~
  --
::
++  dejs
  =,  dejs:format
  =,  soft=dejs-soft:format
  |%
  ++  flag  (su ;~((glue fas) ;~(pfix sig fed:ag) ^sym))
  ::
  ++  action
    |=  jon=json
    ;;  action:v
    %.  jon
    %-  ot
    :~  traders+flag
        :-  %update
        %-  of
        :~  init+ul
            drop+ul
            join+ul
            asoc+nu
  ==    ==
  --
--
