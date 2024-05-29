/-  traders
/+  s=swap, j=swap-json
/+  config, default-agent, *sss
/+  dbug, verb
|%
+$  card       card:agent:gall
+$  sign-gall  sign:agent:gall
+$  state-0
  $:  %0
      our-traders=(map flag:s traders:s)
      sub-traders=_(mk-subs traders ,[%swap %traders @ @ ~])
      pub-traders=_(mk-pubs traders ,[%swap %traders @ @ ~])
  ==
+$  versioned-state
  $%  state-0
  ==
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
  =/  lag=flag:s    [!<(@p (slot:config %point)) %master]
  =/  upd=update:s  ?:(=(our.bowl p.lag) [%init ~] [%join ~])
  ta-abet:(ta-push:(ta-abed:ta-core lag) upd)
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
  ::  native pokes  ::
      %swap-action
    =+  !<([lag=flag:s upd=update:s] vase)
    ~?  !<(bean (slot:config %debug))   [lag upd]
    ta-abet:(ta-push:(ta-abed:ta-core lag) upd)
  ::  sss pokes  ::
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
    =/  lag  (path2flag:s path.res)
    ta-abet:(ta-pull:(ta-abed:ta-core lag) res)
  ==
::
++  watch
  |=  path=(pole knot)
  ^+  cor
  ?+    path  ~|(bad-watch-path/path !!)
      [%swap ship=@ name=@ ~]
    =/  ship=@p    (slav %p ship.path)
    =/  name=term  (slav %tas name.path)
    ?>  =(our src):bowl
    cor
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
  ::  sss responses  ::
      [~ %sss %on-rock @ @ @ %swap %traders @ @ ~]
    (pull ~ (chit:da-traders |3:path sign))
  ::
      [~ %sss %scry-request @ @ @ %swap %traders @ @ ~]
    (pull (tell:da-traders |3:path sign))
  ::
      [~ %sss %scry-response @ @ @ %swap %traders @ @ ~]
    (push (tell:du-traders |3:path sign))
  ::  swap proxy response  ::
      [%swap ship=@ name=@ ~]
    ?>  ?=(%poke-ack -.sign)
    =/  ship=@p    (slav %p ship.path)
    =/  name=term  (slav %tas name.path)
    ?~  p.sign  cor
    ((slog u.p.sign) cor)
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
  ++  ta-area     `path`/swap/(scot %p p.flag)/[q.flag]
  ++  ta-is-new   !(~(has by all-traders) flag)
  ++  ta-is-myn   =(our.bowl p.flag)
  ++  ta-is-src   =(our src):bowl
  ++  ta-up-area  |=(p=path `(list path)`[(welp ta-area p)]~)
  ++  ta-du-path  [%swap %traders (scot %p p.flag) q.flag ~]
  ++  ta-da-path  [p.flag dap.bowl %swap %traders (scot %p p.flag) q.flag ~]
  ++  ta-mk-card  |=([p=@p u=update:s] `card`[%pass ta-area %agent [p dap.bowl] %poke swap-action+!>([flag u])])
  ::
  ++  ta-note
    |=  =update:s
    ^+  ta-core
    ta-core(cor (give %fact (ta-up-area /) %json !>((action:enjs:j flag update))))
  ++  ta-pull
    |=  res=into:da-traders
    ^+  ta-core
    ?<  ta-is-myn
    =/  =update:s
      ?-  what.res
        %rock  [%init ~]
        %tomb  [%drop ~]
        %wave  q.act.wave.res
      ==
    =.  ta-core  (ta-note update)
    ?:  ?=(%drop -.update)
      ta-core(cor (pull ~ (quit:da-traders ta-da-path)), gone &)
    ta-core(cor (pull (apply:da-traders res)))
  ++  ta-push
    |=  =update:s
    ^+  ta-core
    ?>  |(?=(%asoc -.update) ta-is-src)
    ::  NOTE: Notify *before* state change to avoid errors during deletions.
    =.  ta-core  (ta-note update)
    ?-    -.update
        %init
      ?>  ta-is-myn
      =?  cor  ta-is-new  (push (public:du-traders [ta-du-path]~))
      =.  traders  (apply:s traders bowl [flag update])
      ta-core(cor (push (give:du-traders ta-du-path bowl [flag update])))
    ::
        %drop
      ?>  ta-is-myn
      =?  cor  !ta-is-new  (push (kill:du-traders [ta-du-path]~))
      ta-core(gone &)
    ::
        %join
      ?:  |(ta-is-myn !ta-is-new)  ta-core
      ta-core(cor (pull (surf:da-traders ta-da-path)))
    ::
        %asoc
      ?.  ta-is-myn  ta-core(cor (emit (ta-mk-card p.flag update)))
      ?<  ta-is-new
      =.  traders  (apply:s traders bowl [flag update])
      ta-core(cor (push (give:du-traders ta-du-path bowl [flag update])))
    ==
  --
--
