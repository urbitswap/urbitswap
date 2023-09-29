/-  *vcc
|%
++  apply
  |=  [=traders =bowl:gall =action]
  ^-  ^traders
  =/  flag=flag   p.action
  =/  upd=update  q.action
  ?+    -.upd  !!
      %ledger-make
    *^traders
  ::
      %ledger-drop
    *^traders
  ::
      %lentry-push
    *^traders
  ==
--
