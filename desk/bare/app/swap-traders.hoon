/-  traders
/+  s=swap, j=swap-json
/+  config, default-agent, *sss
/+  dbug, verb
|%
+$  state-0
  $:  %0
      our-traders=(map flag:s traders:s)
      sub-traders=_(mk-subs traders ,[%swap %traders @ @ ~])
      pub-traders=_(mk-pubs traders ,[%swap %traders @ @ ~])
  ==
+$  versioned-state
  $%  state-0
  ==
+$  card  card:agent:gall
+$  sign-gall  sign:agent:gall
--
^-  agent:gall
=|  state-0
=*  state  -
=<  =-  ?.  !<(bean (slot:config %debug))  -
        (verb & (agent:dbug -))
    |_  bol=bowl:gall
    +*  tis  .
        def  ~(. (default-agent tis |) bol)
        cor  ~(. +> [bol ~])
    ++  on-init   =^(caz state abet:init:cor [caz tis])
    ++  on-save   !>(state)
    ++  on-load   |=(v=vase =^(caz state abet:(load:cor v) [caz tis]))
    ++  on-poke   |=([m=mark v=vase] =^(caz state abet:(poke:cor m v) [caz tis]))
    ++  on-watch  |=(p=path =^(caz state abet:(watch:cor p) [caz tis]))
    ++  on-peek   peek:cor
    ++  on-leave  on-leave:def
    ++  on-fail   on-fail:def
    ++  on-agent  |=([w=wire s=sign-gall] =^(caz state abet:(agent:cor w s) [caz tis]))
    ++  on-arvo   |=([w=wire s=sign-arvo] =^(caz state abet:(arvo:cor w s) [caz tis]))
    --
|_  [=bowl:gall cards=(list card)]
::
+*  da-traders  =/  da  (da traders ,[%swap %traders @ @ ~])
               (da sub-traders bowl -:!>(*result:da) -:!>(*from:da) -:!>(*fail:da))
    du-traders  =/  du  (du traders ,[%swap %traders @ @ ~])
               (du pub-traders bowl -:!>(*result:du))
::
++  abet  [(flop cards) state]
++  cor   .
++  emit  |=(=card cor(cards [card cards]))
++  emil  |=(caz=(list card) cor(cards (welp (flop caz) cards)))
++  give  |=(=gift:agent:gall (emit %give gift))
++  pull  |=([caz=(list card) sub=_sub-traders] =.(sub-traders sub (emil caz)))
++  push  |=([caz=(list card) pub=_pub-traders] =.(pub-traders pub (emil caz)))
::
++  init
  ^+  cor
  =/  master-flag=flag:s  [!<(@p (slot:config %point)) %master]
  =/  master-core  (ta-abed:ta-core master-flag)
  ?:  =(our.bowl p.master-flag)
    ta-abet:ta-init:master-core
  ta-abet:ta-join:master-core
::
++  load
  |=  =vase
  ^+  cor
  =/  old  !<(versioned-state vase)
  %=    cor
      state
    ?-  -.old
      %0  old
    ==
  ==
::
++  poke
  |=  [=mark =vase]
  ^+  cor
  ?+    mark  ~|(bad-poke/mark !!)
  :: native pokes ::
      %swap-action
    =+  !<(=action:s vase)
    ::  TODO: Not quite right, but okay for now since there's only one
    ::  main trader board
    ?>  (~(has by all-traders) p.action)
    =/  trader-core  (ta-abed:ta-core p.action)
    ?:  =(p.p.action our.bowl)
      ta-abet:(ta-push:trader-core q.action)
    ?:  =(-.q.action %join)
      ta-abet:ta-join:trader-core
    ta-abet:(ta-proxy:trader-core q.action)
  :: sss pokes ::
      %sss-on-rock
    ?-  msg=!<(from:da-traders (fled vase))
      [[%swap *] *]  cor
    ==
  ::
      %sss-fake-on-rock
    ?-  msg=!<(from:da-traders (fled vase))
      [[%swap *] *]  (emil (handle-fake-on-rock:da-traders msg))
    ==
  ::
      %sss-to-pub
    ?-  msg=!<(into:du-traders (fled vase))
      [[%swap *] *]  (push (apply:du-traders msg))
    ==
  ::
      %sss-traders
    =/  res  !<(into:da-traders (fled vase))
    ta-abet:(ta-pull:(ta-abed:ta-core (path2flag:s path.res)) res)
  ==
::
++  watch
  |=  path=(pole knot)
  ^+  cor
  ?+    path  ~|(bad-watch-path/path !!)
      [%swap ship=@ name=@ ~]
    =/  ship=@p    (slav %p ship.path)
    =/  name=term  (slav %tas name.path)
    ?>(=(our src):bowl cor)
  ==
::
++  peek
  |=  path=(pole knot)
  ^-  (unit (unit cage))
  =/  all-traders=(map flag:s traders:s)  all-traders
  ?+    path  [~ ~]
      [%x %config slot=@ ~]
    =/  slot=@tas  (slav %tas slot.path)
    ``atom+!>(!<(@ (slot:config slot)))
  ::
      [%x ship=@ name=@ ~]
    =/  ship=@p    (slav %p ship.path)
    =/  name=term  (slav %tas name.path)
    ``swap-traders+!>((~(got by all-traders) ship name))
  ::
      [%u ship=@ name=@ ~]
    =/  ship=@p    (slav %p ship.path)
    =/  name=term  (slav %tas name.path)
    ``loob+!>((~(has by all-traders) ship name))
  ==
::
++  agent
  |=  [path=(pole knot) =sign:agent:gall]
  ^+  cor
  ?+    path  cor
  :: sss responses ::
      [~ %sss %on-rock @ @ @ %swap %traders @ @ ~]
    (pull ~ (chit:da-traders |3:path sign))
  ::
      [~ %sss %scry-request @ @ @ %swap %traders @ @ ~]
    (pull (tell:da-traders |3:path sign))
  ::
      [~ %sss %scry-response @ @ @ %swap %traders @ @ ~]
    (push (tell:du-traders |3:path sign))
  :: swap proxy response ::
      [%swap ship=@ name=@ ~]
    =/  ship=@p    (slav %p ship.path)
    =/  name=term  (slav %tas name.path)
    ?>  ?=(%poke-ack -.sign)
    ?~  p.sign  cor
    %-  (slog u.p.sign)
    cor
  ==
::
++  arvo
  |=  [path=(pole knot) sign=sign-arvo]
  ^+  cor
  cor
::
++  all-traders
  ^-  (map flag:s traders:s)
  %-  ~(uni by our-traders)
  %-  malt
  ^-  (list [flag:s traders:s])
  %+  turn  ~(tap by read:da-traders)
  |=  [[* * paths=[%swap %traders @ @ ~]] [stale=? fail=? =traders:s]]
  [(path2flag:s paths) traders]
++  ta-core
  |_  [=flag:s =traders:s gone=_|]
  ++  ta-core  .
  ++  ta-abet
    ?.  =(p.flag our.bowl)
      cor
    %_    cor
        our-traders
      ?:(gone (~(del by our-traders) flag) (~(put by our-traders) flag traders))
    ==
  ++  ta-abed
    |=  f=flag:s
    %=  ta-core
      flag     f
      traders  (~(gut by all-traders) f *traders:s)
    ==
  ::
  ++  ta-area  `path`/swap/(scot %p p.flag)/[q.flag]
  ++  ta-up-area  |=(p=path `(list path)`[(welp ta-area p)]~)
  ++  ta-du-path  [%swap %traders (scot %p p.flag) q.flag ~]
  ++  ta-da-path  [p.flag dap.bowl %swap %traders (scot %p p.flag) q.flag ~]
  ++  ta-do-writ
    |=  upd=update:s
    ^-  bean
    ?-  -.upd
      ?(%join %asoc)  %&
      ?(%init %drop)  =(our src):bowl
    ==
  ::
  ++  ta-init
    ?>  (ta-do-writ [%init ~])
    =.  ta-core  (ta-push [%init ~])
    =.  cor  (push (public:du-traders [ta-du-path]~))
    ta-core
  ++  ta-join
    =.  cor  (pull (surf:da-traders ta-da-path))
    ta-core
  ++  ta-leave
    ^+  ta-core
    ?>  (ta-do-writ [%drop ~])
    =.  ta-core  (ta-notify [%drop ~])
    =.  cor  (pull ~ (quit:da-traders ta-da-path))
    ta-core(gone &)
  ::
  ++  ta-notify
    |=  =update:s
    ^+  ta-core
    =/  paths=(list path)  (ta-up-area /)
    ta-core(cor (give %fact paths %json !>((action:enjs:j flag update))))
  ++  ta-proxy
    |=  =update:s
    ^+  ta-core
    =/  =dock  [p.flag dap.bowl]
    =/  =cage  swap-action+!>([flag update])
    ta-core(cor (emit %pass ta-area %agent dock %poke cage))
  ++  ta-pull
    |=  res=into:da-traders
    ^+  ta-core
    =/  =update:s
      ?-  what.res
        %tomb  [%drop ~]
        %wave  q.act.wave.res
        %rock  [%init ~]
      ==
    ?:  ?=(%drop -.update)
      ta-leave
    =.  ta-core  (ta-notify update)
    =.  cor  (pull (apply:da-traders res))
    ta-core
  ++  ta-push
    |=  =update:s
    ^+  ta-core
    ?>  (ta-do-writ update)
    ::  NOTE: Notify *before* state change to avoid errors during deletions.
    =.  ta-core  (ta-notify update)
    ?:  ?=(%drop -.update)
      =.  cor  (push (kill:du-traders [ta-du-path]~))
      ta-core(gone &)
    =.  traders  (apply:s traders bowl [flag update])
    =.  cor  (push (give:du-traders ta-du-path bowl [flag update]))
    ta-core
  --
--
